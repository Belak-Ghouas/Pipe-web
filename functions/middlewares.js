const jwt = require("jsonwebtoken");
const functions = require("firebase-functions");


exports.authenticateToken = function(req, res, next) {
  const authHeader = req.headers["authorization"];

  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) {
     functions.logger.info("token is null");
    res.status(403);
    return res.send({error: "token is null"});
  } else {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) {
         functions.logger.info("failed to verify the token due to "+err);
         return res.status(401).send(err);
      }
      req.user = user.data;
      next();
    });
  }
};
