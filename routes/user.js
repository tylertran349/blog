const express = require('express');
const { Router } = require('express');
const router = Router();
const User = require("../models/user");
const Post = require("../models/post");
const Comment = require("../models/comment");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
require('dotenv').config();
const verifyToken = require("./verify_token");

router.use(express.json());
router.use(express.urlencoded({extended: true}));

router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch(err) {
        res.status(500).json({error: 'Server error. Please try again.'});
    }
});

router.get('/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId); // Find user in database with id specified in URL
        if(!user) { // If findById() results in null, !user will be true
            return res.status(404).json({error: "User not found."});
        }
        res.json(user);
    } catch(err) { // Only if there's an error while trying to retrieve user data from database
        res.status(500).json({error: 'Server error. Please try again.'});
    }
});

router.post('/', [
    body('username').trim().isLength({min: 1}).escape().withMessage("Username must be specified.").isAlphanumeric().withMessage("Username has non-alphanumeric characters."),
    body('first_name').trim().isLength({min: 1}).escape().withMessage("First name must be specified.").isAlphanumeric().withMessage("First name has non-alphanumeric characters."),
    body('last_name').trim().isLength({min: 1}).escape().withMessage("Last name must be specified.").isAlphanumeric().withMessage("Last name has non-alphanumeric characters."),
    body('password').trim().isLength({min: 8}).escape().withMessage("Password must have 8 or more characters."),
    body('confirm_password').trim().escape().custom((value, {req}) => value === req.body.password).withMessage("The passwords do not match. "),
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
                        is_admin: false,
                    });
                    user.save().then(function() {
                        res.json(user);
                    }, function(err) {
                        return res.status(500).json({error: 'Could not create new user in database. Please try again.'}); // Use status code 500 for any unexpected server-related errors
                    });
                });
            }
        });
    } catch(err) {
        res.status(500).json({error: 'Server error. Please try again.'});
    }
});

router.patch('/:userId', verifyToken, [(req, res, next) => 
    {
        if(req.body.username) {
            check('username').trim().isLength({min: 1}).escape().withMessage("Username must be specified.").isAlphanumeric().withMessage("Username has non-alphanumeric characters.");
        }
        if(req.body.first_name) {
            check('first_name').trim().isLength({min: 1}).escape().withMessage("First name must be specified.").isAlphanumeric().withMessage("First name has non-alphanumeric characters.");
        }
        if(req.body.last_name) {
            check('last_name').trim().isLength({min: 1}).escape().withMessage("Last name must be specified.").isAlphanumeric().withMessage("Last name has non-alphanumeric characters.");
        }
        if(req.body.old_password) {
            check('old_password').trim().isLength({min: 8}).escape().withMessage("You must enter your old password.");
        }
        if(req.body.password) {
            check('password').trim().isLength({min: 8}).escape().withMessage("Password must have 8 or more characters.");
        }
        if(req.body.confirm_password) {
            check('confirm_password').trim().escape().custom((value, {req}) => value === req.body.password).withMessage("The passwords do not match.");
        }
        if(req.body.admin_passcode) {
            check('admin_passcode').trim().escape().custom((value, {req}) => value === process.env.ADMIN_PASSCODE).withMessage("The admin passcode you entered is incorrect.");
        }
        next();
    }
], (req, res) => {
    jwt.verify(req.token, process.env.JWT_SECRET_KEY, async(err, token) => {
        if(err) {
            return res.status(403).json({error: "Error 403: Forbidden"});
        }
        try {
            const validation_errors = validationResult(req);
            if(!validation_errors.isEmpty()) {
                return res.status(400).json({errors: validation_errors.array()});
            }
            let user = await User.findById(req.params.userId);
            if(!user) {
                return res.status(404).json({error: "User not found."});
            }
            const updatedFields = {}; // Create an object that only holds the fields included in the request body
            if(req.body.username) updatedFields.username = req.body.username;
            if(req.body.first_name) updatedFields.first_name = req.body.first_name;
            if(req.body.last_name) updatedFields.last_name = req.body.last_name;
            if(req.body.password) {
                // Only check for old password if user is changing their password
                const checkOldPassword = await bcrypt.compare(req.body.old_password, user.password); // Compare old password from request body and old password currently stored in database
                if(!checkOldPassword) {
                    return res.status(401).json({error: "Incorrect password."});
                }
                const salt = await bcrypt.genSalt(10); // Generate salt (a random string that's added to a password before hashing it)
                const hashedPassword = await bcrypt.hash(req.body.password, salt); // Hash the new password
                updatedFields.password = hashedPassword; // Replace the original password in the request body with the hashed one
            }
            if(req.body.admin_passcode) updatedFields.is_admin = true;
            user = await User.findByIdAndUpdate(req.params.userId, updatedFields, {new: true}); // req.params.userId gets user id of user to be updated, updatedFields contains any fields that were updated, new: true tells Mongoose to return the updated document instead of the original one
            if(!user) {
                return res.status(404).json({error: "User not found."});
            }
            res.json(user);
        } catch {
            res.status(500).json({error: "Server error. Please try again."});
        }
    })
});

router.delete('/:userId', verifyToken, (req, res) => {
    jwt.verify(req.token, process.env.JWT_SECRET_KEY, async(err, token) => {
        if(err) {
            return res.status(403).json({error: "Invalid or expired JSON web token."});
        } 
        try {
            const user = await User.findByIdAndRemove(req.params.userId);
            if(!user) {
                return res.status(404).json({error: "User not found."});
            }
            await Post.deleteMany({ user: user._id }); // Delete any comments associated with the deleted user
            await Comment.deleteMany({ user: user._id }); // Delete any comments associated with the deleted user
            res.json({message: "User deleted successfully."});
        } catch {
            res.status(500).json({error: "Server error."});
        }
    })
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

    // Generate JSON web token when user enters correct login credentials
    jwt.sign({user}, process.env.JWT_SECRET_KEY, (err, token) => {
        res.json({token});
    });
});

module.exports = router;