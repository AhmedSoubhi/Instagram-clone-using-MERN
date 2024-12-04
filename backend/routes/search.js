// backend/routes/search.js

const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Adjust the path as necessary
const authenticateToken = require('../middleware/authenticateToken'); // Adjust the path as necessary

// @route   GET /api/search/users
// @desc    Search users by query
// @access  Private
router.get('/users', authenticateToken, async (req, res) => {
    const { q } = req.query;

    if (!q) {
        return res.status(400).json({ msg: 'Query parameter "q" is required.' });
    }

    try {
        // Perform a case-insensitive search on username and email
        const regex = new RegExp(q, 'i'); // 'i' for case-insensitive
        const users = await User.find({
            $or: [
                { username: { $regex: regex } },
                { email: { $regex: regex } }
            ]
        }).select('-password'); // Exclude password from results

        res.json(users);
    } catch (err) {
        console.error(`Error in GET /api/search/users?q=${q}:`, err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
