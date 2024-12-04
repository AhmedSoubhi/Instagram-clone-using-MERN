// routes/auth.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authenticateToken = require('../middleware/authenticateToken');
const multer = require('multer'); // Import Multer
const path = require('path');
const fs = require('fs');
// Function to generate an access token
const generateAccessToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });
};

// Function to generate a refresh token
const generateRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

// Configure Multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '..', 'uploads', 'profile_pictures');
        // Ensure the directory exists
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Use the original name or create a unique one
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only images are allowed'));
    }
};

// Initialize Multer with defined storage and file filter
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
    fileFilter: fileFilter
});

// Register Route with Profile Picture Upload
router.post('/register', upload.single('profilePicture'), async (req, res) => {
    const { username, email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        // Initialize profilePicture path
        let profilePicPath = '/uploads/profile_pictures/default.png'; // Default path

        // If a file is uploaded, set the profilePicture path
        if (req.file) {
            profilePicPath = `/uploads/profile_pictures/${req.file.filename}`;
        }

        user = new User({
            username,
            email,
            password,
            profilePicture: profilePicPath,
            followers: [],
            following: []
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        const payload = { id: user.id };
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        // Optional: Log token details for debugging
        const decodedAccess = jwt.decode(accessToken);
        const decodedRefresh = jwt.decode(refreshToken);
        console.log('Access Token Decoded:', decodedAccess);
        console.log('Refresh Token Decoded:', decodedRefresh);

        res.json({ accessToken, refreshToken, msg: 'User registered successfully' });
    } catch (err) {
        console.error('Error during registration:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});
router.post('/update-profile-picture', authenticateToken, upload.single('profilePicture'), async (req, res) => {
    try {
      const userId = req.user.id;
  
      // Find the user
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ msg: 'User not found' });
  
      // Delete the old profile picture if it exists and is not the default
      if (user.profilePicture && user.profilePicture !== '/uploads/profile_pictures/default.png') {
        const oldPicPath = path.join(__dirname, '..', user.profilePicture);
        if (fs.existsSync(oldPicPath)) {
          fs.unlinkSync(oldPicPath);
        }
      }
  
      // Update the profile picture path
      if (req.file) {
        user.profilePicture = `/uploads/profile_pictures/${req.file.filename}`;
        await user.save();
        res.json({ msg: 'Profile picture updated successfully', profilePicture: user.profilePicture });
      } else {
        res.status(400).json({ msg: 'No file uploaded' });
      }
    } catch (err) {
      console.error('Error updating profile picture:', err);
      res.status(500).json({ msg: 'Server error' });
    }
  });
// Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

        const payload = { id: user.id };
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        // Optional: Log token details for debugging
        const decodedAccess = jwt.decode(accessToken);
        const decodedRefresh = jwt.decode(refreshToken);
        console.log('Access Token Decoded:', decodedAccess);
        console.log('Refresh Token Decoded:', decodedRefresh);

        res.json({ accessToken, refreshToken });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Refresh Token Route
router.post('/token', (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(401).json({ msg: 'No token provided' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        const accessToken = generateAccessToken({ id: decoded.id });
        res.json({ accessToken });
    } catch (err) {
        console.error('Error verifying refresh token:', err.message);
        res.status(403).json({ msg: 'Invalid refresh token' });
    }
});

// Route to get user-specific data
router.get('/user/:id', authenticateToken, async (req, res) => {
    console.log(`GET /user/${req.params.id} called`);
    try {
        const user = await User.findById(req.params.id)
            .select('-password -resetToken -expireToken')
            .populate('followers', 'username profilePicture') // Populate followers
            .populate('following', 'username profilePicture'); // Populate following

        if (!user) {
            console.log('User not found');
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        console.error('Error fetching user:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});
module.exports = router; // Only export the router
