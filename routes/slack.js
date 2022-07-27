const express = require('express')
const router = express.Router()
var axios = require('axios');
const { config } = require('dotenv');


router.post('/author', (req, res) => {
    const tmpCode = req.body.code
    if (tmpCode != null) {
        console.log(req.body)
        const data = {
            content: " post automatique ",
            title: "automatique"
        };
        const headers = {
            'content-type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImVtYWlsIjoiYmFub3VuZSIsInVzZXJJZCI6IjYyZGJmOTVlOWQyYTUxMTc3YTgwNDRjMSJ9LCJpYXQiOjE2NTg1ODM0NzAsImV4cCI6MTY1ODY2OTg3MH0.w1Mlgd-sqKvEGpRbgl7DSwMKyTyDqjUWCpC3Nk3VXLE'
        };
        axios.post('http://localhost:3000/user/post', { post: data }, { headers })
            .then(response => {
                res.status(200).json("ajouter automatiquemnt").send()
            }).catch(function (error) {
                console.log("there is an error ");
            });
    } else {
        res.status(201).json("the code is not present in the body").send()
    }

});

router.post('/authorization', async(req, res) => {
    const tmpCode = req.body.code
    if (tmpCode != null) {
     await postToSlack(tmpCode).then(value=>{
        console.log(value)
        return value
      })
    }
});

const getTokenFromSlack = async(slackCode) => {
    const data = {
        content:"c'est un message automatqiue",
        title :" mon titre "
    }
    const headers = {
        'content-type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImVtYWlsIjoiYmFub3VuZSIsInVzZXJJZCI6IjYyZGJmOTVlOWQyYTUxMTc3YTgwNDRjMSJ9LCJpYXQiOjE2NTg1ODM0NzAsImV4cCI6MTY1ODY2OTg3MH0.w1Mlgd-sqKvEGpRbgl7DSwMKyTyDqjUWCpC3Nk3VXLE'
    };

    let res = await axios.post(process.env.SLACK_API, { post: data }, {
        headers: headers, params: {
            code: slackCode,
            client_id: process.env.SLACK_CLIENT_ID,
            client_secret: process.env.SLACK_CLIENT_SECRET
        }
    });

    return res.data
}





module.exports = router