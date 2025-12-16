// C:\learn\MERN Project\job-portal\job-portal-backend\routes\profileRoutes.js

import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import User from '../models/User.js';
import upload from '../middlewares/uploadMiddleware.js';      // Middleware for resume upload
import uploadLogo from '../middlewares/uploadLogoMiddleware.js'; // Middleware for company logo upload

/**
 * Profile Routes
 * --------------
 * Handles:
 * - Fetching logged-in user profile
 * - Updating profile information (applicant & recruiter)
 * - Uploading resume files
 * - Uploading recruiter company logos
 *
 * Access:
 * - All routes are protected (JWT required)
 */
const router = express.Router();

/**
 * @route   GET /api/profile/me
 * @desc    Get logged-in user's complete profile
 * @access  Private
 */
router.get('/me', protect, async (req, res) => {
  try {
    // Fetch user using ID injected by protect middleware
    const user = await User.findById(req.user._id);

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/profile/me
 * @desc    Update profile data (stored under user.profile)
 * @access  Private
 *
 * Notes:
 * - Keeps original implementation for backward compatibility
 * - Overwrites profile object with provided data
 */
router.put('/me', protect, async (req, res) => {
  try {
    const updates = req.body; // resumeUrl, skills, companyName, etc.

    // Update only the profile object using $set
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { profile: updates } },
      { new: true } // return updated document
    );

    res.json({ message: 'Profile updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/profile/update
 * @desc    Unified profile update for applicants and recruiters
 * @access  Private
 *
 * Handles:
 * - Applicant info (skills, experience, bio)
 * - Recruiter/company info (companyName, website, description)
 * - Name update at top-level User document
 */
router.put('/update', protect, async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findById(req.user._id);

    // Ensure user exists
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update name directly on User document
    if (updates.name !== undefined) {
      user.name = updates.name;
    }

    // Ensure profile object exists
    user.profile = user.profile || {};

    /**
     * Skills handling:
     * - Accepts comma-separated string or array
     * - Normalizes to array of trimmed strings
     */
    if (updates.skills !== undefined) {
      if (typeof updates.skills === 'string') {
        user.profile.skills = updates.skills
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
      } else if (Array.isArray(updates.skills)) {
        user.profile.skills = updates.skills;
      }
    }

    // Experience and bio fields
    if (updates.experience !== undefined) user.profile.experience = updates.experience;
    if (updates.bio !== undefined) user.profile.bio = updates.bio;

    // --------------------
    // Recruiter / company fields
    // --------------------

    if (updates.companyName !== undefined) user.profile.companyName = updates.companyName;
    if (updates.website !== undefined) user.profile.website = updates.website;
    if (updates.description !== undefined) user.profile.description = updates.description;

    /**
     * Note:
     * - companyLogo is intentionally excluded here
     * - It must be uploaded via /upload-logo route
     */

    // Persist profile changes
    await user.save();

    res.json({ message: 'Profile updated', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/profile/upload
 * @desc    Upload resume file for logged-in user
 * @access  Private
 *
 * Notes:
 * - Uses multer middleware
 * - Stores resume path in user.profile.resumeUrl
 */
router.post('/upload', protect, upload.single('resume'), async (req, res) => {
  try {
    // Ensure file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Ensure profile object exists
    user.profile = user.profile || {};

    // Save resume file path
    user.profile.resumeUrl = req.file.path;
    await user.save();

    res.json({ message: 'Resume uploaded', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/profile/upload-logo
 * @desc    Upload company logo for recruiter profile
 * @access  Private
 *
 * Notes:
 * - Uses dedicated logo upload middleware
 * - Stores logo path in user.profile.companyLogo
 */
router.post('/upload-logo', protect, uploadLogo.single('logo'), async (req, res) => {
  try {
    // Ensure logo file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No logo file uploaded' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Ensure profile object exists
    user.profile = user.profile || {};

    // Save company logo path
    user.profile.companyLogo = req.file.path;
    await user.save();

    res.json({ message: 'Company logo uploaded', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;