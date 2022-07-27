const express = require('express')
require("dotenv").config()
var path = require('path');
const authRoute = require('./routes/auth')
const postsRoute = require('./routes/posts')
const slackRoute = require('./routes/slack')
const bcrypt = require('bcrypt')
const mongoose = require("mongoose")
const  dbURI = "mongodb+srv://"+process.env.DATABASE_USERNAME+":"+process.env.DATABASE_PASSWORD+"@sms-pipe-database.hu6fyrs.mongodb.net/?retryWrites=true&w=majority"
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

/*
///////////////////////////////////
//import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCdJVSqkg-muFtl5yb0lxoPK9jsrzTLzzo",
  authDomain: "sms-pipe-web.firebaseapp.com",
  projectId: "sms-pipe-web",
  storageBucket: "sms-pipe-web.appspot.com",
  messagingSenderId: "315836514127",
  appId: "1:315836514127:web:709a9b752945e5558e0f3a"
};

// Initialize Firebase
const firebase = initializeApp(firebaseConfig);

////////////////////
*/

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