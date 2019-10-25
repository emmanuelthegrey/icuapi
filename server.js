const experss = require('express');
const app = experss();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const knex = require('knex');
const clarifai = require('clarifai');

const register = require('./controllers/register')






const pg = knex({
	client: 'pg',
	connection: {
		host: '127.0.0.1',
		user: 'postgres',
		password: 'root',
		database: 'icu'
	}
});

	
const vision = new Clarifai.App({
	apiKey: '2e160a4e9ef1423ba0d8f58490998775'
});


const saltRounds = 10;

app.use(bodyParser.json());
app.use(cors());

app.get('/', (req, res) => {

})

app.post('/signin', (req, res) => {

	const { email, password } = req.body;

	if(!email || !password){
	 return	res.status(400).json('incorrect form submission');
	}


	pg.select('email', 'hash').from('login')
		.where('email', '=', req.body.email)
		.then(data => {
			bcrypt.compare(password, data[0].hash, function (err, resp) {
				if (resp) {
					return pg.select('*').from('users')
						.where('email', '=', email)
						.then(user => {
							res.json(user[0])
						})
						.catch(err => res.status(400).json('unable to get user'))
				} else {
					res.status(400).json('wrong credentials')
				}
			});
		})
		.catch(err => res.status(400).json('wrong credentials'))
})

app.post('/register', (req, res) => {register.handleRegister(req, res, pg, bcrypt)}) 

app.get('/profile/:id', (req, res) => {
	const { id } = req.params;

	pg.select('*').from('users').where({ id })
		.then(user => {
			if (user.length) {
				res.json(user[0])
			} else {
				res.status(400).json("no such user")
			}
		}).catch(err => res.status(400).json("Error getting user"))

})

app.post('/imageurl', (req, res) => { 	handleVisionApiCall(req.body.input, res) })

const handleVisionApiCall = (input, res) => {

	vision.models.predict( Clarifai.FACE_DETECT_MODEL, input )
	  .then(data => {
		  res.json(data);
	  })
	  .catch( err => {res.status(400).json(err)})
}

app.put('/image', (req, res) => {
	const { id } = req.body;
	pg('users').where("id", '=', id)
		.increment('entries', 1)
		.returning('entries')
		.then(entries => {
			res.json(entries[0]);
		})
		.catch(err => res.status(400).json('unable to update image entry count'))
})

app.listen(3000, () => {
	console.log('app is running');
})