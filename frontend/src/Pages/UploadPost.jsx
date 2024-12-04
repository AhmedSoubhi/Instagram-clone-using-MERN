// frontend/src/components/UploadPost.jsx

import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function UploadPost() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [caption, setCaption] = useState('');
    const [media, setMedia] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title || !description || !media) {
            toast.error('Title, Description, and Media are required.');
            return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('caption', caption);
        formData.append('media', media);

        try {
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/posts/upload`, formData, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success(response.data.msg);
            // Reset form fields or perform any other actions as needed
            setTitle('');
            setDescription('');
            setCaption('');
            setMedia(null);
        } catch (err) {
            console.error('Error uploading post:', err);
            toast.error(err.response?.data?.msg || 'Failed to upload post.');
        }
    };

    const handleFileChange = (e) => {
        setMedia(e.target.files[0]);
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
            />
            <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
            ></textarea>
            <textarea
                placeholder="Caption (optional)"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
            ></textarea>
            <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                required
            />
            <button type="submit">Upload Post</button>
        </form>
    );
}

export default UploadPost;
