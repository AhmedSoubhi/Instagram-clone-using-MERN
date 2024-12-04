// src/components/ResetPassword.js
import React, { useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import './App.css';  // Import the CSS file

function ResetPassword() {
    const [password, setPassword] = useState('');
    const { token } = useParams();

    const onSubmit = async e => {
        e.preventDefault();

        try {
            const res = await axios.post('http://localhost:5000/api/auth/reset-password', { password, token });
            alert(res.data.msg);
        } catch (err) {
            alert(err.response.data.msg);
        }
    };

    return (
        <form onSubmit={onSubmit}>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="New Password" required />
            <button type="submit">Update Password</button>
        </form>
    );
}

export default ResetPassword;
