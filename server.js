const express = require('express')
require("dotenv").config()
var path = require('path');
const authRoute = require('./routes/auth')
const postsRoute = require('./routes/posts')
const slackRoute = require('./routes/slack')
const bcrypt = require('bcrypt')
const mongoose = require("mongoose")
const  dbURI = "mongodb://localhost/pipe"
const autheMiddleWare = require('./middlewares')

const app = express()
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname,'views/public')));
app.use(express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')));
app.use(express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')));
app.use(express.static(path.join(__dirname, 'node_modules/jquery/dist')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }))
app.use('/api/auth', authRoute)
app.use('/user',postsRoute)
app.use('/slack',slackRoute)

app.get('/',autheMiddleWare.authenticateToken,function (req, res) {
    console.log("Go to home page")
    res.render('pages/home')
    });


app.get('/login',(req,res)=>{ 
  res.render('pages/login')
})




mongoose.connect(dbURI , {useNewUrlParser: true, useUnifiedTopology: true})
const db = mongoose.connection

db.on("error", (err)=>{console.error(err)})
db.once("open", () => {console.log("DB started successfully")})


app.listen(3000)