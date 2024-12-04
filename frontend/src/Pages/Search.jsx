// src/Pages/Search.jsx

import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Search.css';
import { ToastContainer, toast } from 'react-toastify'; // Optional: For notifications
import 'react-toastify/dist/ReactToastify.css'; // Optional: For notifications
import Sidebar from '../components/Sidebar'; // Import Sidebar component

function Search() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Debugging: Log the backend URL
    console.log('Backend URL:', process.env.REACT_APP_BACKEND_URL);

    const handleSearch = async (e) => {
        e.preventDefault();

        if (!query.trim()) {
            setError('Please enter a search term.');
            setResults([]);
            return;
        }

        setIsLoading(true);
        try {
            const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/search/users`, {
                params: { q: query },
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setResults(res.data);
            setError(null);
            toast.success('Search successful!');
        } catch (err) {
            console.error('Error searching users:', err);
            setError(err.response?.data?.msg || 'Failed to search users.');
            setResults([]);
            toast.error(err.response?.data?.msg || 'Failed to search users.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="search-container">
                        <Sidebar />

            <h2>Search Users</h2>
            <form onSubmit={handleSearch} className="search-form">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        console.log('Typing:', e.target.value); // Debugging line
                        setQuery(e.target.value);
                    }}
                    placeholder="Search by username or email"
                    className="search-input"
                />
                <button type="submit" className="search-button">Search</button>
            </form>
            {/* Optional: Display current query for debugging */}
            {/* <p>Current Query: {query}</p> */}
            {isLoading && <p>Loading...</p>}
            {error && <p className="error-message">Error: {error}</p>}
            {results.length > 0 ? (
                <ul className="search-results">
                    {results.map(user => (
                        <li key={user.id}>
                            <Link to={`/user/${user.id}`}>
                                <p><strong>{user.username}</strong></p>
                                <p>{user.email}</p>
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : (
                !error && !isLoading && <p>No users found.</p>
            )}
            <ToastContainer /> {/* Optional: For notifications */}
        </div>
    );
}

export default Search;
