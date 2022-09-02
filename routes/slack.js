const express = require('express')
const router = express.Router()
var axios = require('axios');
const { config } = require('dotenv');
const { data } = require('jquery');
const SlackToken = require('../models/slack_token')
const scope ='channels:read,chat:write,chat:write.public'
const sessionMiddleWare = require('../sessionMiddleWare')


router.get('/slackcode',sessionMiddleWare.sessionState, async(req, res) => {
    const data = { 'scope': scope, 'client_id': process.env.SLACK_CLIENT_ID, 'client_secret':process.env.SLACK_CLIENT_SECRET, 'state':req.session.userId };
    const query = encodeQueryData(data);
   return res.redirect(process.env.SLACK_API_CODE+query)
});

router.post('/authorization', async(req, res) => {
    const tmpCode = req.query.code
    const state = req.query.state
    if(state == undefined) return res.status(403).send({error:"Your are not authenticated"})
    req.session.userId = state
    console.log(req.query)
    if (tmpCode != null) {
     await getTokenFromSlack(tmpCode).then(value=>{
        console.log(value)
        SlackToken.create({
            pipe_user_id : state,
            access_token: value.access_token,
            token_type: value.token_type,
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
    },(error,instance)=>{
        if(error!= null) return console.log("error to create slackToken object")

        console.log("create slackToken object successfully")
    })
    res.status(200)
    return  res.redirect('/')
      })
    }
});

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
    console.log(res.data)
    return res.data
}

function encodeQueryData(data) {
    const ret = [];
    for (let d in data)
      ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
    return "?"+ret.join('&');
 }



module.exports = router