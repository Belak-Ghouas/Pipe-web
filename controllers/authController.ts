const User  = require('../models/user')
const bcrypt = require('bcrypt')

const jwt = require('jsonwebtoken')

exports.loginHandle = (req, res)=>{
    User.findOne({email: req.body.email})
    .then(user => {
        console.log("user =" +user)
        if(!user) {
            return res.render('pages/login',{error: 'no user with that email found'})
        } else {
            bcrypt.compare(req.body.password, user.password, (error, match) => {
                if (error) return res.status(500).json(error)

                if (match){
                    const token = generateToken({email : user.email , userId: user._id })
                    res.set({
                        'Authorization':'bearer '+token,
                      });

                      
                    res.status(200)
                    res.body={token:token}
                    req.session.userId = user._id
                    return  res.redirect('/')
                } 
                 return  res.status(403).json({error: 'passwords do not match'})
            })
        }
    })
    .catch(error => {
        res.status(500).json(error)
    })

}

function generateToken(user){
    return jwt.sign({data: user}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '24h'})
 }