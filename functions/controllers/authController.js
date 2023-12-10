
const User = require("../models/user");
const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");
const functions = require("firebase-functions");
const constants = require("../utils/Constants");


exports.login = (email, password) => {
  return new Promise((resolve, reject) => {
    if (email == undefined || password == undefined) {
      functions.logger.error("login mobile failed due to empty fields");
      reject(constants.EMPTY_FIELDS_ERROR);
    }

    User.findOne({ email: email })
      .then((user) => {
        functions.logger.info("user =" + user);
        if (!user) {
          functions.logger.error("Incorrect email or password! Please check and try again.");
          return reject(constants.USER_NOT_FOUND_ERROR);
        } else {
          bcrypt.compare(password, user.password, (error, match) => {
            if (error) return reject(constants.WRONG_EMAIL_OR_PASSWORD_ERROR);

            if (match) {
              const token = generateToken({ email: user.email, userId: user._id });
              functions.logger.info("mobile logged in successfully")
              const userOb = user.toObject()
              userOb._id = user._id.toString()
              delete userOb.password
              delete userOb.__v

              resolve({ token: token, user: userOb })
            } else {
              functions.logger.error("Mobile Failed to logged in , wrong password email:" + email)
              return reject(constants.WRONG_EMAIL_OR_PASSWORD_ERROR)
            }
          });
        }
      }).catch((error) => {
        functions.logger.error("Mobile Failed to logged in , catch in user find one " + error)
        return reject(constants.INTERNAL_ERROR)
      });

  });
}

exports.deleteUser = (id) => {
  return new Promise((resolve, reject) => {
    if (id == undefined || id == "") {
      functions.logger.error("delete user , user id is null or empty");
      return reject(constants.EMPTY_FIELDS_ERROR);
    }
    User.findByIdAndDelete(id, (err, result) => {
      if (err) {
        functions.logger.error('Error executing findOneAndDelete:', err);
        return reject(constants.INTERNAL_ERROR);
      } else if (result) {
        functions.logger.info('Deleted document:', result);
        return resolve(result)
      } else {
        return reject(constants.USER_NOT_FOUND_ERROR);
      }
    });

  })
}


function generateToken(user) {
  return jwt.sign({ data: user }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "10d" });
}