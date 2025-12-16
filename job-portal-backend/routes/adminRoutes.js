import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import User from '../models/User.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';

/**
 * Admin Routes
 * ------------
 * All routes in this file are restricted to ADMIN users only.
 * Middleware flow:
 * 1. protect   → Verifies JWT and attaches authenticated user to request
 * 2. authorize → Ensures user has "admin" role
 */
const router = express.Router();

/**
 * @route   GET /api/admin/users
 * @desc    Fetch all registered users (job seekers + employers)
 * @access  Admin only
 *
 * Use cases:
 * - Admin dashboard user management
 * - Auditing and monitoring platform users
 */
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    // Fetch all users from database
    const users = await User.find();

    // Return list of users
    res.json(users);
  } catch (error) {
    // Log error for debugging and monitoring
    console.log(error.message);
    res.status(500).json({ message: 'server error' });
  }
});

/**
 * @route   PUT /api/admin/users/:id/toggle
 * @desc    Block or unblock a user account
 * @access  Admin only
 *
 * Behavior:
 * - Toggles `isBlocked` flag
 * - Prevents blocked users from accessing protected resources
 */
router.put('/users/:id/toggle', protect, authorize('admin'), async (req, res) => {
  try {
    // Find user by ID from route parameter
    const user = await User.findById(req.params.id);

    // Handle non-existent user
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Toggle blocked status
    user.isBlocked = !user.isBlocked;
    await user.save();

    // Return updated status
    res.json({
      message: `User ${user.isBlocked ? "blocked" : "unblocked"} successfully`,
      user
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/admin/jobs
 * @desc    Fetch all job listings
 * @access  Admin only
 *
 * Includes:
 * - Job details
 * - Employer info (name, email) via population
 */
router.get("/jobs", protect, authorize("admin"), async (req, res) => {
  try {
    // Fetch all jobs and populate employer details
    const jobs = await Job.find().populate("postedBy", "name email");

    res.json(jobs);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   PUT /api/admin/jobs/:id/approve
 * @desc    Approve or reject a job posting
 * @access  Admin only
 *
 * Expected body:
 * {
 *   status: "approved" | "rejected"
 * }
 */
router.put("/jobs/:id/approve", protect, authorize("admin"), async (req, res) => {
  try {
    // Extract job status from request body
    const { status } = req.body;

    // Find job by ID
    const job = await Job.findById(req.params.id);

    // Handle non-existent job
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Update job approval status
    job.status = status;
    await job.save();

    res.json({ message: `Job ${status} successfully`, job });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   GET /api/admin/stats
 * @desc    Fetch overall platform statistics for admin dashboard
 * @access  Admin only
 *
 * Metrics returned:
 * - Total users
 * - Total jobs
 * - Total job applications
 * - Pending/open jobs
 * - Blocked users
 */
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    // Count total users in the system
    const totalUsers = await User.countDocuments();

    // Count total jobs
    const jobs = await Job.countDocuments();

    // Count total job applications
    const totalApplications = await Application.countDocuments();

    // Count open/pending jobs
    const pendingJobs = await Job.countDocuments({ status: 'open' });

    // Count blocked users
    const blockedUsers = await User.countDocuments({ isBlocked: true });

    // Return aggregated dashboard statistics
    res.json({
      totalUsers,
      jobs,
      totalApplications,
      pendingJobs,
      blockedUsers
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;