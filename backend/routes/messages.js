// backend/routes/messages.js

const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const Message = require('../models/Message');
const User = require('../models/User');
const Post = require('../models/Post');
const { Types } = require('mongoose');
const connectedUsers = require('../utils/connectedUsers'); // Import connectedUsers
const dotenv = require('dotenv');
dotenv.config();

// @route   GET /api/messages/conversations
// @desc    Get all conversations (list of users the current user has chatted with)
// @access  Private
router.get('/conversations', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch the current user to get the following list
        const currentUser = await User.findById(userId).select('following');
        if (!currentUser) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const followedUserIds = currentUser.following.map(id => id.toString());

        // Fetch the latest message between current user and each followed user
        const conversations = await Promise.all(
            followedUserIds.map(async (followedUserId) => {
                const latestMessage = await Message.findOne({
                    $or: [
                        { sender: userId, receiver: followedUserId },
                        { sender: followedUserId, receiver: userId }
                    ]
                })
                .sort({ createdAt: -1 })
                .populate('sender', 'username profilePicture')
                .populate('receiver', 'username profilePicture');

                if (latestMessage) {
                    const otherUser = latestMessage.sender._id.toString() === userId
                        ? latestMessage.receiver
                        : latestMessage.sender;

                    return {
                        userId: otherUser._id,
                        username: otherUser.username,
                        profilePicture: otherUser.profilePicture,
                        lastMessage: latestMessage.content,
                        createdAt: latestMessage.createdAt
                    };
                } else {
                    // No messages yet, just return the user info
                    const user = await User.findById(followedUserId).select('username profilePicture');
                    if (user) {
                        return {
                            userId: user._id,
                            username: user.username,
                            profilePicture: user.profilePicture,
                            lastMessage: null,
                            createdAt: null
                        };
                    } else {
                        return null;
                    }
                }
            })
        );

        // Filter out nulls (in case some followed users were not found)
        const filteredConversations = conversations.filter(conv => conv !== null);

        // Sort conversations by latest message (if any), followed users with no messages last
        const sortedConversations = filteredConversations.sort((a, b) => {
            if (a.createdAt && b.createdAt) {
                return b.createdAt - a.createdAt;
            } else if (a.createdAt) {
                return -1;
            } else if (b.createdAt) {
                return 1;
            } else {
                return 0;
            }
        });

        res.json(sortedConversations);
    } catch (err) {
        console.error('Error fetching conversations:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   GET /api/messages/:userId
// @desc    Get all messages between current user and specified user
// @access  Private
router.get('/:userId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const otherUserId = req.params.userId;

        // Validate that otherUserId is a valid ObjectId
        if (!Types.ObjectId.isValid(otherUserId)) {
            return res.status(400).json({ msg: 'Invalid user ID' });
        }

        // Fetch messages between the two users
        const messages = await Message.find({
            $or: [
                { sender: userId, receiver: otherUserId },
                { sender: otherUserId, receiver: userId }
            ]
        })
        .sort({ createdAt: 1 }) // Sort messages in chronological order
        .populate('sender', 'username profilePicture')
        .populate('receiver', 'username profilePicture')
        .populate('sharedPost', 'title description mediaUrl mediaType'); // Updated to include 'mediaUrl' and 'mediaType'

        res.json(messages);
    } catch (err) {
        console.error('Error fetching messages:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});
// @route   POST /api/messages/send
// @desc    Send a message to a user
// @access  Private
router.post('/send', authenticateToken, async (req, res) => {
    try {
        const senderId = req.user.id;
        const { receiverId, content } = req.body;

        // Validate input
        if (!receiverId || !content) {
            return res.status(400).json({ msg: 'Receiver ID and content are required' });
        }

        // Validate that receiverId is a valid ObjectId
        if (!receiverId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ msg: 'Invalid receiver ID' });
        }

        // Check if receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ msg: 'Receiver not found' });
        }

        // Create and save the message
        const newMessage = new Message({
            sender: senderId,
            receiver: receiverId,
            content
        });

        await newMessage.save();

        // Populate sender and receiver fields
        await newMessage.populate('sender', 'username profilePicture');
        await newMessage.populate('receiver', 'username profilePicture');

        res.status(201).json(newMessage);
    } catch (err) {
        console.error('Error sending message:', err); // Enhanced error logging
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/messages/share
// @desc    Share a post to selected users
// @access  Private

router.post('/share', authenticateToken, async (req, res) => {
    try {
        const senderId = req.user.id;
        const { postId, recipientIds } = req.body;

        // Validate input
        if (!postId || !recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
            return res.status(400).json({ msg: 'Post ID and recipient IDs are required.' });
        }

        // Validate postId
        if (!Types.ObjectId.isValid(postId)) {
            return res.status(400).json({ msg: 'Invalid post ID.' });
        }

        // Validate each recipientId
        for (let id of recipientIds) {
            if (!Types.ObjectId.isValid(id)) {
                return res.status(400).json({ msg: `Invalid recipient ID: ${id}` });
            }
        }

        // Check if the post exists
        const post = await Post.findById(postId).populate('user', 'username profilePicture');
        if (!post) {
            return res.status(404).json({ msg: 'Post not found.' });
        }

        // Create a shared message for each recipient
        const sharedMessages = [];

        for (let recipientId of recipientIds) {
            // Prevent sharing to oneself
            if (recipientId === senderId) continue;

            // Create a message object with a reference to the shared post
            const newMessage = new Message({
                sender: senderId,
                receiver: recipientId,
                content: `Shared a post with you.`,
                sharedPost: post._id
            });

            await newMessage.save();

            // Populate sender and sharedPost fields
            await newMessage.populate('sender', 'username profilePicture');
            await newMessage.populate({
                path: 'sharedPost',
                select: 'title description mediaUrl mediaType' // Include 'mediaUrl' and 'mediaType'
            });

            sharedMessages.push(newMessage);
        }

        // Emit messages via Socket.io
        sharedMessages.forEach(message => {
            const receiverSocketId = connectedUsers.get(message.receiver.toString());
            if (receiverSocketId) {
                const messageData = {
                    _id: message._id.toString(),
                    senderId: message.sender._id.toString(),
                    receiverId: message.receiver.toString(),
                    content: message.content,
                    sharedPost: message.sharedPost ? {
                        _id: message.sharedPost._id.toString(),
                        title: message.sharedPost.title,
                        description: message.sharedPost.description,
                        mediaUrl: message.sharedPost.mediaUrl, // Use relative path
                        mediaType: message.sharedPost.mediaType
                    } : null,
                    createdAt: message.createdAt
                };
                io.to(receiverSocketId).emit('receiveMessage', messageData);
                console.log(`Emitted sharedMessage to ${message.receiver} via socket ID ${receiverSocketId}`);
            } else {
                console.log(`User ${message.receiver} is not connected. Shared message not emitted.`);
            }
        });

        res.status(201).json({ msg: 'Post shared successfully.', sharedMessages });
    } catch (err) {
        console.error('Error sharing post:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});
module.exports = router;
