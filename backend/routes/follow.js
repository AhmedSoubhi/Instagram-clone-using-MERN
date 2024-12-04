// backend/routes/follow.js

const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Adjust the path as necessary
const authenticateToken = require('../middleware/authenticateToken'); // Adjust the path as necessary

// @route   POST /api/follow/follow/:id
// @desc    Follow a user
// @access  Private
router.post('/follow/:id', authenticateToken, async (req, res) => {
    try {
        const userToFollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user.id);

        if (!userToFollow) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Prevent following oneself
        if (userToFollow.id === currentUser.id) {
            return res.status(400).json({ msg: 'You cannot follow yourself' });
        }

        // Check if already following
        if (currentUser.following.includes(userToFollow.id)) {
            return res.status(400).json({ msg: 'You are already following this user' });
        }

        currentUser.following.push(userToFollow.id);
        userToFollow.followers.push(currentUser.id);

        await currentUser.save();
        await userToFollow.save();

        res.json({ msg: 'User followed successfully' });
    } catch (err) {
        console.error(`Error in POST /api/follow/follow/${req.params.id}:`, err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/follow/unfollow/:id
// @desc    Unfollow a user
// @access  Private
router.post('/unfollow/:id', authenticateToken, async (req, res) => {
    try {
        const userToUnfollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user.id);

        if (!userToUnfollow) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Check if not following
        if (!currentUser.following.includes(userToUnfollow.id)) {
            return res.status(400).json({ msg: 'You are not following this user' });
        }

        currentUser.following = currentUser.following.filter(
            userId => userId.toString() !== userToUnfollow.id
        );
        userToUnfollow.followers = userToUnfollow.followers.filter(
            userId => userId.toString() !== currentUser.id
        );

        await currentUser.save();
        await userToUnfollow.save();

        res.json({ msg: 'User unfollowed successfully' });
    } catch (err) {
        console.error(`Error in POST /api/follow/unfollow/${req.params.id}:`, err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   GET /api/follow/followers/:id
// @desc    Get followers of a user
// @access  Private
router.get('/followers/:id', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('followers', '-password');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user.followers);
    } catch (err) {
        console.error(`Error in GET /api/follow/followers/${req.params.id}:`, err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   GET /api/follow/following/:id
// @desc    Get following of a user
// @access  Private
router.get('/following/:id', authenticateToken, async (req, res) => {
    try {
        const searchTerm = req.query.search || '';

        const user = await User.findById(req.params.id).populate({
            path: 'following',
            match: { username: { $regex: searchTerm, $options: 'i' } },
            select: '_id username profilePicture'
        });

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json(user.following);
    } catch (err) {
        console.error(`Error in GET /api/follow/following/${req.params.id}:`, err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
