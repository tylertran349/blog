const express = require('express');
const { Router } = require('express');
const router = Router();
const User = require("../models/user");
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');

router.use(express.json());
router.use(express.urlencoded({extended: true}));

router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch(err) {
        console.error(err.message);
        res.status(500).json({error: 'Server error'});
    }
});

router.post('/', async (req, res) => {
    try {
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

router.put('/:userId', async (req, res) => {
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

router.delete('/:userId', async (req, res) => {
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

module.exports = router;