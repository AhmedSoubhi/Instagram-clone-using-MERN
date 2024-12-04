// frontend/src/components/Settings/Settings.jsx

import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { logout } from '../utils/auth'; // Import the logout utility
import './Settings.css'; // Ensure you have the corresponding CSS

function Settings() {
  const { user, setUser } = useContext(AuthContext);
  const [profilePicture, setProfilePicture] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('upload'); // Manage active section

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePicture(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!profilePicture) {
      setError('Please select a profile picture to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('profilePicture', profilePicture);

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/auth/update-profile-picture`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      // Update the user context with the new profile picture
      setUser({ ...user, profilePicture: res.data.profilePicture });
      navigate('/profile');
    } catch (err) {
      console.error('Error updating profile picture:', err);
      setError(err.response?.data?.msg || 'An error occurred. Please try again.');
    }
  };

  const handleLogout = () => {
    logout(); // Clear tokens and user data
    navigate('/login'); // Redirect to login page
  };

  return (
    <div className="settings-container">
      {/* Side Dashboard */}
      <aside className="settings-dashboard">
        <button
          className={`dashboard-button ${activeSection === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveSection('upload')}
        >
          Upload Profile Picture
        </button>
        <button className="dashboard-button profile-logout-button" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="settings-content">
        {activeSection === 'upload' && (
          <div className="upload-section">
            <h2>Settings</h2>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleSubmit} className="settings-form" encType="multipart/form-data">
              <div className="profile-picture-section">
                <label htmlFor="profilePicture">Upload Profile Picture:</label>
                <input
                  type="file"
                  id="profilePicture"
                  name="profilePicture"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
              <button type="submit" className="update-button">
                Update Profile Picture
              </button>
            </form>
          </div>
        )}
        {/* Future sections can be added here */}
      </main>
    </div>
  );
}

export default Settings;
