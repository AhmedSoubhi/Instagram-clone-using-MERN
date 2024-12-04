// frontend/src/components/Chat/ChatWindow.jsx

import React, { useEffect, useState, useRef, useContext } from 'react';
import axios from 'axios';
import socket from '../../utils/socket';
import { AuthContext } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './ChatWindow.css';

function ChatWindow({ selectedUser, isMobile, onBack }) {
    const { user, handleLogout } = useContext(AuthContext);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!selectedUser || !user) return;

        // Fetch existing messages
        const fetchMessages = async () => {
            try {
                const response = await axios.get(
                    `${process.env.REACT_APP_BACKEND_URL}/api/messages/${selectedUser.userId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    }
                );

                const formattedMessages = response.data.map(msg => ({
                    _id: msg._id.toString(),
                    senderId: msg.sender._id.toString(),
                    receiverId: msg.receiver._id.toString(),
                    content: msg.content,
                    sharedPost: msg.sharedPost ? {
                        _id: msg.sharedPost._id.toString(),
                        title: msg.sharedPost.title,
                        description: msg.sharedPost.description,
                        mediaUrl: msg.sharedPost.mediaUrl,
                        mediaType: msg.sharedPost.mediaType
                    } : null,
                    createdAt: msg.createdAt
                }));

                setMessages(formattedMessages);
                scrollToBottom();
            } catch (err) {
                console.error('Error fetching messages:', err);
                if (err.response && err.response.status === 401) {
                    handleLogout();
                    navigate('/login');
                }
                setError('Failed to load messages.');
            }
        };

        fetchMessages();

        // Connect to Socket.io and join the conversation
        if (!socket.connected) {
            socket.connect();
        }

        socket.emit('join', user.id.toString());

        // Listen for incoming messages
        socket.on('receiveMessage', (message) => {
            const senderId = message.senderId.toString();
            const receiverId = message.receiverId.toString();

            // Add message to the chat if it's intended for this conversation
            if (
                (senderId === selectedUser.userId.toString() && receiverId === user.id.toString()) ||
                (senderId === user.id.toString() && receiverId === selectedUser.userId.toString())
            ) {
                setMessages(prevMessages => [...prevMessages, {
                    _id: message._id,
                    senderId,
                    receiverId,
                    content: message.content,
                    sharedPost: message.sharedPost ? {
                        _id: message.sharedPost._id,
                        title: message.sharedPost.title,
                        description: message.sharedPost.description,
                        mediaUrl: message.sharedPost.mediaUrl,
                        mediaType: message.sharedPost.mediaType
                    } : null,
                    createdAt: message.createdAt
                }]);
                scrollToBottom();
            }
        });

        // Clean up the socket listeners when the component unmounts or selectedUser changes
        return () => {
            socket.off('receiveMessage');
            socket.off('messageSent');
        };
    }, [selectedUser, user, handleLogout, navigate]);

    const sendMessage = async () => {
        if (input.trim() === '') return;

        const messageData = {
            receiverId: selectedUser.userId.toString(),
            content: input.trim()
        };

        try {
            // Send the message to the backend to save in DB
            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/api/messages/send`,
                messageData,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            // Emit the message via Socket.io
            socket.emit('sendMessage', {
                senderId: user.id.toString(),
                receiverId: selectedUser.userId.toString(),
                content: input.trim(),
                createdAt: response.data.createdAt
            });

            // Add the saved message to local state
            setMessages(prevMessages => [...prevMessages, {
                _id: response.data._id.toString(),
                senderId: user.id.toString(),
                receiverId: selectedUser.userId.toString(),
                content: response.data.content,
                sharedPost: null, // Regular message
                createdAt: response.data.createdAt
            }]);

            setInput('');
            scrollToBottom();
        } catch (err) {
            console.error('Error sending message:', err);
            setError('Failed to send message.');
        }
    };

    const handleInputKeyPress = (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="chat-window">
            {selectedUser ? (
                <>
                    {/* Mobile Back Button */}
                    {isMobile && (
                        <div className="chat-header mobile-header">
                            <button className="back-button" onClick={onBack} aria-label="Go back">
                                <span className="arrow-icon">←</span>
                            </button>
                            <img
                                src={`${process.env.REACT_APP_BACKEND_URL}${selectedUser.profilePicture}`}
                                alt={`${selectedUser.username}'s profile`}
                                className="chat-user-pic"
                            />
                            <h3>{selectedUser.username}</h3>
                        </div>
                    )}

                    {/* Desktop Header */}
                    {!isMobile && (
                        <div className="chat-header">
                            <img
                                src={`${process.env.REACT_APP_BACKEND_URL}${selectedUser.profilePicture}`}
                                alt={`${selectedUser.username}'s profile`}
                                className="chat-user-pic"
                            />
                            <h3>{selectedUser.username}</h3>
                        </div>
                    )}

                    <div className="chat-messages">
                        {error && <p className="error-message">{error}</p>}
                        {messages.map((msg) => (
                            <div
                                key={msg._id}
                                className={`message ${msg.senderId === user.id.toString() ? 'sent' : 'received'}`}
                            >
                                {msg.content && <p>{msg.content}</p>}
                                {msg.sharedPost && (
    <div className="shared-post">
        <h4>{msg.sharedPost.title}</h4>
        {msg.sharedPost.mediaType === 'image' ? (
            <img
                src={`${process.env.REACT_APP_BACKEND_URL}${msg.sharedPost.mediaUrl}`}
                alt={msg.sharedPost.title}
                className="shared-post-media"
                onError={(e) => { e.target.onerror = null; e.target.src='/fallback.png'; }}
            />
        ) : msg.sharedPost.mediaType === 'video' ? (
            <video
                src={`${process.env.REACT_APP_BACKEND_URL}${msg.sharedPost.mediaUrl}`}
                className="shared-post-media"
                controls
            />
        ) : null}
        <p>{msg.sharedPost.description}</p>
    </div>
)}
                                <span>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="chat-input">
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleInputKeyPress}
                        />
                        <button onClick={sendMessage}>Send</button>
                    </div>
                </>
            ) : (
                <div className="no-conversation">
                    <p>Select a user to start chatting.</p>
                </div>
            )}
        </div>
    );
}

export default ChatWindow;
