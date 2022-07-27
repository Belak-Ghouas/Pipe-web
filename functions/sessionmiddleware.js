const functions = require("firebase-functions");

exports.sessionState = function(req, res, next) {
  const userId = req.session.userId;
  functions.logger.info("session middleware "+req.session.userId+ " "+req.session.username)
  if (userId) {
    functions.logger.info("User have a session")
    return next();
  } else {
    functions.logger.error("User don't have userId session redirect to login")
    req.session.destroy();
    return res.redirect("/login");
  }
};
