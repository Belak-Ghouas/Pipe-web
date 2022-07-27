const express = require('express')
const router = express.Router()
const Post = require('../models/post')
const SlackToken = require('../models/slack_token')
const autheMiddleWare = require('../middlewares')
const functions = require("firebase-functions");

router.get('/posts', autheMiddleWare.authenticateToken,(req, res) => {

    const userId = req.user.userId
     functions.logger.info(req.user)
     functions.logger.info(userId)
   
    if(userId != null){
        const collection = Post.find({userId: userId},(error,postsFound)=>{
            if(error) return  functions.logger.info(error)

            
            res.status(200).json({'posts':postsFound}).send()

        })}
});

router.post('/post',autheMiddleWare.authenticateToken,(req, res) => {

    const userId = req.user?.userId
    const post = req.body.post
    if(userId != null && post.content!= null){
     Post.create({content : post.content , title :post.title , userId: userId},(error,instance)=>{
        if(error) return  functions.logger.info(error)
        SlackToken.create({
                access_token: "xoxb-17653672481-19874698323-pdFZKVeTuE8sk7oOcBrzbqgy",
                token_type: "bot",
                scope: "commands,incoming-webhook",
                bot_user_id: "U0KRQLJ9H",
                app_id: "A0KRD7HC3",
                team: {
                    name: "Slack Softball Team",
                    id: "T9TK3CUKW"
                },
                enterprise: {
                    name: "slack-sports",
                    id: "E12345678"
                },
                authed_user: {
                    id: "U1234",
                    scope: "chat:write",
                    access_token: "xoxp-1234",
                    token_type: "user"
                }
        },(error,instance)=>{
            if(error!= null) return  functions.logger.info("error to create slackToken object")

             functions.logger.info("create slackToken object successfully")
        })
        res.status(200).json(body={
                "ok": true,
                "access_token": "xoxb-17653672481-19874698323-pdFZKVeTuE8sk7oOcBrzbqgy",
                "token_type": "bot",
                "scope": "commands,incoming-webhook",
                "bot_user_id": "U0KRQLJ9H",
                "app_id": "A0KRD7HC3",
                "team": {
                    "name": "Slack Softball Team",
                    "id": "T9TK3CUKW"
                },
                "enterprise": {
                    "name": "slack-sports",
                    "id": "E12345678"
                },
                "authed_user": {
                    "id": "U1234",
                    "scope": "chat:write",
                    "access_token": "xoxp-1234",
                    "token_type": "user"
                }
        }).send()
     })
    }else{
        return res.redirect('/login')
    }
});


module.exports = router