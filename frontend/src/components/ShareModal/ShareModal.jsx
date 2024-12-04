// frontend/src/components/ShareModal/ShareModal.jsx

import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../contexts/AuthContext';
import './ShareModal.css';
import { toast } from 'react-toastify';

function ShareModal({ post, onClose }) {
    const { user } = useContext(AuthContext);
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [error, setError] = useState(null);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        // Debounce the search to avoid too many requests
        const delayDebounceFn = setTimeout(() => {
            fetchFollowingUsers();
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const fetchFollowingUsers = async () => {
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/api/users/following`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    params: { search: searchTerm }
                }
            );
            setUsers(response.data);
        } catch (err) {
            console.error('Error fetching following users:', err);
            setError('Failed to load users.');
        }
    };

    const handleUserSelect = (userId) => {
        setSelectedUsers(prev => {
            if (prev.includes(userId)) {
                return prev.filter(id => id !== userId);
            } else {
                return [...prev, userId];
            }
        });
    };

    const handleShare = async () => {
        if (selectedUsers.length === 0) {
            setError('Please select at least one user to share the post with.');
            return;
        }

        setIsSending(true);
        setError(null);

        try {
            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/api/messages/share`,
                {
                    postId: post._id,
                    recipientIds: selectedUsers
                },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            console.log('Post shared successfully:', response.data);
            toast.success('Post shared successfully!');
            onClose();
        } catch (err) {
            console.error('Error sharing post:', err);
            setError('Failed to share the post.');
            toast.error('Failed to share the post.');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="share-modal-overlay">
            <div className="share-modal">
                <h2>Share Post</h2>
                <button className="close-button" onClick={onClose}>×</button>

                <div className="share-modal-body">
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="user-search-input"
                    />
                    {error && <p className="error-message">{error}</p>}
                    <ul className="user-list">
                        {users.map(u => (
                            <li key={u._id}>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.includes(u._id)}
                                        onChange={() => handleUserSelect(u._id)}
                                    />
                                    <img src={`${process.env.REACT_APP_BACKEND_URL}${u.profilePicture}`} alt={u.username} className="user-avatar" />
                                    {u.username}
                                </label>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="share-modal-footer">
                    <button onClick={handleShare} disabled={isSending}>
                        {isSending ? 'Sharing...' : 'Share'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ShareModal;
