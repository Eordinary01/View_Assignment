const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { verifyToken } = require('../middlewares/auth');

require("dotenv").config();

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, college } = req.body;
    const isAdmin = email.toUpperCase() === process.env.ADMIN_EMAIL.toUpperCase() && password === process.env.ADMIN_PASSWORD;
    const newUser = new User({
      name: name.toUpperCase(),
      email: email.toUpperCase(),
      password,
      college: college.toUpperCase(),
      role: isAdmin ? "admin" : "student",
    });
    await newUser.save();

    // Create a token after successful signup
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    
    console.log("Signup Token:", token);

    res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        college: newUser.college,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(400).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toUpperCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ error: "Invalid email or password" });
    }
    // Change 'id' to 'userId' to be consistent with the middleware
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    console.log("Login Token:", token);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        college: user.college,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(400).json({ error: err.message });
  }
});

router.get("/check-token", (req, res) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  console.log("Check Token:", token);

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Check Token:", decoded);
    
    res.json({ valid: true, userId: decoded.userId });
  } catch (err) {
    console.error("Invalid or Expired Token Error:", err);
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

router.get("/user-info/:userId", verifyToken, async (req, res) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  console.log("User Info Token:", token);

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const userId = req.params.userId;
    console.log("User ID from URL:", userId);
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      console.error("User not found in database");
      return res.status(404).json({ error: "User not found" });
    }
    console.log("User Found:", user);

    res.json({
      id: user._id,
      name: user.name.toUpperCase(),
      email: user.email.toUpperCase(),
      college: user.college.toUpperCase(),
      role: user.role.toUpperCase()
    });
  } catch (err) {
    console.error("Error fetching user information:", err);
    res.status(500).json({ error: "Error fetching user information" });
  }
});

router.get("/auth/user-info", verifyToken, async (req, res) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  console.log("Auth User Info Token:", token);

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Auth Token:", decoded);
    const userId = decoded.userId;
    console.log("Searching for user with ID:", userId);

    const user = await User.findById(userId).select('-password');
    if (!user) {
      console.error("User not found in database for ID:", userId);
      return res.status(404).json({ error: "User not found" });
    }
    console.log("User found:", user);

    res.json({
      id: user._id,
      name: user.name.toUpperCase(),
      email: user.email.toUpperCase(),
      college: user.college.toUpperCase(),
      role: user.role.toUpperCase()
    });
  } catch (err) {
    console.error("Error fetching user information:", err);
    res.status(500).json({ error: "Error fetching user information" });
  }
});

module.exports = router;
