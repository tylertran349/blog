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

router.use(express.json());
router.use(express.urlencoded({extended: true}));

router.get('/', async(req, res) => {
    try {
        const comments = await Comment.find();
        res.json(comments);
    } catch(err) {
        res.status(500).json({error: "Server error. Please try again."});
    }
});

router.get('/:commentId', async(req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);
        res.json(comment);
    } catch(err) {
        res.status(500).json({error: "Server error. Please try again."});
    }
})

router.post('/', verifyToken, [
    body('content').isLength({min: 1}).escape().withMessage("Comment must have one or more characters."),
], (req, res) => {
    jwt.verify(req.token, process.env.JWT_SECRET_KEY, async(err, token) => {
        if(err) {
            return res.status(403).json({error: "Invalid or expired JSON web token."});
        }
        try {
            const validation_errors = validationResult(req);
            if(!validation_errors.isEmpty()) {
                return res.status(400).json({errors: validation_errors.array()});
            }
            const {content, post} = req.body;
            const comment = new Comment({
                content,
                date: new Date(),
                liked_by: [],
                user: token.user,
                post,
            });

            // Update blog post associated with comment with new comments array
            const foundPost = await Post.findById(post); // Find blog post associated with comment
            if(!foundPost) {
                return res.status(404).json({error: "Post not found."}); // Only if blog post associated with comment was not found in database
            }
            foundPost.comments.push(comment); // Add comment to comments array associated with blog post
            await foundPost.save();

            // Update user that wrote comment with new comments array
            const foundUser = await User.findById(token.user); // Find user that made comment
            if(!foundUser) {
                return res.status(404).json({error: "User not found."}); // Only if user associated with comment was not found in database
            }
            foundUser.comments.push(comment); // Add comment to comments array associated with user
            await foundUser.save();

            comment.save().then(function() {
                res.json(comment);
            }, function(err) {
                return res.status(500).json({error: "Could not create new comment in database. Please try again."});
            });
        } catch {
            res.status(500).json({error: "Server error. Please try again."});
        }
    });
});

router.patch('/:commentId', verifyToken, [
    body('content').if(body('content').exists()).isLength({min: 1}).escape().withMessage("Comment must have one or more characters."),
], (req, res) => {
    jwt.verify(req.token, process.env.JWT_SECRET_KEY, async(err, token) => {
        if(err) {
            return res.status(403).json({error: "Invalid or expired JSON web token."});
        }
        const validation_errors = validationResult(req);
        if(!validation_errors.isEmpty()) {
            return res.status(400).json({errors: validation_errors.array()});
        }
        try {
            const comment = await Comment.findByIdAndUpdate(req.params.commentId, req.body, {new: true});
            if(!comment) {
                return res.status(404).json({error: "Comment not found."});
            }
            res.json(comment);
        } catch {
            res.status(500).json({error: "Server error. Please try again."});
        }
    });
});

router.delete('/:commentId', verifyToken, (req, res) => {
    jwt.verify(req.token, process.env.JWT_SECRET_KEY, async(err, token) => {
        if(err) {
            return res.status(403).json({error: "Invalid or expired JSON web token."});
        }
        try {
            const comment = await Comment.findByIdAndRemove(req.params.commentId);
            if(!comment) {
                return res.status(404).json({error: "Comment not found."});
            }

            // Remove the now-deleted comment from the comments array field of the post previously associated with the now-deleted comment
            const post = await Post.findOne({ comments: req.params.commentId }); // Finds a blog post with a specific comment ID defined in its comments array field
            if(!post) {
                return res.status(404).json({error: "Post not found."});
            }
            post.comments = post.comments.filter((commentObj) => commentObj._id.toString() !== req.params.commentId); // Updates the comments array field of the associated post with its current array elements minus the comment that was just deleted
            await post.save();

            // Remove the now-deleted comment from the comments array field of the user that made the now-deleted comment
            const user = await User.findOne({ comments: req.params.commentId });
            if(!user) {
                return res.status(404).json({error: "User not found."});
            }
            user.comments = user.comments.filter((commentObj) => commentObj._id.toString() !== req.params.commentId);
            await user.save();

            res.json(comment);
        } catch {
            res.status(500).json({error: "Server error. Please try again."});
        }
    });
});

module.exports = router;