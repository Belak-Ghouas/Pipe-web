const mongoose = require('mongoose')

const model = mongoose.Schema({
    pipe_user_id:String,
    access_token:String,
    token_type: String,
    scope: [String],
    bot_user_id: String,
    app_id: String,
     team: {
       name: String,
       id:String
    },
    enterprise: {
     name: String,
     id: String
     },
     authed_user: {
      id: String,
     scope: [String],
     access_token: String,
     token_type:String
        }

});

module.exports = new mongoose.model("SlackToken", model)