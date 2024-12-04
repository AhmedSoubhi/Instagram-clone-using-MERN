// backend/routes/comments.js

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const authenticateToken = require('../middleware/authenticateToken');
const Comment = require('../models/Comment'); // Import the Comment model
const Post = require('../models/Post'); // Import the Post model
const User = require('../models/User'); // Import the User model

// --------------------- Add a Comment ---------------------
/**
 * @route   POST /api/comments/:postId
 * @desc    Add a comment to a post
 * @access  Private
 */
router.post('/:postId', authenticateToken, async (req, res) => {
    try {
        const { postId } = req.params;
        const { text } = req.body;
        const userId = req.user.id;

        // Validate postId
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({ msg: 'Invalid post ID.' });
        }

        // Validate text
        if (!text || text.trim() === '') {
            return res.status(400).json({ msg: 'Comment text is required.' });
        }

        // Check if the post exists
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ msg: 'Post not found.' });
        }

        // Create a new comment
        const newComment = new Comment({
            post: postId,
            user: userId,
            text: text.trim()
        });

        // Save the comment to the database
        await newComment.save();

        // Optionally, emit a Socket.io event for real-time updates
        // req.io.emit('newComment', newComment);

        res.status(201).json({ msg: 'Comment added successfully.', comment: newComment });
    } catch (err) {
        console.error('Error adding comment:', err.message, err.stack);
        res.status(500).json({ msg: 'Server error while adding comment.' });
    }
});

// --------------------- Get Comments for a Post ---------------------
/**
 * @route   GET /api/comments/:postId
 * @desc    Get all comments for a specific post
 * @access  Private
 */
router.get('/:postId', authenticateToken, async (req, res) => {
    try {
        const { postId } = req.params;

        // Validate postId
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({ msg: 'Invalid post ID.' });
        }

        // Check if the post exists
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ msg: 'Post not found.' });
        }

        // Fetch comments and populate user details
        const comments = await Comment.find({ post: postId })
            .sort({ createdAt: 1 }) // Sort by oldest first
            .populate('user', 'username profilePicture') // Populate user info
            .lean(); // Convert to plain JavaScript objects

        res.json(comments);
    } catch (err) {
        console.error('Error fetching comments:', err.message, err.stack);
        res.status(500).json({ msg: 'Server error while fetching comments.' });
    }
});

// --------------------- Delete a Comment (Optional) ---------------------
/**
 * @route   DELETE /api/comments/:commentId
 * @desc    Delete a comment
 * @access  Private
 */
router.delete('/:commentId', authenticateToken, async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.id;

        // Validate commentId
        if (!mongoose.Types.ObjectId.isValid(commentId)) {
            return res.status(400).json({ msg: 'Invalid comment ID.' });
        }

        // Find the comment
        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ msg: 'Comment not found.' });
        }

        // Check if the user is the author of the comment
        if (comment.user.toString() !== userId) {
            return res.status(403).json({ msg: 'Unauthorized to delete this comment.' });
        }

        // Delete the comment
        await Comment.findByIdAndDelete(commentId);

        res.json({ msg: 'Comment deleted successfully.' });
    } catch (err) {
        console.error('Error deleting comment:', err.message, err.stack);
        res.status(500).json({ msg: 'Server error while deleting comment.' });
    }
});

// --------------------- Update a Comment (Optional) ---------------------
/**
 * @route   PUT /api/comments/:commentId
 * @desc    Update a comment
 * @access  Private
 */
router.put('/:commentId', authenticateToken, async (req, res) => {
    try {
        const { commentId } = req.params;
        const { text } = req.body;
        const userId = req.user.id;

        // Validate commentId
        if (!mongoose.Types.ObjectId.isValid(commentId)) {
            return res.status(400).json({ msg: 'Invalid comment ID.' });
        }

        // Validate text
        if (!text || text.trim() === '') {
            return res.status(400).json({ msg: 'Comment text is required.' });
        }

        // Find the comment
        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ msg: 'Comment not found.' });
        }

        // Check if the user is the author of the comment
        if (comment.user.toString() !== userId) {
            return res.status(403).json({ msg: 'Unauthorized to update this comment.' });
        }

        // Update the comment
        comment.text = text.trim();
        comment.updatedAt = Date.now();
        await comment.save();

        res.json({ msg: 'Comment updated successfully.', comment });
    } catch (err) {
        console.error('Error updating comment:', err.message, err.stack);
        res.status(500).json({ msg: 'Server error while updating comment.' });
    }
});

module.exports = router;
