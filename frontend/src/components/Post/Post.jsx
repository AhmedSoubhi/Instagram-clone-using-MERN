// frontend/src/components/Post/Post.jsx

import React, { useState, useRef } from 'react';
import ShareModal from '../ShareModal/ShareModal';
import CommentsModal from '../CommentsSection/CommentsModal.jsx';
import './Post.css';
import { Link } from 'react-router-dom';
import LikeIcon from './Like.png';
import UnlikeIcon from './Unlike.png';
import ShareIcon from './Share.png';
import CommentIcon from './Comment.png';

function Post({ post, handleLike, handleUnlike, isLiked }) {
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
    const videoRef = useRef(null);

    const handleShareClick = () => {
        setIsShareModalOpen(true);
    };

    const closeShareModal = () => {
        setIsShareModalOpen(false);
    };

    const openCommentsModal = () => {
        setIsCommentsModalOpen(true);
    };

    const closeCommentsModal = () => {
        setIsCommentsModalOpen(false);
    };

    const handleVideoClick = () => {
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play();
            } else {
                videoRef.current.pause();
            }
        }
    };

    return (
        <div className="post">
            <div className="post-header">
                <Link to={`/user/${post.user._id}`}>
                    <img 
                        src={`${process.env.REACT_APP_BACKEND_URL}${post.user.profilePicture}`} 
                        alt={`${post.user.username}'s profile`} 
                        className="post-profile-pic" 
                    />
                </Link>
                <Link to={`/user/${post.user._id}`} className="post-username">
                    {post.user.username}
                </Link>
            </div>

            {/* Media Content */}
            {post.mediaType === 'image' ? (
                <img 
                    src={`${process.env.REACT_APP_BACKEND_URL}${post.mediaUrl}`} 
                    alt={`Post by ${post.user.username}`} 
                    className="post-media" 
                    loading="lazy"
                    onError={(e) => { e.target.onerror = null; e.target.src='/fallback.png'; }}
                />
            ) : post.mediaType === 'video' ? (
                <video 
                    ref={videoRef}
                    src={`${process.env.REACT_APP_BACKEND_URL}${post.mediaUrl}`} 
                    className="post-media"
                    autoPlay
                    loop
                    muted
                    onClick={handleVideoClick}
                    controls={false}
                    playsInline
                />
            ) : null}

            <div className="post-actions">
                <span className="likes-count">
                    {post.likes.length} {post.likes.length === 1 ? 'like' : 'likes'}
                </span>
                <div className="action-buttons">
                    {/* Like Button */}
                    {isLiked ? (
                        <button 
                            className="like-button liked" 
                            onClick={() => handleUnlike(post._id)}
                        >
                            <img src={UnlikeIcon} alt="Unlike" className="action-icon" />
                        </button>
                    ) : (
                        <button 
                            className="like-button" 
                            onClick={() => handleLike(post._id)}
                        >
                            <img src={LikeIcon} alt="Like" className="action-icon" />
                        </button>
                    )}
                    
                    {/* Share Button */}
                    <button onClick={handleShareClick} className="share-button">
                        <img src={ShareIcon} alt="Share" className="action-icon" />
                    </button>
                    
                    {/* Comment Button */}
                    <button onClick={openCommentsModal} className="comment-button">
                        <img src={CommentIcon} alt="Comment" className="action-icon" />
                    </button>
                </div>
            </div>
            <p className="post-caption">
                <strong>{post.user.username}</strong> {post.caption}
            </p>
            <p className="post-time">{new Date(post.createdAt).toLocaleString()}</p>

            {/* Share Modal */}
            {isShareModalOpen && (
                <ShareModal post={post} onClose={closeShareModal} />
            )}

            {/* Comments Modal */}
            {isCommentsModalOpen && (
                <CommentsModal post={post} onClose={closeCommentsModal} />
            )}
        </div>
    );
};

export default Post;
