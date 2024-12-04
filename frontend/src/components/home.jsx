// frontend/src/Home.js

import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getUserInfo, logout } from '../utils/auth';
import axios from 'axios';
import InfiniteScroll from 'react-infinite-scroll-component';
import Post from './Post/Post'; // Correct import path
import './Home.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from '../components/Sidebar'; // Import Sidebar component

function Home() {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [feedPosts, setFeedPosts] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);

    const LIMIT = 10;

    useEffect(() => {
        const fetchData = async () => {
            const userInfo = getUserInfo();

            if (userInfo && userInfo.id) {
                try {
                    // Fetch user-specific data
                    const profileRes = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/auth/user/${userInfo.id}`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });

                    setUserData(profileRes.data);

                    // Fetch feed posts
                    const feedRes = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/posts/feed?page=${page}&limit=${LIMIT}`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });

                    setFeedPosts(feedRes.data);
                    setHasMore(feedRes.data.length === LIMIT);
                    setError(null);
                } catch (err) {
                    if (err.response) {
                        setError(err.response.data.msg || 'An error occurred while fetching data.');
                        if (err.response.status === 401) {
                            logout();
                            navigate('/login');
                        }
                    } else if (err.request) {
                        setError('No response from server. Please try again later.');
                    } else {
                        setError('An unexpected error occurred.');
                    }
                    console.error('Error fetching data:', err);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setError('User information is missing.');
                navigate('/login');
            }
        };

        fetchData();
    }, [navigate]); // Removed 'page' from dependencies to prevent re-fetching on page change

    const fetchMorePosts = async () => {
        const nextPage = page + 1;

        try {
            const feedRes = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/posts/feed?page=${nextPage}&limit=${LIMIT}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            setFeedPosts(prevPosts => [...prevPosts, ...feedRes.data]);
            setHasMore(feedRes.data.length === LIMIT);
            setPage(nextPage);
        } catch (err) {
            console.error('Error fetching more posts:', err);
            setHasMore(false);
            toast.error('Failed to load more posts.');
        }
    };

    const handleNavigation = (path) => {
        navigate(path);
    };

    const handleLike = async (postId) => {
        try {
            await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/posts/like/${postId}`, {}, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            // Update the local state to reflect the like
            setFeedPosts(prevPosts => prevPosts.map(post => {
                if (post._id === postId) {
                    // Prevent duplicate likes
                    if (!post.likes.includes(userData.id)) {
                        return { ...post, likes: [...post.likes, userData.id] };
                    }
                }
                return post;
            }));
            toast.success('Post liked!');
        } catch (err) {
            console.error('Error liking post:', err);
            toast.error(err.response?.data?.msg || 'Failed to like the post.');
        }
    };

    const handleUnlike = async (postId) => {
        try {
            await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/posts/unlike/${postId}`, {}, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            // Update the local state to reflect the unlike
            setFeedPosts(prevPosts => prevPosts.map(post => {
                if (post._id === postId) {
                    return { ...post, likes: post.likes.filter(userId => userId !== userData.id) };
                }
                return post;
            }));
            toast.success('Post unliked!');
        } catch (err) {
            console.error('Error unliking post:', err);
            toast.error(err.response?.data?.msg || 'Failed to unlike the post.');
        }
    };

    const isPostLiked = (post) => {
        return post.likes.includes(userData.id);
    };

    return (
        <div className="home-container">
                
            <div className="home">
            <Sidebar />

                
                {isLoading ? (
                    <p>Loading feed...</p>
                ) : error ? (
                    <p className="error-message">Error: {error}</p>
                ) : (
                    <InfiniteScroll
                        dataLength={feedPosts.length}
                        next={fetchMorePosts}
                        hasMore={hasMore}
                        loader={<h4>Loading...</h4>}
                        endMessage={
                            <p style={{ textAlign: 'center' }}>
                                <b>No more posts to display.</b>
                            </p>
                        }
                    >
                        <div className="feed">
                            {feedPosts.length > 0 ? (
                                feedPosts.map(post => (
                                    <Post 
                                        key={post._id} 
                                        post={post} 
                                        handleLike={handleLike} 
                                        handleUnlike={handleUnlike} 
                                        isLiked={isPostLiked(post)} 
                                    />
                                ))
                            ) : (
                                <p>No posts from followed users.</p>
                            )}
                        </div>
                    </InfiniteScroll>
                )}
            </div>

            {/* Toast Notifications */}
            <ToastContainer />
        </div>
    ); // Changed from '}' to ')'

}

export default Home;
