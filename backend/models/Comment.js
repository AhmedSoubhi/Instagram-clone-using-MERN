// backend/models/Comment.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Comment schema
const CommentSchema = new Schema({
    post: {
        type: Schema.Types.ObjectId,
        ref: 'Post', // Reference to the Post model
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true
    },
    text: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now // Timestamp for when the comment was created
    },
    updatedAt: {
        type: Date,
        default: Date.now // Timestamp for when the comment was last updated
    }
}, { timestamps: true }); // Automatically manages createdAt and updatedAt fields

// Export the Comment model
module.exports = mongoose.model('Comment', CommentSchema);
