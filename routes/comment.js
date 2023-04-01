const express = require('express');
const { Router } = require('express');
const router = Router();
const Comment = require("../models/comment");
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
        res.status(500).json({error: "Server error"});
    }
});

router.post('/', verifyToken, [
    body('content').isLength({min: 1}).escape().withMessage("Comment must have one or more characters."),
], (req, res) => {
    jwt.verify(req.token, process.env.JWT_SECRET_KEY, (err, token) => {
        if(err) {
            return res.status(403).json({error: "Error 403: Forbidden"});
        }
        try {
            const {content, post} = req.body;
            const comment = new Comment({
                content,
                date: new Date(),
                likes: 0,
                user: token.user,
                post,
            });
            comment.save().then(function() {
                res.json(comment);
            }, function(err) {
                return res.status(500).json({error: "Could not create new comment in database."});
            })
        } catch {
            res.status(500).json({error: "Server error"});
        }
    });
});

router.put('/:commentId', verifyToken, [
    body('content').isLength({min: 1}).escape().withMessage("Comment must have one or more characters."),
], (req, res) => {
    jwt.verify(req.token, process.env.JWT_SECRET_KEY, async(err, token) => {
        if(err) {
            return res.status(403).json({error: "Error 403: Forbidden"});
        }
        try {
            const comment = await Comment.findByIdAndUpdate(req.params.commentId, req.body, {new: true});
            if(!comment) {
                return res.status(404).send({error: "Comment not found."});
            }
            res.json(comment);
        } catch {
            res.status(500).json({error: "Server error"});
        }
    });
});

router.delete('/:commentId', verifyToken, (req, res) => {
    jwt.verify(req.token, process.env.JWT_SECRET_KEY, async(err, token) => {
        if(err) {
            return res.status(403).json({error: "Error 403: Forbidden"});
        }
        try {
            const comment = await Comment.findByIdAndRemove(req.params.commentId);
            if(!comment) {
                return res.status(404).send({error: "Comment not found."});
            }
            res.json(comment);
        } catch {
            res.status(500).json({error: "Server error"});
        }
    });
});

module.exports = router;