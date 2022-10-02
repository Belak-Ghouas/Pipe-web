const express = require('express')
const router = express.Router()
var axios = require('axios');
const { config } = require('dotenv');
const { data } = require('jquery');
const SlackToken = require('../models/slack_token')
const scope ='groups:read,channels:read,chat:write,chat:write.public'
const sessionMiddleWare = require('../sessionmiddleware')
const autheMiddleWare = require('../middlewares')
const User = require('../models/user')
const functions = require("firebase-functions");

router.get('/slackcode',sessionMiddleWare.sessionState, async(req, res) => {
    const data = { 'scope': scope, 'client_id': process.env.SLACK_CLIENT_ID, 'client_secret':process.env.SLACK_CLIENT_SECRET, 'state':req.session.userId };
    const query = encodeQueryData(data);
   return res.redirect(process.env.SLACK_API_CODE+query)
});

router.get('/authorization', async(req, res) => {
    const tmpCode = req.query.code
    const state = req.query.state
    if(state == undefined){
        functions.logger.error("slack/authorization api , the state parameter in the query is not available query = "+req.query)

        return res.status(403).send({error:"Your are not authenticated"})
    }
    req.session.userId = state
     functions.logger.info(req.query)
    if (tmpCode != null) {
     await getTokenFromSlack(tmpCode).then(value=>{
         functions.logger.info(value)
        User.updateOne({ _id: state }, { 
            slack_access_token: value.access_token,
            slack_token_type: value.token_type,
            scope: value.scope,
            bot_user_id: value.bot_user_id,
            app_id: value.app_id,
            team: {
                name: value.team?.name,
                id: value.team?.id
            },
            enterprise: {
                name: value.enterprise?.name,
                id: value.enterprise?.id
            },
            authed_user: {
                id: value.authed_user?.id,
                scope: value.authed_user?.scope,
                access_token: value.authed_user?.access_token,
                token_type: value.authed_user?.token_type,
            }

         }).then((obj) => {
             functions.logger.info('Updated - ' + obj);
             req.flash(
                "success_msg",
                "You are now connected to Slack, please configure your mobile app to finalize the process."
            );
            functions.logger.info("successfully updating the user with slack informations")
            res.redirect('/')
        })
        .catch((err) => {
            functions.logger.error("failed to get slack token , the error is "+err)
            req.flash(
                "error_msg",
                "Technical problem , cannot retrieve connexion with slack , please retry after"
            );
            res.redirect('/') 
        });
      })
    }else{
        
        req.flash(
           "error_msg",
           "Technical problem , cannot retrieve connexion with slack , please retry after"
       );
       functions.logger.error("emty code from slack")
       res.redirect('/') 
    }
});


router.get('/slack_access_token',autheMiddleWare.authenticateToken,(req, res) =>{
    const userId = req.user.userId
     functions.logger.info(req.user)
     functions.logger.info(userId)
   
    if(userId != null){
         SlackToken.findOne({ pipe_user_id: userId},(error,slack_model)=>{
            if(error) {
             functions.logger.info(error)
            res.status(404).json({'error':'no token for this user token'})
            }else{
                 functions.logger.info(slack_model)
                res.status(200).json({'slack_access_token':slack_model.access_token}).send()
            }
            
        })}

})

const getTokenFromSlack = async(slackCode) => {
    const headers = {
        'content-type': 'application/x-www-form-urlencoded',
        };

    let res = await axios.post(process.env.SLACK_API_TOKEN,null, {
        headers: headers,
         params: {
            code: slackCode,
            client_id: process.env.SLACK_CLIENT_ID,
            client_secret: process.env.SLACK_CLIENT_SECRET
        }
    });
     functions.logger.info(res.data)
    return res.data
}

function encodeQueryData(data) {
    const ret = [];
    for (let d in data)
      ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
    return "?"+ret.join('&');
 }



module.exports = router