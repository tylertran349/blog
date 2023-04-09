const express = require('express');
const { Router } = require('express');
const router = Router();
const Post = require("../models/post");
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
require('dotenv').config();
const verifyToken = require('./verify_token');

router.use(express.json());
router.use(express.urlencoded({extended: true}));

router.get('/', async(req, res) => {
    try {
        const posts = await Post.find();
        res.json(posts);
    } catch(err) {
        res.status(500).json({error: "Server error. Please try again."});
    }
});

router.get('/:postId', async(req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        res.json(post);
    } catch(err) {
        res.status(500).json({error: "Server error. Please try again."});
    }
});

router.get('/:postId/comments', async(req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        res.json(post.comments);
    } catch(err) {
        res.status(500).json({error: "Server error. Please try again."});
    }
});

router.post('/', verifyToken, [
    body('title').isLength({min: 1}).escape().withMessage("Post title must have one or more characters."),
    body('content').isLength({min: 1}).escape().withMessage("Post content must have one or more characters."),
    body('published').isBoolean().withMessage("published must be a boolean value."),
], (req, res) => {
    jwt.verify(req.token, process.env.JWT_SECRET_KEY, (err, token) => {
        if(err) {
            return res.status(403).json({error: "Invalid or expired JSON web token."}); // Only if token is invalid
        }
        try {
            const validation_errors = validationResult(req);
            if(!validation_errors.isEmpty()) {
                return res.status(400).json({errors: validation_errors.array()});
            }
            const {title, content, published} = req.body; // Destructure properties from req.body object

            // Create new post
            const post = new Post({
                title,
                content,
                date: new Date(),
                liked_by: [],
                published,
                user: token.user, // token.user = user associated with decoded token
                comments: [],
            });
            post.save().then(function() {
                res.json(post);
            }, function(err) {
                return res.status(500).json({error: "Could not create new post in database. Please try again."}); // New post could not be created/added to the database
            });
        } catch {
            res.status(500).json({error: "Server error. Please try again."});
        }
    });
});

router.patch('/:postId', verifyToken, [
    body('title').isLength({min: 1}).escape().withMessage("Post title must be specified."),
    body('content').isLength({min: 1}).escape().withMessage("Content of post must be specified."),
    body('published').isBoolean().withMessage("published must be a boolean value."),
], async(req, res) => {
    jwt.verify(req.token, process.env.JWT_SECRET_KEY, async(err, token) => {
        if(err) {
            return res.status(403).json({error: "Invalid or expired JSON web token."});
        } 
        const validation_errors = validationResult(req);
        if(!validation_errors.isEmpty()) {
            return res.status(400).json({errors: validation_errors.array()});
        }
        try {
            const post = await Post.findByIdAndUpdate(req.params.postId, req.body, {new: true});
            if(!post) {
                return res.status(404).json({error: "Post not found."});
            }
            res.json(post);
        } catch {
            res.status(500).json({error: "Server error. Please try again."});
        }
    })
});

router.delete('/:postId', verifyToken, (req, res) => {
    jwt.verify(req.token, process.env.JWT_SECRET_KEY, async(err, token) => {
        if(err) {
            return res.status(403).json({error: "Invalid or expired JSON web token."});
        } 
        try {
            const post = await Post.findByIdAndRemove(req.params.postId);
            if(!post) {
                return res.status(404).json({error: "Post not found."});
            }
            await Comment.deleteMany({ post: post._id }); // Delete any comments associated with the deleted post
            res.json(post);
        } catch {
            res.status(500).json({error: "Server error. Please try again."});
        }
    });
});

module.exports = router;