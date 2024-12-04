import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';
import Homeicon from './Home.png';
import profileicon from './Profile.png';
import searchicon from './Search.png';
import settingsicon from './settings.png';
import Chatico from './mes.png';

function Sidebar() {
    const navigate = useNavigate();

    const handleNavigation = (path) => {
        navigate(path);
    };

    return (
        <nav className="sidebar">
            <button 
                type="button" 
                onClick={() => handleNavigation('/profile')} 
                className="sidebar-button"
                aria-label="Profile"
            >
                <span className="button-text">Edit Profile</span>
                <img src={profileicon} alt="" className="sidebar-icon" />
            </button>
            <button 
                type="button" 
                onClick={() => handleNavigation('/')} 
                className="sidebar-button"
                aria-label="Home"
            >
                <span className="button-text">Main Page</span>
                <img src={Homeicon} alt="" className="sidebar-icon" />
            </button>
            <button 
                type="button" 
                onClick={() => handleNavigation('/chat')} 
                className="sidebar-button"
                aria-label="Chat"
            >
                <span className="button-text">Chat</span>
                <img src={Chatico} alt="" className="sidebar-icon" />
            </button>
            <button 
                type="button" 
                onClick={() => handleNavigation('/settings')} 
                className="sidebar-button"
                aria-label="Settings"
            >
                <span className="button-text">Settings</span>
                <img src={settingsicon} alt="" className="sidebar-icon" />
            </button>
            <button 
                type="button" 
                onClick={() => handleNavigation('/search')} 
                className="sidebar-button"
                aria-label="Search"
            >
                <span className="button-text">Search</span>
                <img src={searchicon} alt="" className="sidebar-icon" />
            </button>
        </nav>
    );
}

export default Sidebar;