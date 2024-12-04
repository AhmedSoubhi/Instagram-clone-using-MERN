// src/Pages/UserProfile.jsx

import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './UserProfile.css';
import { getUserInfo } from '../utils/auth';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import fallback images if they are in the 'src/assets' directory
// import fallbackImage from '../assets/fallback.png';
// import defaultProfilePicture from '../assets/default_profile_picture.png';

function UserProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [posts, setPosts] = useState([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const user = getUserInfo();
        setCurrentUser(user);
    }, []);

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!currentUser || !currentUser.id) return;
            setIsLoading(true);
            try {
                // Fetch user data
                const userRes = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/auth/user/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                setUserData(userRes.data);

                // Fetch user's posts
                const postsRes = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/posts/user/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                setPosts(postsRes.data);

                // Check if current user is following this user
                if (currentUser && currentUser.id) {
                    const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/auth/user/${currentUser.id}`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });

                    // Extract IDs from following array
                    const followingIds = response.data.following.map(followingUser => {
                        if (followingUser && followingUser._id) {
                            return followingUser._id.toString();
                        } else if (typeof followingUser === 'string') {
                            return followingUser;
                        } else if (followingUser && followingUser.toString) {
                            return followingUser.toString();
                        } else {
                            console.warn('Cannot extract ID from followingUser:', followingUser);
                            return '';
                        }
                    });

                    const isFollowingUser = followingIds.includes(id.toString());
                    setIsFollowing(isFollowingUser);

                    // Debugging logs
                    console.log('Current User ID:', currentUser.id);
                    console.log('Viewed User ID:', id);
                    console.log('Following IDs:', followingIds);
                    console.log('Is Following User:', isFollowingUser);
                }

                setError(null);
            } catch (err) {
                if (err.response) {
                    setError(err.response.data.msg || 'An error occurred while fetching data.');
                    if (err.response.status === 401) {
                        toast.error('Session expired. Please log in again.');
                        navigate('/login');
                    }
                } else if (err.request) {
                    setError('No response from server. Please try again later.');
                } else {
                    setError('An unexpected error occurred.');
                }
                console.error('Error fetching user profile:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserProfile();
    }, [id, currentUser, navigate]);

    const handleFollow = async () => {
        try {
            await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/follow/follow/${id}`, {}, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setIsFollowing(true);
            toast.success('You are now following this user.');
            // Refresh user data to update follower counts
            const userRes = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/auth/user/${id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setUserData(userRes.data);
        } catch (err) {
            console.error('Error following user:', err);
            toast.error(err.response?.data?.msg || 'Failed to follow user.');
        }
    };

    const handleUnfollow = async () => {
        try {
            await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/follow/unfollow/${id}`, {}, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setIsFollowing(false);
            toast.success('You have unfollowed this user.');
            // Refresh user data to update follower counts
            const userRes = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/auth/user/${id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setUserData(userRes.data);
        } catch (err) {
            console.error('Error unfollowing user:', err);
            toast.error(err.response?.data?.msg || 'Failed to unfollow user.');
        }
    };

    return (
        <div className="user-profile-container">
            {error ? (
                <p className="error-message">Error: {error}</p>
            ) : userData ? (
                <div className="user-profile-content">
                    <div className="user-header">
                        <div className="user-image">
                            <img
                                src={`${process.env.REACT_APP_BACKEND_URL}${userData.profilePicture}`}
                                alt={`${userData.username}'s profile`}
                                className="profile-picture"
                                onError={(e) => { e.target.onerror = null; e.target.src = '/default_profile_picture.png'; }}
                            />
                        </div>
                        <div className="user-info">
                            <h2 className="username">{userData.username}</h2>
                            <div className="user-stats">
                                <span>
                                    <strong>{posts.length}</strong> posts
                                </span>
                                <span>
                                    <strong>
                                        <Link to={`/user/${userData._id}/followers`}>
                                            {userData.followers ? userData.followers.length : 0}
                                        </Link>
                                    </strong>{' '}
                                    followers
                                </span>
                                <span>
                                    <strong>
                                        <Link to={`/user/${userData._id}/following`}>
                                            {userData.following ? userData.following.length : 0}
                                        </Link>
                                    </strong>{' '}
                                    following
                                </span>
                            </div>
                            {/* Follow/Unfollow Buttons */}
                            {currentUser && currentUser.id !== userData._id.toString() && (
                                isFollowing ? (
                                    <button className="unfollow-button" onClick={handleUnfollow}>Unfollow</button>
                                ) : (
                                    <button className="follow-button" onClick={handleFollow}>Follow</button>
                                )
                            )}
                            {/* Upload Post Button: Only visible on own profile */}
                            {currentUser && currentUser.id === userData._id.toString() && (
                                <Link to="/upload-post">
                                    <button className="upload-button">Upload Post</button>
                                </Link>
                            )}
                        </div>
                    </div>
                    <h3 className="posts-heading">{userData.username}'s Posts:</h3>
                    {posts.length > 0 ? (
                        <div className="posts-grid">
                            {posts.map(post => (
                                <div key={post._id} className="post-item">
                                    {post.mediaType === 'image' ? (
                                        <img
                                            src={`${process.env.REACT_APP_BACKEND_URL}${post.mediaUrl}`}
                                            alt={`Post by ${userData.username}`}
                                            className="post-image"
                                            loading="lazy"
                                            onError={(e) => { e.target.onerror = null; e.target.src = '/fallback.png'; }}
                                        />
                                    ) : post.mediaType === 'video' ? (
                                        <video
                                            src={`${process.env.REACT_APP_BACKEND_URL}${post.mediaUrl}`}
                                            className="post-video"
                                            controls
                                        />
                                    ) : null}
                                    {/* Optional: Include captions or other post details */}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>No posts available.</p>
                    )}
                </div>
            ) : (
                <p>Loading user profile...</p>
            )}
            <ToastContainer />
        </div>
    );
}

export default UserProfile;
