// backend/routes/users.js

const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const User = require('../models/User');

// @route   GET /api/users
// @desc    Get all users or search users
// @access  Private
router.get('/following', authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const searchTerm = req.query.search || '';

        // Find the current user and populate the 'following' field
        const currentUser = await User.findById(currentUserId).populate({
            path: 'following',
            match: { username: { $regex: searchTerm, $options: 'i' } },
            select: '_id username profilePicture'
        });

        if (!currentUser) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json(currentUser.following);
    } catch (err) {
        console.error('Error fetching following users:', err);
        res.status(500).json({ msg: 'Server error while fetching following users.' });
    }
});
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};

        if (search) {
            query = {
                username: { $regex: search, $options: 'i' }
            };
        }

        const users = await User.find(query).select('_id username profilePicture');
        res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
