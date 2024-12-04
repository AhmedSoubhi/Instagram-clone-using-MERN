// frontend/src/components/Chat/UsersSidebar.jsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { logout } from '../../utils/auth';
import { useNavigate } from 'react-router-dom';
import './UsersSidebar.css';

function UsersSidebar({ selectUser }) {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/messages/conversations`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                setUsers(response.data);
            } catch (err) {
                console.error('Error fetching conversations:', err);
                if (err.response && err.response.status === 401) {
                    logout();
                    navigate('/login');
                }
                setError('Failed to load conversations.');
            }
        };

        fetchConversations();
    }, [navigate]);

    const handleUserClick = (user) => {
        selectUser(user);
    };

    return (
        <div className="users-sidebar">
            <h2>Conversations</h2>
            {error && <p className="error-message">{error}</p>}
            <ul>
                {users.map(user => (
                    <li key={user.userId} onClick={() => handleUserClick(user)} className="user-item">
                        <img src={`${process.env.REACT_APP_BACKEND_URL}${user.profilePicture}`} alt={`${user.username}'s profile`} className="user-profile-pic" />
                        <span>{user.username}</span>
                        {user.lastMessage && <p className="last-message">{user.lastMessage}</p>}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default UsersSidebar;
