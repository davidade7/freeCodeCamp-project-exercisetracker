const express = require('express')
const app = express()
const cors = require('cors')
// require('dotenv').config()
const mongoose = require('mongoose')

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Connection to mongoose
mongoose.connect(process.env['MONGO_URI']);

// Creation of schemas
const userSchema = new mongoose.Schema({
  username: String,
});

const exerciseSchema = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: Date,
  userId: String  
})

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

// Route POST /api/users to add a user in DB
app.post('/api/users', async(req, res) => {
  try {
    let newUser = await new User({username: req.body.username}).save();
    res.json({username: newUser.username, _id: newUser._id})
  }
  catch (error) {
    res.json({
      error: error.message
    });
  }
})

// Route GET /api/users to get an array of all users in DB
app.get('/api/users', async(req, res) => {
  try {
    let usersArray = await User.find({})
    res.json(usersArray)  
  }
  catch (error) {
    res.json({
      error: error.message
    });
  }
})

// Route POST /api/users/:_id/exercises to add an exercise in DB
app.post('/api/users/:_id/exercises', async(req, res) => {
  let id = req.params._id

  try {
    let findUser = await User.findById(id);
    // Return this message if user not found
    if (!findUser) {
    res.end("User not found");
    }
    
    let description = req.body.description;
    let duration = req.body.duration;
    let date = req.body.date ? new Date(req.body.date) : new Date();

    let exerciseToAdd = await new Exercise({username: findUser.username, description: description, duration: duration, date: date, userId: id}).save();
    res.json({
      username: exerciseToAdd.username,
      description: exerciseToAdd.description,
      duration: exerciseToAdd.duration,
      date: new Date(exerciseToAdd.date).toDateString(),
      _id: id
    })
  }
  catch (error) {
    res.json({
      error: error.message
    });
  }
})

// Route GET /api/users/:id/logs
app.get('/api/users/:id/logs', async(req, res) => {
  let id = req.params.id;

  // Optionnal Parameters
  console.log(req.query)
  let from = req.query.from ? new Date(req.query.from) : new Date(0);;
  let to = req.query.to ? new Date(req.query.to) : new Date();;
  let limit = req.query.limit ? req.query.limit : 0;;
  
  try {
    let findUser = await User.findById(id);
    // Return this message if user not found
    if (!findUser) {
    res.end("User not found");
    }

    // Query to find exercises
    let resultLog = await Exercise.find({userId: id}).where('date').gte(from).lte(to).select(["description", "duration", "date"]).limit(limit);

    let resultJson = []
    for (let i = 0; i < resultLog.length; i++) {
      resultJson.push({
        description: resultLog[i].description,
        duration: resultLog[i].duration,
        date: new Date(resultLog[i].date).toDateString()
      })
    }

    // response
    res.json({
      username: findUser.username,
      count: resultLog.length,
      _id: id,
      log: resultJson
    })
  }
  catch (error) {
    res.json({
      error: error.message
    });
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
