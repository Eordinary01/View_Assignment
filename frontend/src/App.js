import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Signup from './components/Signup';
import Login from './components/Login';
import Home from './components/Home';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token');
  return isAuthenticated ? children : <Navigate to="/auth" />;
};

const AuthPrompt = () => {
  const [isNewUser, setIsNewUser] = useState(null);

  if (isNewUser === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl mb-4 text-center">Welcome!</h2>
          <p className="mb-4">Are you a new user?</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setIsNewUser(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300"
            >
              Yes
            </button>
            <button
              onClick={() => setIsNewUser(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition duration-300"
            >
              No
            </button>
          </div>
        </div>
      </div>
    );
  }

  return isNewUser ? <Signup /> : <Login />;
};

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/auth" element={<AuthPrompt />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/auth" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;