import React from 'react';
import { Route, Routes } from 'react-router-dom';

// Import existing components
import Register from './components/Register';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Home from './components/home';
import ProtectedRoute from './components/ProtectedRoute';
import Profile from './Pages/Profile';
import UploadPost from './Pages/UploadPost';

// Import new components for Search and User Profiles
import Search from './Pages/Search';
import UserProfile from './Pages/UserProfile';
import FollowersList from './Pages/FollowersList';
import FollowingList from './Pages/FollowingList';

// Import the Chat component
import Chat from './Pages/Chat';
import Settings from './Pages/Settings'; // Import the Settings component

function App() {
  return (
    <Routes>
      {/* Protected Home Route */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />

      {/* Public Routes */}
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset/:token" element={<ResetPassword />} />

      {/* Protected Profile Route */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Protected Upload Post Route */}
      <Route
        path="/upload-post"
        element={
          <ProtectedRoute>
            <UploadPost />
          </ProtectedRoute>
        }
      />

      {/* Protected Search Route */}
      <Route
        path="/search"
        element={
          <ProtectedRoute>
            <Search />
          </ProtectedRoute>
        }
      />

      {/* Protected User Profile Route */}
      <Route
        path="/user/:id"
        element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        }
      />

      {/* Protected Followers List Route */}
      <Route
        path="/user/:id/followers"
        element={
          <ProtectedRoute>
            <FollowersList />
          </ProtectedRoute>
        }
      />

      {/* Protected Following List Route */}
      <Route
        path="/user/:id/following"
        element={
          <ProtectedRoute>
            <FollowingList />
          </ProtectedRoute>
        }
      />

      {/* Protected Chat Route */}
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />

      {/* Protected Settings Route */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      {/* Fallback Route */}
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
