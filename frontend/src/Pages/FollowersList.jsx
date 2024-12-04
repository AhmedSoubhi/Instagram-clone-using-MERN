// src/Pages/FollowersList.jsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import './FollowersList.css'; // Create a CSS file for styling
import { getUserInfo } from '../utils/auth';

function FollowersList() {
    const { id } = useParams();
    const [followers, setFollowers] = useState([]);
    const [error, setError] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);

    useEffect(() => {
        const currentUser = getUserInfo();
        if (currentUser && currentUser.id) {
            setCurrentUserId(currentUser.id);
        }
    }, []);

    useEffect(() => {
        const fetchFollowers = async () => {
            try {
                const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/follow/followers/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                setFollowers(res.data);
            } catch (err) {
                console.error('Error fetching followers:', err);
                setError(err.response?.data?.msg || 'Failed to fetch followers.');
            }
        };

        fetchFollowers();
    }, [id]);

    return (
        <div className="followers-list-container">
            <h2>Followers</h2>
            {error ? (
                <p className="error-message">Error: {error}</p>
            ) : followers.length > 0 ? (
                <ul className="followers-list">
                    {followers.map(user => (
                        <li key={user._id}>
                            <Link to={`/user/${user._id}`}>
                                <p><strong>{user.username}</strong></p>
                                <p>{user.email}</p>
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No followers found.</p>
            )}
        </div>
    );
}

export default FollowersList;
