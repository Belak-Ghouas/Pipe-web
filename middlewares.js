const jwt = require('jsonwebtoken')


exports.authenticateToken = function (req, res, next) {
    const authHeader = req.headers['authorization']
    
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) {
        console.log("token is null")
         res.status(403)
         return res.send({error:'token is null'})
    } else {

        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            if (err){
                console.log("failed to verify the token due to "+err)
                res.status(403)
               return res.send({error:'not allowed'})
            }
            req.user = user.data
            next()
        })
    }
}
