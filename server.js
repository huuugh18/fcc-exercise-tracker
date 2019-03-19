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
        if(data) { 
            console.log('DATA',data)
            return res.json({error:`user name ${userInput} taken`, id:data._id}) 
        };
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
app.post('/api/exercise/add', (req,res) => {
    const userId = req.body.userId
    // validate date, if invalid return current date
    const exDate = new Date(req.body.date) != 'Invalid Date' ? new Date(req.body.date) : new Date()
    const exObject = {
        description: req.body.description,
        duration: req.body.duration,
        date: exDate,
    }
    User.findById(userId, (err, data) => {
        if(err){console.log(err)};
        if(!data){return res.json({error:'user id not found'})}
        data.log.push(exObject)
        data.save((err,data) => {
            if(err){console.log(err)};
            res.json(data);
        })
    })
    // res.send(exObject)
    
})

// 4) get full ex log of any user - GET /api/exercise/log with param userId(_id)
// return user object with added array log and count (total exercise count)
// url /api/exercise/log/5c8c1ea8ff9ae02394fdb112?from=2010-01-01&to=2015-12-31
// /api/exercise/log/5c8c1ea8ff9ae02394fdb112?from=2010-01-01&limit=2
// 5) can get part of ex log with params of from & to or limit

app.get('/api/exercise/log/:userId', (req,res) => {
    const userId = req.params.userId
    const queries = req.query
    let filteredLog
    console.log(queries)
    User.findById(userId, (err,data) => {
        if(err){ console.log(err) }
        let userObject = data
        if(queries.limit){
            filteredLog = data.log.sort((x,y) => x.date - y.date).filter(x => x.date >= new Date(queries.from)).slice(0,queries.limit)
            userObject.log = filteredLog
            res.json(userObject)
        }
        else if(queries.to){
            filteredLog = data.log.sort((x,y) => x.date - y.date).filter(x => x.date >= new Date(queries.from) && x.date <= new Date(queries.to))
            userObject.log = filteredLog
            res.json(userObject)
        }
        else {
            userObject.total_exercise_count = userObject.log.length
            res.json(userObject)
        }
    })

})
    





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
