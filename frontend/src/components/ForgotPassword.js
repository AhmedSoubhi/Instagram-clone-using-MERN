// src/components/ForgotPassword.js
import React, { useState } from 'react';
import axios from 'axios';
import './App.css';  // Import the CSS file

function ForgotPassword() {
    const [email, setEmail] = useState('');

    const onSubmit = async e => {
        e.preventDefault();

        try {
            const res = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
            alert(res.data.msg);
        } catch (err) {
            alert(err.response.data.msg);
        }
    };

    return (
        <form onSubmit={onSubmit}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required />
            <button type="submit">Reset Password</button>
        </form>
    );
}

export default ForgotPassword;
