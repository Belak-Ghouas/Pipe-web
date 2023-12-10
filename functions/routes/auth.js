const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");
const rounds = 10;

const jwt = require("jsonwebtoken");
const functions = require("firebase-functions");
const authController = require('../controllers/authController')

router.post("/login", (req, res) => {
  User.findOne({ email: req.body.email })
    .then((user) => {
      functions.logger.info("user =" + user);
      if (!user) {
        req.flash(
          "error_msg",
          "Incorrect email or password! Please check and try again."
        );
        return res.redirect("/login");
      } else {
        bcrypt.compare(req.body.password, user.password, (error, match) => {
          if (error) return res.status(500).json(error);

          if (match) {
            const token = generateToken({ email: user.email, userId: user._id });
            res.set({
              "Authorization": "bearer " + token,
            });


            res.status(200);
            res.body = { token: token };
            req.session.userId = user._id;
            req.session.username = user.username;
            functions.logger.info("logged in successfully try to redirect to '/' with the session " + req.session.userId + " " + req.session.username)
            return res.redirect("/");
          } else {
            req.flash(
              "error_msg",
              "Incorrect email or password! Please check and try again."
            );
            functions.logger.error("Failed to logged in try to redirect to '/login'")
            return res.redirect("/login");
          }
        });
      }
    })
    .catch((error) => {
      functions.logger.info("error database =" + error);
      req.flash(
        "error_msg",
        "Internal errors ; please try after"
      );
      return res.redirect("/login");
    });
});

router.post("/register", (req, res) => {
  functions.logger.info(req.body);
  person = { username: req.body.username, email: req.body.email, password: req.body.password };
  if (areFieldsCorrect(person)) {
    bcrypt.hash(person.password, rounds, (error, hash) => {
      if (error) return res.status(500).json(error);

      User.findOne({ email: req.body.email })
        .then((user) => {
          if (user == null) {
            const newUser = User({ email: person.email, password: hash, username: person.username });
            newUser.save()
              .then((user) => {
                req.flash(
                  "success_msg",
                  "registred successfully , please logIn"
                );
                return res.redirect("/login");
              })
              .catch((error) => {
                req.flash(
                  "error_msg",
                  "Unknown error"
                );
                return res.redirect("/register");
              });
          } else {
            res.status(201).json("Use another email adress");
          }
        });
    });
  } else {
    req.flash(
      "error_msg",
      "fields are incorrect"
    );
    return res.redirect("/register");
  }
});


router.get("/logout", (req, res) => {
  if (req.session) {
    delete req.session.userId;
  }
  req.flash("success_msg", "Your are logged out successfully");
  res.redirect("/login");
});

router.post("/register", (req, res) => {
  // res.redirect('/register')
});

router.post("/delete", (req, res) => {
  authController.deleteUser(req.session.userId).then((response) => {
    functions.logger.info('Deleted document:', response);
    delete req.session.userId;
    return res.redirect("/api/auth/logout")
  }).catch((error) => {

    req.flash(
      "error_msg",
      "user not found internal error"
    );
    res.redirect("/")
  });
});


function generateToken(user) {
  return jwt.sign({ data: user }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
}


function areFieldsCorrect(newUser) {
  return !(isUndefindOrEmpty(newUser.username) || isUndefindOrEmpty(newUser.email) || isUndefindOrEmpty(newUser.password));
}

function isUndefindOrEmpty(field) {
  return (field == undefined || field == "");
}


module.exports = router;
