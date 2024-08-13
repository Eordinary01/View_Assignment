const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

const verifyToken = async (req, res, next) => {
  console.log('Verifying token...');
  
  const authHeader = req.header('Authorization');
  console.log('Received Authorization header:', authHeader);

  if (!authHeader) {
    console.log('No Authorization header provided');
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1]; // Extract token from "Bearer <token>"
  console.log('Extracted token:', token);

  if (!token) {
    console.log('No token found in Authorization header');
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    console.log('JWT_SECRET:', process.env.JWT_SECRET.substring(0, 3) + '...'); // Log first 3 characters for safety
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);

    const user = await User.findById(decoded.userId).select('-password');
    console.log('Found user:', user ? user._id : 'No user found');
    
    if (!user) {
      console.log('User not found in database');
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = {
      id: user._id,
      email: user.email,
      college: user.college,
      role: user.role
    };
    console.log('User attached to request:', req.user);
    
    next();
  } catch (err) {
    console.error("Token verification error:", err);
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token: ' + err.message });
    } else if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' });
    } else {
      return res.status(400).json({ error: 'Token verification failed' });
    }
  }
};

module.exports = { verifyToken };