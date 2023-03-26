const express = require('express');
const { Router } = require('express');
const router = Router();
const User = require("../models/user");
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

router.use(express.json());
router.use(express.urlencoded({extended: true}));

// Custom middleware function sued to verify JSON web token
function verifyToken(req, res, next) {
    const token = req.header("Authorization");
    if(!token) { // If there's no token in the "Authorization" header, return an 401 status code with an error message
        return res.status(401).json({error: "Access denied: no token provided."});
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY); // If there's a token, use jwt.verify() to decode it using the SECRET_KEY environment variable
        req.user = decoded.user; // If token is valid, set req.user property to the decoded user object and call next() to proceed to the next route handler
        next();
    } catch(err) {
        res.status(400)/json({error: "Invalid token"}); // Run only if the token is invalid
    }
}

router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch(err) {
        console.error(err.message);
        res.status(500).json({error: 'Server error'});
    }
});

router.post('/', [
    body('username').trim().isLength({min: 1}).escape().withMessage("Username must be specified.").isAlphanumeric().withMessage("Username has non-alphanumeric characters."),
    body('first_name').trim().isLength({min: 1}).escape().withMessage("First name must be specified.").isAlphanumeric().withMessage("First name has non-alphanumeric characters."),
    body('last_name').trim().isLength({min: 1}).escape().withMessage("Last name must be specified.").isAlphanumeric().withMessage("Last name has non-alphanumeric characters."),
    body('password').trim().isLength({min: 8}).escape().withMessage("Password must have 8 or more characters."),
    body('confirm-password').trim().escape().custom((value, {req}) => value === req.body.password).withMessage("The passwords do not match."),
], async (req, res) => {
    try {
        const validation_errors = validationResult(req); // validationResult(req) returns a result object containing the validation errors for a given request
        if(!validation_errors.isEmpty()) {
            return res.status(400).json({errors: validation_errors.array()}); // Return any errors from santization/validation process as response 
        }
        const {username, first_name, last_name, password} = req.body; // Destructure req.body so that you don't have to write "req.body" every time you want to access them
        User.findOne({ username: req.body.username }).then(found_username => {
            if(found_username) {
                return res.status(409).json({error: "A user with the same username already exists."}); // Use status code 409 for any database conflicts
            } else {
                bcrypt.hash(password, 10, (err, hashedPassword) => { // Salt password from request body using bcrypt
                    const user = new User({
                        username,
                        first_name,
                        last_name,
                        password: hashedPassword,
                        liked_posts: [],
                        liked_comments: [],
                        is_admin: false,
                    });
                    user.save().then(function() {
                        res.json(user);
                    }, function(err) {
                        return res.status(500).json({error: 'Could not create new user in database'}); // Use status code 500 for any unexpected server-related errors
                    });
                });
            }
        });
    } catch(err) {
        console.error(err.message);
        res.status(500).json({error: 'Server error'});
    }
});

router.get('/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId); // Find user in database with id specified in URL
        if(!user) { // If findById() results in null, !user will be true
            return res.status(404).json({error: "User not found"});
        }
        res.json(user);
    } catch(err) { // Only if there's an error while trying to retrieve user data from database
        console.error(err.message);
        res.status(500).json({error: 'Server error'});
    }
});

router.put('/:userId', verifyToken, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.userId, req.body, {new: true}); // req.params.userId gets user id of user to be updated, req.body gets the updated data, new: true tells Mongoose to return the update document instead of the original one
        if(!user) {
            return res.status(404).send({error: "User not found"});
        }
        res.json(user);
    } catch(err) { // Only if there's an error while trying to retrieve user data from database
        console.error(err.message);
        res.status(500).json({error: "Server error"});
    }
});

router.delete('/:userId', verifyToken, async (req, res) => {
    try {
        const user = await User.findByIdAndRemove(req.params.userId);
        if(!user) {
            return res.status(404).send({error: "User not found"});
        }
        res.json(user);
    } catch(err) { // Only if there's an error while trying to retrieve user data from database
        console.error(err.message);
        res.status(500).json({error: "Server error"});
    }
});

router.post('/login', async(req, res) => {
    const {username, password} = req.body; // Destructure username and password from request body
    const user = await User.findOne({username});
    if(!user) {
        return res.status(404).json({error: "User not found"}); // Only if user enters a username that does not exist
    }
    const passwordMatch = await bcrypt.compare(password, user.password); // password = password entered into form, user.password = user's actual password (stored in database)
    if(!passwordMatch) {
        return res.status(401).json({error: "Incorrect password"}); // Only if user enters incorrect password
    }
    const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET_KEY); // Create and sign the JWT
    res.json({token}); // Send the JWT as a response
});

module.exports = router;