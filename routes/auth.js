const express = require('express')
const router = express.Router()
const User = require('../models/user')
const bcrypt = require('bcrypt')
const rounds = 10

const jwt = require('jsonwebtoken')

router.post('/login', (req, res) => {
    User.findOne({email: req.body.email})
    .then(user => {
        console.log("user =" +user)
        if(!user) {
            res.status(404).json({error: 'no user with that email found'})
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
                    return  res.redirect('http://192.168.0.20:3000/')
                } 
                 return  res.status(403).json({error: 'passwords do not match'})
            })
        }
    })
    .catch(error => {
        res.status(500).json(error)
    })
});

router.post('/signup', (req, res) => {
    bcrypt.hash(req.body.password, rounds, (error, hash) => {
        if (error) return res.status(500).json(error)
        
            User.findOne({email: req.body.email})
            .then(user => {
                if(user == null){
                    const newUser =  User({email: req.body.email, password: hash})
                    newUser.save()
                        .then(user => {
                            res.status(200).json({token: generateToken(user)})
                        })
                        .catch(error => {
                            res.status(500).json(error)
                        })
                }else{
                    res.status(201).json("Use another email adress")    
                }
            })
            
    })
});

function generateToken(user){
   return jwt.sign({data: user}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '24h'})
}

module.exports = router