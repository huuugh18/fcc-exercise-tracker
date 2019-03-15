const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')
const mongo = require('mongodb');
const mongoose = require('mongoose');
const MongoClient = require('mongodb').MongoClient;
const Schema = mongoose.Schema

// connect to mongo database
process.env.MONGO_URI = 'mongodb+srv://huuugh18:something@cluster0-pia27.mongodb.net/test?retryWrites=true';
const db = mongoose.connect(process.env.MONGO_URI, {useNewUrlParser:true} )
.then(() => console.log('CONNECTED TO MONGODB'))
.catch(err => console.log(err))

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())



app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const userSchema = new Schema ({
    user_name: {type: String, required: true},
    log: [{
        description: {type:String},
        duration: {type: Number},
        date: {type: Date, default: Date.now}
    }],
});
const User = mongoose.model('User', userSchema)
// const exerciseSchema = new Schema({
//     description: {type: String, required: true},
//     duration: {type: Number, required:true},
//     date: {type: String, required: true}
// })
// const Exercise = mongoose.model('Exercise', exerciseSchema)
// 1) add a user on  - POST /api/exercise/new-user
// return object with username and db id
// check if username already in use
app.post('/api/exercise/new-user', (req,res) => {
    const userInput = req.body.username;
    User.findOne({user_name:userInput}, (err, data) =>{
        if(err){console.log(err)};
        // if data null carry on with adding user
        // if data not null - user iname in use 
        if(data) { return res.json({error:`user name ${userInput} taken`}) };
        const userDB = new User ({ user_name: userInput });
        userDB.save( (err,data) => {
            if(err){console.log('SAVE ERROR:',err)}
            res.json({user_name:data.user_name,userId:data._id});
        });
    });
});
// 2) get array of all users - GET /api/exercise/users
// return array of objects with username and _id for each user
app.get('/api/exercise/users', (req,res) => {
    User.find({},{user_name:true,_id:true}, (err,data) => {
        if(err){console.log(err)}
        res.json(data);
    })
})

// 3)add an exercise log to a user - POST /api/exercise/add
// get user id from form, log to that user - check to make sure user exists
// log = {description, duration, date(optional, if blank default to current date)}
// return user object with exercise fields added
app.post('/api/exercise/add', (req,res) =>{
    const userId = req.body.userId
    // validate date, if invalid return current date
    const exDate = new Date(req.body.date) != 'Invalid Date' ? new Date(req.body.date) : new Date()
    const exObject = {
        description: req.body.description,
        duration: req.body.duration,
        date: exDate,
    }
    console.log('BEFORE',req.body.date,'AFTER',exDate)
    res.send(exObject)
    // User.findById(userId, (err, data) => {
    //     if(err){console.log(err)};
    //     if(!data){return res.json({error:'user id not found'})}
    //     data.log.push(exObject)
    //     data.save((err,data) => {
    //         res.json(data)
    //     })
    // })

})

// 4) get full ex log of any user - GET /api/exercise/log with param userId(_id)
// return user object with added array log and count (total exercise count)

// 5) can get part of ex log with params of from & to or limit
// date format yyyy-mm-dd, limit = int

// check if id for user valid


// post logs of user

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
