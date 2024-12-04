// frontend/src/components/CommentsSection/CommentsSection.jsx

import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import './CommentsSection.css';
import { AuthContext } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import io from 'socket.io-client';

function CommentsSection({ postId }) {
    const { user } = useContext(AuthContext);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const fetchComments = async () => {
            try {
                const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/comments/${postId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                setComments(res.data);
            } catch (err) {
                console.error('Error fetching comments:', err);
                toast.error(err.response?.data?.msg || 'Failed to fetch comments.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchComments();

        // Initialize Socket.io
        const newSocket = io(process.env.REACT_APP_BACKEND_URL, {
            auth: {
                token: `Bearer ${localStorage.getItem('token')}`
            }
        });
        setSocket(newSocket);

        // Listen for 'newComment' events
        newSocket.on('newComment', (comment) => {
            if (comment.post === postId) {
                setComments(prev => [...prev, comment]);
                toast.info(`${comment.user.username} commented on the post.`);
            }
        });

        // Clean up the socket connection on unmount
        return () => {
            newSocket.disconnect();
        };
    }, [postId]);

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (newComment.trim() === '') {
            toast.error('Comment cannot be empty.');
            return;
        }

        try {
            const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/comments/${postId}`, {
                text: newComment.trim()
            }, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            setComments(prev => [...prev, res.data.comment]);
            setNewComment('');
            toast.success('Comment added successfully.');
        } catch (err) {
            console.error('Error adding comment:', err);
            toast.error(err.response?.data?.msg || 'Failed to add comment.');
        }
    };

    return (
        <div className="comments-container">
            <h4>Comments</h4>
            <div className="comments-list">
                {isLoading ? (
                    <p>Loading comments...</p>
                ) : comments.length === 0 ? (
                    <p>No comments yet. Be the first to comment!</p>
                ) : (
                    <ul className="comments-items">
                        {comments.map(comment => (
                            <li key={comment._id} className="comment-item">
                                <img 
                                    src={`${process.env.REACT_APP_BACKEND_URL}${comment.user.profilePicture}`} 
                                    alt={`${comment.user.username}'s profile`} 
                                    className="comment-avatar" 
                                />
                                <div className="comment-content">
                                    <strong>{comment.user.username}</strong>
                                    <p>{comment.text}</p>
                                    <span className="comment-time">{new Date(comment.createdAt).toLocaleString()}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="add-comment-form">
                <input 
                    type="text"
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="comment-input"
                />
                <button type="submit" className="submit-comment-button">Post</button>
            </form>
        </div>
    );
}

export default CommentsSection;
