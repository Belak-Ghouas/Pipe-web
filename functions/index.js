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
const User = require("./models/user");
const constants = require("./utils/Constants");
var axios = require('axios');
const mongoose = require("mongoose");
const mongoStore = require("connect-mongo");
const session = require("express-session");
const flash = require("connect-flash");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const dbURI = "mongodb+srv://" + process.env.DATABASE_USERNAME + ":" + process.env.DATABASE_PASSWORD +
  "@sms-pipe-database.hu6fyrs.mongodb.net/?retryWrites=true&w=majority";
const autheMiddleWare = require("./middlewares");
const sessionMiddleWare = require('./sessionmiddleware');
const authController = require('./controllers/authController')

const { json } = require("body-parser");
const { debug } = require("console");
const sessionStorage = mongoStore.create({
  mongoUrl: dbURI,
  collectionName: "sessions",
  autoRemove: "native",
});

const jwt = require("jsonwebtoken");
const app = express();
app.set("views", path.join(__dirname, "public"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "./node_modules/bootstrap/dist/css")));
app.use(express.static(path.join(__dirname, "./node_modules/bootstrap/dist/js")));
app.use(express.static(path.join(__dirname, "./node_modules/jquery/dist")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(bodyParser.json())
app.use(session({
  name: "__session",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 24 * 60 * 60 * 1000 * 3 }, // 24 hours
  store: sessionStorage,
}));
// ------------ Connecting flash ------------//
app.use(flash());

// ------------ Global variables ------------//
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  next();
});

app.use("/api/auth", authRoute);
app.use("/user", postsRoute);
app.use("/slack", slackRoute);


app.get("/", sessionMiddleWare.sessionState, function (req, res) {
  functions.logger.info("Go to home page  you are authenticated " + req.session.username);
  res.render("pages/about", { "username": req.session.username });
});


app.get("/login", (req, res) => {
  const userId = req.session.userId;
  if (userId) {
    res.redirect("/");
  } else {
    res.render("pages/login");
  }
});

app.get("/mobile/slack/internal", (req, res) => {
  functions.logger.info("come from mobile to home");
  const token = req.query.my_ticket
  if (token == undefined) return res.status(401).send("token param query is null");

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      functions.logger.info("failed to verify the token due to " + err);
      return res.status(401).send(err);
    }

    req.user = user.data;

    const userId = req.user.userId
    if (userId == undefined) {
      functions.logger.error("user id is undefined" + req.session.username + " " + req.session.toString());
      return res.status(401).json({
        error: {
          errorCode: constants.USER_NOT_FOUND_ERROR,
          message: "User not found"
        }
      });
    } else {
      User.findOne({ _id: userId })
        .then((user) => {
          if (!user) {
            functions.logger.error("user not found on the database for this id " + req.session.userId);
            return res.status(401).json({
              error: {
                errorCode: constants.USER_NOT_FOUND_ERROR,
                message: "User not found"
              }
            });
          } else {
            req.session.userId = user._id;
            req.session.username = user.username;
            res.redirect("/slack/slackcode");
            //  res.render("pages/about", {"username": req.session.username});
          }
        }).catch((error) => {
          functions.logger.info("error database =" + error);

          return res.status(401).send("user is not found in database");
        });
    }
  });

});

app.get("/mobile/user", autheMiddleWare.authenticateToken, (req, res) => {
  const userId = req.user.userId
  if (userId == undefined) {
    functions.logger.error("user id is undefined" + req.session.username + " " + req.session.toString());
    return res.status(401).json({
      error: {
        errorCode: constants.USER_NOT_FOUND_ERROR,
        message: "User not found"
      }
    });
  }

  User.findOne({ _id: userId })
    .then((user) => {
      if (!user) {
        functions.logger.error("user not found on the database for this id " + req.session.userId);
        return res.status(401).json({
          error: {
            errorCode: constants.USER_NOT_FOUND_ERROR,
            message: "User not found"
          }
        });
      } else {
        functions.logger.info("mobile user refresh successfully with token");
        const response = user.toObject();
        response._id = user._id.toString()
        delete response["password"]
        delete response.__v
        return res.status(200).json({ user: response });
      }
    }).catch((error) => {
      functions.logger.info("error database =" + error);

      return res.status(401).send("user is not found in database");
    });
})


app.post("/mobile/login", (req, res) => {

  authController.login(req.body.email, req.body.password).then((response) => {
    return res.status(200).send(JSON.stringify(response))
  }).catch((error) => {

    switch (error) {
      case constants.EMPTY_FIELDS_ERROR: {
        return res.status(400).json({
          error: {
            errorCode: constants.EMPTY_FIELDS_ERROR,
            message: "Empty fields"
          }
        });
        break;
      }
      case constants.USER_NOT_FOUND_ERROR:
        return res.status(401).json({
          error: {
            errorCode: constants.USER_NOT_FOUND_ERROR,
            message: "User not found"
          }
        });
        break;

      case constants.WRONG_EMAIL_OR_PASSWORD_ERROR:
        return res.status(401).json({
          error: {
            errorCode: constants.WRONG_EMAIL_OR_PASSWORD_ERROR,
            message: "wrong email or password"
          }
        });
        break;

      case constants.INTERNAL_ERROR:
        return res.status(500).json({
          error: {
            errorCode: constants.INTERNAL_ERROR,
            message: "wrong email or password"
          }
        });
        break;
      default:
        return res.status(500).json({
          error: {
            errorCode: constants.INTERNAL_ERROR,
            message: "unknow error"
          }
        });
        break;
    }
  });
});

app.post("/mobile/refresh_token", (req, res) => {
  functions.logger.info("mobile user try to refresh token");
  refresh_token = { refresh: req.body.resfresh_token };
  if (refresh_token == undefined) return res.status(401).send()

  return res.status(401).send()
});

app.get("/register", (req, res) => {
  res.render("pages/register");
});


app.get("/cgu", (req, res) => {
  res.render("pages/cgu");
});

app.get("/delete", sessionMiddleWare.sessionState, (req, res) => {
  functions.logger.info("go to delete page");
  res.render("pages/delete");
});

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on("error", (err) => {
  functions.logger.info(err);
});
db.once("open", () => {
  functions.logger.info("DB started successfully");
});

app.listen(3000);

exports.app = functions.https.onRequest(app);
