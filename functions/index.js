const functions = require("firebase-functions");

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const express = require("express");
require("dotenv").config();
const path = require("path");
const authRoute = require("./routes/auth");
const postsRoute = require("./routes/posts");
const slackRoute = require("./routes/slack");

const mongoose = require("mongoose");
const mongoStore = require("connect-mongo");
const session = require("express-session");
const flash = require("connect-flash");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const dbURI = "mongodb+srv://"+process.env.DATABASE_USERNAME+":"+process.env.DATABASE_PASSWORD+
"@sms-pipe-database.hu6fyrs.mongodb.net/?retryWrites=true&w=majority";
const autheMiddleWare = require("./middlewares");
const sessionMiddleWare = require('./sessionmiddleware')
const sessionStorage = mongoStore.create({
  mongoUrl: dbURI,
  collectionName: "sessions",
  autoRemove: "native",
});
const app = express();
app.set("views", path.join(__dirname, "public"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "./node_modules/bootstrap/dist/css")));
app.use(express.static(path.join(__dirname, "./node_modules/bootstrap/dist/js")));
app.use(express.static(path.join(__dirname, "./node_modules/jquery/dist")));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.use(bodyParser.json())
app.use(session({
  name: "__session",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {maxAge: 24 * 60 * 60 * 1000}, // 24 hours
  store: sessionStorage,
}));
// ------------ Connecting flash ------------//
app.use(flash());

// ------------ Global variables ------------//
app.use(function(req, res, next) {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  next();
});

app.use("/api/auth", authRoute);
app.use("/user", postsRoute);
app.use("/slack", slackRoute);


/*
///////////////////////////////////
//import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app"s Firebase configuration
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

app.get("/", sessionMiddleWare.sessionState, function(req, res) {
  functions.logger.info("Go to home page  you are authenticated "+req.session.username);
  res.render("pages/about", {"username": req.session.username});
});


app.get("/login", (req, res)=>{
  const userId = req.session.userId;
  if (userId) {
    res.redirect("/");
  } else {
    res.render("pages/login");
  }
});

app.get("/mobile", autheMiddleWare.authenticateToken, (req, res)=>{
  functions.logger.info("come from mobile");
  res.render("pages/about", {"username": req.session.username});
});

/*
app.post("/login",(req,res)=>{
  res.redirect("api/auth/login");
})*/
app.get("/register", (req, res)=>{
  res.render("pages/register");
});


mongoose.connect(dbURI, {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;

db.on("error", (err)=>{
  functions.logger.info(err);
});
db.once("open", () => {
  functions.logger.info("DB started successfully");
});

app.listen(3000);

exports.app = functions.https.onRequest(app);