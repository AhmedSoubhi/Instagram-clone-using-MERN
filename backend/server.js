// backend/server.js

const express = require('express');
const http = require('http'); // Import HTTP to create server
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const socketIo = require('socket.io'); // Import Socket.io

// Import Route Files
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts'); // Updated to include posts routes
const followRoutes = require('./routes/follow');
const searchRoutes = require('./routes/search');
const messageRoutes = require('./routes/messages'); // New Route for Messages
const userRoutes = require('./routes/users'); // New Route for Users
const commentRoutes = require('./routes/comments'); // New Route for Comments

// Import Utilities
const connectedUsers = require('./utils/connectedUsers');

dotenv.config();

const app = express();
const server = http.createServer(app); // Create HTTP server
const io = socketIo(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Attach io to req for routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes); // Mount posts route
app.use('/api/follow', followRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/users', userRoutes); // Mount users route
app.use('/api/comments', commentRoutes); // Mount comments route
app.use('/api/messages', messageRoutes); // Mount message routes

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ msg: 'Internal Server Error' });
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.log(err));

// Socket.io Connection Handling
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Listen for 'join' event to map userId to socket.id
    socket.on('join', (userId) => {
        connectedUsers.set(userId.toString(), socket.id);
        console.log(`User ${userId} connected with socket ID ${socket.id}`);
    });

    // Listen for 'sendMessage' event
    socket.on('sendMessage', ({ senderId, receiverId, content, createdAt }) => {
        console.log(`Received sendMessage from ${senderId} to ${receiverId}: ${content}`);
        const receiverSocketId = connectedUsers.get(receiverId.toString());
        const senderSocketId = connectedUsers.get(senderId.toString());

        const messageData = {
            senderId: senderId.toString(),
            receiverId: receiverId.toString(),
            content,
            createdAt: createdAt || new Date().toISOString()
        };

        console.log('Constructed messageData:', messageData);

        // Emit to receiver if connected
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('receiveMessage', messageData); // Use io.to instead of socket.to
            console.log(`Emitted receiveMessage to ${receiverId} via socket ID ${receiverSocketId}`);
        } else {
            console.log(`User ${receiverId} is not connected. Message not emitted to receiver.`);
        }

        // Emit to sender to confirm message sent
        if (senderSocketId && senderSocketId !== receiverSocketId) {
            io.to(senderSocketId).emit('messageSent', messageData); // Use io.to instead of socket.to
            console.log(`Emitted messageSent back to sender ${senderId} via socket ID ${senderSocketId}`);
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Remove user from connectedUsers
        for (let [userId, socketId] of connectedUsers.entries()) {
            if (socketId === socket.id) {
                connectedUsers.delete(userId);
                console.log(`Removed user ${userId} from connected users.`);
                break;
            }
        }
    });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
