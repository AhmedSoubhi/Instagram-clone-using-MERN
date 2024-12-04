// src/Pages/FollowingList.jsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import './FollowingList.css'; // Create a CSS file for styling
import { getUserInfo } from '../utils/auth';

function FollowingList() {
    const { id } = useParams();
    const [following, setFollowing] = useState([]);
    const [error, setError] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);

    useEffect(() => {
        const currentUser = getUserInfo();
        if (currentUser && currentUser.id) {
            setCurrentUserId(currentUser.id);
        }
    }, []);

    useEffect(() => {
        const fetchFollowing = async () => {
            try {
                const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/follow/following/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                setFollowing(res.data);
            } catch (err) {
                console.error('Error fetching following:', err);
                setError(err.response?.data?.msg || 'Failed to fetch following.');
            }
        };

        fetchFollowing();
    }, [id]);

    return (
        <div className="following-list-container">
            <h2>Following</h2>
            {error ? (
                <p className="error-message">Error: {error}</p>
            ) : following.length > 0 ? (
                <ul className="following-list">
                    {following.map(user => (
                        <li key={user._id}>
                            <Link to={`/user/${user._id}`}>
                                <p><strong>{user.username}</strong></p>
                                <p>{user.email}</p>
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>Not following anyone.</p>
            )}
        </div>
    );
}

export default FollowingList;
