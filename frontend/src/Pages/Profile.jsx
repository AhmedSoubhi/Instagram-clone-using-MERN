// frontend/src/Pages/Profile.jsx

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserInfo, logout } from '../utils/auth';
import axios from 'axios';
import './Profile.css';
import Sidebar from '../components/Sidebar'; // Import Sidebar component

function Profile() {
    const [profileData, setProfileData] = useState(null);
    const [posts, setPosts] = useState([]);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [currentPost, setCurrentPost] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            const userInfo = getUserInfo();

            if (userInfo && userInfo.id) {
                try {
                    // Fetch profile data
                    const profileRes = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/auth/user/${userInfo.id}`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });

                    setProfileData(profileRes.data);

                    // Fetch user's posts
                    const postsRes = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/posts/user/${userInfo.id}`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });

                    setPosts(postsRes.data);
                } catch (err) {
                    if (err.response) {
                        // Server responded with a status other than 2xx
                        setError(err.response.data.msg || 'An error occurred while fetching data.');
                        if (err.response.status === 401) {
                            // Unauthorized, possibly token expired
                            logout(); // Clear tokens
                            navigate('/login'); // Redirect to login
                        }
                    } else if (err.request) {
                        // Request was made but no response received
                        setError('No response from server. Please try again later.');
                    } else {
                        // Something else happened
                        setError('An unexpected error occurred.');
                    }
                    console.error('Error fetching data:', err);
                }
            } else {
                setError('User information is missing.');
                navigate('/login'); // Redirect to login if user info is missing
            }
        };

        fetchProfile();
    }, [navigate]);

    const handleDelete = async (postId) => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            try {
                await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/posts/${postId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                // Remove the deleted post from the state
                setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
                alert('Post deleted successfully');
            } catch (err) {
                console.error('Error deleting post:', err);
                alert(err.response?.data?.msg || 'Failed to delete the post.');
            }
        }
    };

    const handleEdit = (post) => {
        setCurrentPost(post);
        setIsEditing(true);
    };

    const handleUpdate = async (updatedCaption) => {
        try {
            await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/posts/${currentPost._id}`, {
                caption: updatedCaption
            }, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            // Update the post in the state
            setPosts(prevPosts => prevPosts.map(post =>
                post._id === currentPost._id ? { ...post, caption: updatedCaption } : post
            ));

            setIsEditing(false);
            setCurrentPost(null);
            alert('Post updated successfully');
        } catch (err) {
            console.error('Error updating post:', err);
            alert(err.response?.data?.msg || 'Failed to update the post.');
        }
    };

    const openModal = (post) => {
        setSelectedPost(post);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedPost(null);
        setIsModalOpen(false);
    };

    return (
        <div className="profile-container">
            <Sidebar />

            <h2>Profile Page</h2>
            {error ? (
                <p className="profile-error-message">Error: {error}</p>
            ) : profileData ? (
                <div className="profile-content">
                    <div className="profile-info">
                        <img
                            src={`${process.env.REACT_APP_BACKEND_URL}${profileData.profilePicture}`}
                            alt={`${profileData.username}'s profile`}
                            className="profile-picture"
                            onError={(e) => { e.target.onerror = null; e.target.src = '/uploads/profile_pictures/default.png'; }}
                        />
                        <p><strong>Username:</strong> {profileData.username}</p>
                        <p><strong>Email:</strong> {profileData.email}</p>
                        <div className="profile-follow-info">
                            <p>
                                <strong>Followers:</strong> {Array.isArray(profileData.followers) ? profileData.followers.length : 0}{' '}
                                <Link to={`/user/${profileData._id}/followers`}>followers</Link>
                            </p>
                            <p>
                                <strong>Following:</strong> {Array.isArray(profileData.following) ? profileData.following.length : 0}{' '}
                                <Link to={`/user/${profileData._id}/following`}>following</Link>
                            </p>
                        </div>
                        <Link to="/upload-post">
                            <button className="profile-upload-button">Upload Post</button>
                        </Link>
                    </div>
                    <h3>Your Posts:</h3>
                    {posts.length > 0 ? (
                        <div className="profile-posts-grid">
                            {posts.map(post => (
                                <div key={post._id} className="profile-post-item">
                                    {post.mediaType === 'image' ? (
                                        <img
                                            src={`${process.env.REACT_APP_BACKEND_URL}${post.mediaUrl}`}
                                            alt={`Post by ${profileData.username}`}
                                            className="profile-post-media"
                                            loading="lazy"
                                            onError={(e) => { e.target.onerror = null; e.target.src = '/fallback.png'; }}
                                            onClick={() => openModal(post)}
                                            style={{ cursor: 'pointer' }}
                                        />
                                    ) : post.mediaType === 'video' ? (
                                        <video
                                            src={`${process.env.REACT_APP_BACKEND_URL}${post.mediaUrl}`}
                                            className="profile-post-media"
                                            controls
                                            onClick={() => openModal(post)}
                                            style={{ cursor: 'pointer' }}
                                        />
                                    ) : null}
                                    <p className="profile-post-caption">{post.caption}</p>
                                    <div className="profile-post-actions">
                                        <button onClick={() => handleEdit(post)} className="profile-edit-button">Edit</button>
                                        <button onClick={() => handleDelete(post._id)} className="profile-delete-button">Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>No posts available.</p>
                    )}
                </div>
            ) : (
                <p>Loading profile data...</p>
            )}
            {isEditing && currentPost && (
                <div className="profile-edit-modal">
                    <div className="profile-edit-modal-content">
                        <h3>Edit Post</h3>
                        <textarea
                            value={currentPost.caption}
                            onChange={(e) => setCurrentPost({ ...currentPost, caption: e.target.value })}
                            rows="4"
                            cols="50"
                        />
                        <div className="profile-modal-actions">
                            <button onClick={() => handleUpdate(currentPost.caption)} className="profile-save-button">Save</button>
                            <button onClick={() => { setIsEditing(false); setCurrentPost(null); }} className="profile-cancel-button">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
            {isModalOpen && selectedPost && (
                <div className="post-modal">
                    <div className="post-modal-content">
                        <span className="close-button" onClick={closeModal}>&times;</span>
                        {selectedPost.mediaType === 'image' ? (
                            <img
                                src={`${process.env.REACT_APP_BACKEND_URL}${selectedPost.mediaUrl}`}
                                alt={`Post by ${profileData.username}`}
                                className="modal-post-media"
                                onError={(e) => { e.target.onerror = null; e.target.src = '/fallback.png'; }}
                            />
                        ) : selectedPost.mediaType === 'video' ? (
                            <video
                                src={`${process.env.REACT_APP_BACKEND_URL}${selectedPost.mediaUrl}`}
                                className="modal-post-media"
                                controls
                            />
                        ) : null}
                        <div className="modal-post-details">
                            <p className="modal-post-caption">{selectedPost.caption}</p>
                            <p className="modal-post-likes">Likes: {Array.isArray(selectedPost.likes) ? selectedPost.likes.length : 0}</p>
                            <div className="modal-post-comments">
                                <h4>Comments:</h4>
                                {Array.isArray(selectedPost.comments) && selectedPost.comments.length > 0 ? (
                                    selectedPost.comments.map(comment => (
                                        <p key={comment._id}><strong>{comment.username}:</strong> {comment.text}</p>
                                    ))
                                ) : (
                                    <p>No comments yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Profile;
