// frontend/src/components/Register.jsx

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './Register.css';

function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [profilePicture, setProfilePicture] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Create a FormData object to handle file upload
        const formData = new FormData();
        formData.append('username', username);
        formData.append('email', email);
        formData.append('password', password);
        if (profilePicture) {
            formData.append('profilePicture', profilePicture);
        }

        try {
            const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/auth/register`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            localStorage.setItem('token', res.data.accessToken);
            localStorage.setItem('refreshToken', res.data.refreshToken);
            navigate('/profile');
        } catch (err) {
            setError(err.response?.data?.msg || 'An error occurred. Please try again.');
            console.error('Registration error:', err);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setProfilePicture(e.target.files[0]);
        }
    };

    return (
        <div className="register-container">
            <h2>Create an Account</h2>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={onSubmit} className="register-form" encType="multipart/form-data">
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="register-input"
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="register-input"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="register-input"
                />
                {/* Profile Picture Upload */}
                <div className="profile-picture-upload">
                    <label htmlFor="profilePicture" className="upload-label">
                        Upload Profile Picture (Optional):
                    </label>
                    <input
                        type="file"
                        id="profilePicture"
                        name="profilePicture"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="upload-input"
                    />
                </div>
                <button type="submit" className="register-button">Register</button>
            </form>
            <div className="register-links">
                <span>Already have an account?</span>
                <Link to="/login" className="link">Login</Link>
            </div>
        </div>
    );
}

export default Register;
