const express = require('express');
const { Router } = require('express');
const router = Router();
const Comment = require("../models/comment");
const Post = require("../models/post");
const User = require("../models/user");
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
require('dotenv').config();
const verifyToken = require('./verify_token');
const ObjectId = require('mongodb').ObjectId;

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
    jwt.verify(req.token, process.env.JWT_SECRET_KEY, async(err, token) => {
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
                user: await User.findById(token.user), // Save full user object to user attribute of new post
                comments: [],
            });

            // Update user that wrote the post with new posts array
            const foundUser = await User.findById(token.user); // Find user that made post
            if(!foundUser) {
                return res.status(404).json({error: "User not found."}); // Only if user associated with post was not found in database
            }
            foundUser.posts.push(post); // Add post to posts array associated with user
            await foundUser.save();

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
    body('title').if(body('title').exists()).isLength({min: 1}).escape().withMessage("Post title must be specified."),
    body('content').if(body('content').exists()).isLength({min: 1}).escape().withMessage("Content of post must be specified."),
    body('published').if(body('published').exists()).isBoolean().withMessage("published must be a boolean value."),
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

            await User.updateMany({ "posts._id": new ObjectId(req.params.postId)}, { $set: { "posts.$": post }}); // Update the blog post object in the "posts" array field of the associated blog post
            await Comment.updateMany({ "post._id": req.params.postId }, { $set: { "post": post }}); // Update the blog post object in the "post" object field for all comments associated with the updated blog post

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

            const user = await User.updateMany({}, { $pull: { posts: { _id: new ObjectId(req.params.postId) }}});
            if(!user) {
                return res.status(404).json({error: "User not found."});
            }
            await Comment.deleteMany({ "post._id": req.params.postId });
            // Write code here to delete ALL comments associated with the now-deleted blog post

            res.json(post);
        } catch {
            res.status(500).json({error: "Server error. Please try again."});
        }
    });
});

module.exports = router;