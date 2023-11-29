const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const mySecret = process.env['MONGO_URI'];
const bodyParser = require('body-parser');


// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Configure middleware to parse data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// create user schema
const userModel = mongoose.model('usernames', new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
}))

// post created username to db and return result 
app.post('/api/users', async (req, res) => {
  const curUsername = req.body['username'];

  try {
    const newUser = new userModel({
      username: curUsername,

    });

    await newUser.save();

    const existingUser = await userModel.findOne({ username: curUsername });

    res.json(existingUser)


  }
  catch (error) {
    console.error('Error saving user:', error);
    return res.status(500).send({ error: 'Internal Server Error' });
  }

}
);

app.get('/api/users', async (req, res) => {

  try {
    const allUsers = await userModel.find().exec()

    return res.json(allUsers)
  }
  catch (error) {
    res.status(500).json({ error: "Internal server error" })
  }
})


const exerciseModel = mongoose.model('log', new mongoose.Schema({
  user_id: { type: String, required: true },
  description: String,
  duration: Number,
  date: Date,
}))

app.post('/api/users/:_id/exercises', async (req, res) => {
  const { description, duration, date } = req.body


  try {
    const id = req.params._id;

    const existingUser = await userModel.findById(id)

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const exerciseLog = new exerciseModel({
      user_id: id,
      description,
      duration,
      date: date ? new Date(date) : new Date()
    })

    const exerciseEntry = await exerciseLog.save()

    res.json({
      _id: id,
      username: existingUser.username,
      description: exerciseEntry.description,
      duration: exerciseEntry.duration,
      date: new Date(exerciseEntry.date).toDateString()
    })

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' }
    );
  }
});


app.get('/api/users/:_id/logs', async (req, res) => {

  const from = req.query.from ? new Date(req.query.from) : new Date('0000-01-01');
  const to = req.query.to ? new Date(req.query.to) : new Date();
  const limit = req.query.limit ? req.query.limit : 0;

  const id = req.params._id;

  const existingUser = await userModel.findById(id)

  if (!existingUser) {
    return res.send('user not found')
  }

  const exercises = await exerciseModel.find({
    user_id: id,
    date: { $gte: from, $lte: to }
  }).limit(+limit);

  const log = exercises.reduce((acc, cur) => {
    acc.push({
      description: cur.description,
      duration: cur.duration,
      date: cur.date.toDateString()
    });
    return acc;
  }, []);

  res.json({
    username: existingUser.username,
    count: exercises.length,
    _id: existingUser._id,
    log
  });
});



mongoose
  .connect(mySecret, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    app.listen(port, function() {
      console.log(`Listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });




