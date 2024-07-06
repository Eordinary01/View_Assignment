import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiHome, FiArrowRight } from 'react-icons/fi';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    college: ''
  });
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const API_URL = process.env.REACT_APP_API_URL;
  
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/signup`, formData);
      setMessage(response.data.message || 'Signup successful! Redirecting to login...');
      setIsError(false);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.error('Signup error:', err);
      setMessage(err.response?.data?.error || 'An error occurred during signup.');
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
        setIsError(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const inputFields = [
    { name: 'name', type: 'text', icon: FiUser },
    { name: 'email', type: 'email', icon: FiMail },
    { name: 'password', type: 'password', icon: FiLock },
    { name: 'college', type: 'text', icon: FiHome }
  ];

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-purple-600 to-indigo-800">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-8 rounded-lg shadow-2xl w-96 max-w-[90%]"
      >
        <h2 className="text-3xl mb-6 text-center font-bold text-indigo-800">Join Us</h2>
        <form onSubmit={handleSubmit}>
          {inputFields.map(({ name, type, icon: Icon }) => (
            <div key={name} className="mb-4 relative">
              <Icon className="absolute top-3 left-3 text-gray-400" />
              <input
                type={type}
                name={name}
                placeholder={name.charAt(0).toUpperCase() + name.slice(1)}
                value={formData[name]}
                onChange={handleInputChange}
                className="w-full p-2 pl-10 border-b-2 border-gray-300 focus:border-indigo-500 transition-colors duration-300 outline-none"
              />
            </div>
          ))}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="w-full bg-indigo-600 text-white p-3 rounded-md font-semibold mt-6 hover:bg-indigo-700 transition duration-300 ease-in-out flex items-center justify-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <>
                Sign Up <FiArrowRight className="ml-2" />
              </>
            )}
          </motion.button>
        </form>
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`mt-4 p-3 rounded-md ${
                isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              }`}
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Signup;
