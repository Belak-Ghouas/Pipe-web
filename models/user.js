const mongoose = require('mongoose')

const model = mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    username:{
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    slack_access_token:String,
    slack_token_type: String,
    scope: [String],
    bot_user_id: String,
    slack_app_id: String,
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

module.exports = new mongoose.model("User", model)