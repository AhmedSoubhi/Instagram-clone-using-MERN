// backend/routes/posts.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose'); // Ensure mongoose is imported
const authenticateToken = require('../middleware/authenticateToken');
const Post = require('../models/Post'); // Import the Post model
const User = require('../models/User'); // Import the User model
const fs = require('fs');
const sharp = require('sharp');

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', 'uploads')); // Ensure 'uploads' directory exists
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + path.extname(file.originalname);
        cb(null, uniqueSuffix);
    }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|wmv|flv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only images and videos are allowed'));
    }
};
// Initialize multer with the defined storage and file filter
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
    fileFilter: fileFilter
});

// --------------------- Upload Post Route ---------------------
router.post('/upload', authenticateToken, upload.single('media'), async (req, res) => {
    try {
        const { title, description, caption } = req.body;
        const userId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }

        // Determine media type
        const mimeType = req.file.mimetype;
        let mediaType = '';
        if (mimeType.startsWith('image/')) {
            mediaType = 'image';
        } else if (mimeType.startsWith('video/')) {
            mediaType = 'video';
        } else {
            return res.status(400).json({ msg: 'Unsupported media type' });
        }

        let mediaUrl = `/uploads/${req.file.filename}`;

        // Process images
        if (mediaType === 'image') {
            // Resize the image as before
            const fixedWidth = 700;
            const fixedHeight = 850;

            const inputPath = req.file.path;
            const outputFilename = `resized_${req.file.filename}`;
            const outputPath = path.join(req.file.destination, outputFilename);

            await sharp(inputPath)
                .resize(fixedWidth, fixedHeight, {
                    fit: 'fill'
                })
                .toFile(outputPath);

            // Delete the original uploaded file
            fs.unlinkSync(inputPath);

            mediaUrl = `/uploads/${outputFilename}`;
        }

        // Create a new post with the media
        const newPost = new Post({
            user: userId,
            title,
            description,
            caption,
            mediaUrl,
            mediaType
        });

        // Save the new post to the database
        await newPost.save();

        res.status(201).json({ msg: 'Post uploaded successfully', post: newPost });
    } catch (err) {
        console.error('Error uploading post:', err.message, err.stack);
        res.status(500).json({ msg: 'Server error' });
    }
});

// --------------------- Fetch Posts by User ID Route ---------------------
router.get('/user/:id', authenticateToken, async (req, res) => {
    console.log(`GET /user/${req.params.id} called by userId: ${req.user.id}`);
    try {
        const posts = await Post.find({ user: req.params.id }).sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        console.error('Error fetching posts:', err.message, err.stack);
        res.status(500).json({ msg: 'Server error' });
    }
});

// --------------------- Like a Post Route ---------------------
router.post('/like/:postId', authenticateToken, async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.user.id;

        console.log(`Received like request for postId: ${postId} by userId: ${userId}`);

        // Validate postId format
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            console.log('Invalid post ID format.');
            return res.status(400).json({ msg: 'Invalid post ID format.' });
        }

        // Add the user's ID to the likes array without loading the entire document
        const result = await Post.updateOne(
            { _id: postId },
            { $addToSet: { likes: userId } }
        );

        if (result.nModified === 0) {
            console.log('Post not found or user had already liked the post.');
            return res.status(400).json({ msg: 'Post already liked.' });
        }

        // Get the updated likes count
        const post = await Post.findById(postId).select('likes');
        const likesCount = post.likes.length;

        console.log('Post liked successfully. Total likes:', likesCount);
        res.json({ msg: 'Post liked successfully.', likes: likesCount });
    } catch (err) {
        console.error('Error liking post:', err.message, err.stack);
        res.status(500).json({ msg: 'Server error while liking the post.' });
    }
});

// --------------------- Unlike a Post Route ---------------------
router.post('/unlike/:postId', authenticateToken, async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.user.id;

        console.log(`Received unlike request for postId: ${postId} by userId: ${userId}`);

        // Validate postId format
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            console.log('Invalid post ID format.');
            return res.status(400).json({ msg: 'Invalid post ID format.' });
        }

        // Remove the user's ID from the likes array without loading the entire document
        const result = await Post.updateOne(
            { _id: postId },
            { $pull: { likes: userId } }
        );

        if (result.nModified === 0) {
            console.log('Post not found or user had not liked the post.');
            return res.status(400).json({ msg: 'Post not liked yet or already unliked.' });
        }

        // Get the updated likes count
        const post = await Post.findById(postId).select('likes');
        const likesCount = post.likes.length;

        console.log('Post unliked successfully. Total likes:', likesCount);
        res.json({ msg: 'Post unliked successfully.', likes: likesCount });
    } catch (err) {
        console.error('Error unliking post:', err.message, err.stack);
        res.status(500).json({ msg: 'Server error while unliking the post.' });
    }
});

// --------------------- Fetch Feed Posts Route ---------------------
router.get('/feed', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Fetch the list of users the current user follows
        const currentUser = await User.findById(userId).select('following');

        if (!currentUser) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const following = currentUser.following.map(id => id.toString());
        // Include the current user's own posts
        following.push(userId);

        // Fetch posts from the current user and users they follow
        const posts = await Post.find({ user: { $in: following } })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('user', 'username profilePicture')
            .populate({
                path: 'comments',
                populate: {
                    path: 'user',
                    select: 'username profilePicture'
                }
            });

        res.json(posts);
    } catch (err) {
        console.error('Error fetching feed posts:', err);
        res.status(500).json({ msg: 'Server error while fetching feed posts.' });
    }
}); 
router.delete('/:postId', authenticateToken, async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.user.id;

        console.log(`Delete request for postId: ${postId} by userId: ${userId}`);

        // Find the post
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        // Check if the user is the owner of the post
        if (post.user.toString() !== userId) {
            return res.status(403).json({ msg: 'Unauthorized action' });
        }

        // Delete the image file associated with the post
        if (post.imageUrl) {
            const imagePath = path.join(__dirname, '..', post.imageUrl);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        // Delete the post
        await Post.findByIdAndDelete(postId);

        res.json({ msg: 'Post deleted successfully' });
    } catch (err) {
        console.error('Error deleting post:', err.message, err.stack);
        res.status(500).json({ msg: 'Server error while deleting the post.' });
    }
});
router.put('/:postId', authenticateToken, async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.user.id;
        const { caption } = req.body;

        console.log(`Edit request for postId: ${postId} by userId: ${userId}`);

        // Find the post
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        // Check if the user is the owner of the post
        if (post.user.toString() !== userId) {
            return res.status(403).json({ msg: 'Unauthorized action' });
        }

        // Update the post's caption
        post.caption = caption || post.caption;
        await post.save();

        res.json({ msg: 'Post updated successfully', post });
    } catch (err) {
        console.error('Error updating post:', err.message, err.stack);
        res.status(500).json({ msg: 'Server error while updating the post.' });
    }
});
module.exports = router;
