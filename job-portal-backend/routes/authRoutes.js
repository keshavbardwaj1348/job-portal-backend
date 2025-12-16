import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

import { protect, authorize } from "../middlewares/authMiddleware.js";

/**
 * Authentication Routes
 * ---------------------
 * Handles:
 * - User registration (signup)
 * - User login (JWT-based authentication)
 * - Access to authenticated user profile
 *
 * Security:
 * - Passwords are hashed using bcrypt
 * - JWT tokens are used for stateless authentication
 */
const router = express.Router();


/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public
 *
 * Flow:
 * 1. Validate required fields
 * 2. Check for existing user
 * 3. Hash password securely
 * 4. Create user in database
 * 5. Generate JWT token and return user details
 */
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate required input fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // Check if a user with the same email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    /**
     * Hash the user's password before saving
     * - Salt increases resistance to rainbow table attacks
     * - Passwords are never stored in plain text
     */
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user document
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
    });

    // Persist user to database
    await newUser.save();

    /**
     * Generate JWT token
     * - Token contains user ID and role
     * - Used for authenticating protected routes
     */
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Return token and safe user details (excluding password)
    res.status(200).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    // Log error for debugging and monitoring
    console.log(error.message);
    res.status(500).json({ message: "Server error" });
  }
});


/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT token
 * @access  Public
 *
 * Flow:
 * 1. Validate credentials
 * 2. Verify user existence
 * 3. Compare hashed passwords
 * 4. Generate and return JWT token
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic request validation
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    /**
     * Find user by email
     * - Explicitly include password for comparison
     */
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare provided password with stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    /**
     * Generate JWT token on successful authentication
     */
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Return token and safe user details
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Server error" });
  }
});


/**
 * @route   GET /api/auth/profile
 * @desc    Get logged-in user's profile
 * @access  Protected
 *
 * Requires:
 * - Valid JWT token
 */
router.get("/profile", protect, (req, res) => {
  // `req.user` is populated by protect middleware
  res.json({ message: "Welcome!", user: req.user });
});

export default router;