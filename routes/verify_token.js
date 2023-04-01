const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    // Token format: Bearer <access_token>

    const bearerHeader = req.headers['authorization']; // Get bearer token
    if(typeof bearerHeader !== "undefined") {
        const bearer = bearerHeader.split(' '); // Split the request header into 2 parts at the space: the word "Bearer" and the access token itself and put both parts into an array
        const bearerToken = bearer[1]; // Get only the token from the array
        req.token = bearerToken; // Set the token
        next(); // Move onto the next middleware function
    } else {
        res.status(403).json({error: "Invalid JSON web token."})
    }
}

module.exports = verifyToken;