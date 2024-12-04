// frontend/src/components/CommentsModal/CommentsModal.jsx

import React, { useEffect, useRef } from 'react';
import './CommentsModal.css';
import { FaTimes } from 'react-icons/fa';
import CommentsSection from '../CommentsSection/CommentsSection';
import { Link } from 'react-router-dom';

function CommentsModal({ post, onClose }) {
    const modalRef = useRef(null);

    useEffect(() => {
        const handleEsc = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);

        if (modalRef.current) {
            modalRef.current.focus();
        }

        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    return (
        <div
            className="comments-modal-overlay"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="comments-modal-title"
        >
            <div
                className="comments-modal"
                onClick={(e) => e.stopPropagation()}
                ref={modalRef}
                tabIndex="-1"
            >
                <button
                    className="close-button"
                    onClick={onClose}
                    aria-label="Close Comments Modal"
                >
                    <FaTimes />
                </button>
                <div className="comments-modal-content">
                    <div className="comments-section">
                        <div className="post-header">
                            <Link to={`/user/${post.user._id}`}>
                                <img
                                    src={`${process.env.REACT_APP_BACKEND_URL}${post.user.profilePicture}`}
                                    alt={`${post.user.username}'s profile`}
                                    className="post-profile-pic"
                                    onError={(e) => { e.target.onerror = null; e.target.src = '/fallback.png'; }}
                                />
                            </Link>
                            <Link to={`/user/${post.user._id}`} className="post-username">
                                {post.user.username}
                            </Link>
                        </div>
                        <CommentsSection postId={post._id} />
                    </div>
                    {/* Media Section */}
                    <div className="comments-media-section">
                        {post.mediaType === 'image' ? (
                            <img
                                src={`${process.env.REACT_APP_BACKEND_URL}${post.mediaUrl}`}
                                alt={`Post by ${post.user.username}`}
                                className="comments-post-media"
                                onError={(e) => { e.target.onerror = null; e.target.src = '/fallback.png'; }}
                            />
                        ) : post.mediaType === 'video' ? (
                            <video
                                src={`${process.env.REACT_APP_BACKEND_URL}${post.mediaUrl}`}
                                className="comments-post-media"
                                controls
                                autoPlay
                                loop
                                muted
                            />
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CommentsModal;
