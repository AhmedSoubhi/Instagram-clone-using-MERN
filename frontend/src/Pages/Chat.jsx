// frontend/src/pages/Chat.jsx

import React, { useState } from 'react';
import UsersSidebar from '../components/Chat/UsersSidebar';
import ChatWindow from '../components/Chat/ChatWindow';
import './Chat.css';
import Sidebar from '../components/Sidebar';
import useWindowWidth from '../hooks/useWindowWidth';

function Chat() {
    const [selectedUser, setSelectedUser] = useState(null);
    const windowWidth = useWindowWidth();
    const isMobile = windowWidth <= 768;

    // State to manage mobile view navigation
    const [isChatOpen, setIsChatOpen] = useState(false);

    const handleSelectUser = (user) => {
        setSelectedUser(user);
        if (isMobile) {
            setIsChatOpen(true);
        }
    };

    const handleBackToUsers = () => {
        setIsChatOpen(false);
        setSelectedUser(null);
    };

    // Determine if Sidebar should be visible
    const showSidebar = !(isMobile && isChatOpen);

    return (
        <div className={`chat-page ${isMobile && showSidebar ? 'with-sidebar' : ''}`}>
            {/* Conditionally render Sidebar */}
            {showSidebar && <Sidebar />}
            
            {/* Users Sidebar */}
            {(!isMobile || (isMobile && !isChatOpen)) && (
                <UsersSidebar selectUser={handleSelectUser} />
            )}

            {/* Chat Window */}
            {(!isMobile || (isMobile && isChatOpen)) && (
                <ChatWindow 
                    selectedUser={selectedUser} 
                    isMobile={isMobile} 
                    onBack={handleBackToUsers} 
                />
            )}
        </div>
    );
}

export default Chat;
