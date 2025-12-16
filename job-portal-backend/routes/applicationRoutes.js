// C:\learn\MERN Project\job-portal\job-portal-backend\routes\applicationRoutes.js

import express from "express";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import Application from "../models/Application.js";
import Job from "../models/Job.js";
import upload from '../middlewares/uploadMiddleware.js';
import path from 'path';
import fs from 'fs';

/**
 * Application Routes
 * ------------------
 * Handles:
 * - Job applications
 * - Resume uploads and access
 * - Application status management
 *
 * Role-based access:
 * - Applicant   → Apply & view own applications
 * - Recruiter   → View applicants & update status for their jobs
 * - Admin       → Full access
 */
const router = express.Router();

/**
 * IMPORTANT:
 * More specific routes are defined first to prevent
 * route conflicts with generic `/:id` routes.
 */

/**
 * @route   GET /api/applications/:id/applicants
 * @desc    Get all applicants for a given job
 * @access  Recruiter (own jobs only) / Admin
 */
router.get('/:id/applicants', protect, authorize('recruiter', 'admin'), async (req, res) => {
  try {
    const jobId = req.params.id;

    // Validate job existence
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    /**
     * Authorization check:
     * - Recruiters can only view applicants for jobs they posted
     * - Admins bypass this ownership check
     */
    if (
      req.user.role === 'recruiter' &&
      job.postedBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorize to view applicants' });
    }

    // Fetch all applications for the job with applicant & job details
    const applicants = await Application.find({ job: jobId })
      .populate('applicant', 'name email')
      .populate('job', 'title company');

    res.json(applicants);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/applications/:id/status
 * @desc    Update application status
 * @access  Recruiter (own jobs only) / Admin
 */
router.put('/:id/status', protect, authorize('recruiter', 'admin'), async (req, res) => {
  try {
    const { status } = req.body; // allowed values: applied | shortlisted | rejected

    // Find application and populate job for ownership validation
    const application = await Application.findById(req.params.id).populate('job');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    /**
     * Authorization check:
     * - Recruiter must own the job associated with the application
     */
    if (
      req.user.role === 'recruiter' &&
      application.job.postedBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to update this application' });
    }

    // Update and persist application status
    application.status = status;
    await application.save();

    res.json({ message: 'Application status updated', application });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/applications/:id/resume
 * @desc    View or download resume file
 * @access  Recruiter / Admin
 */
router.get('/:id/resume', protect, authorize('recruiter', 'admin'), async (req, res) => {
  try {
    const applicationId = req.params.id;

    // Find application by ID
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    /**
     * Resolve absolute resume path safely
     * - Prevents path traversal attacks
     * - Ensures file access is restricted to uploads directory
     */
    const resumeRel = application.resumeUrl || '';
    const resumePath = path.resolve(process.cwd(), resumeRel);

    // Ensure resume path is inside uploads directory
    if (!resumePath.startsWith(path.resolve(process.cwd(), 'uploads'))) {
      return res.status(400).json({ message: 'Invalid resume path' });
    }

    // Check if resume file exists
    if (!fs.existsSync(resumePath)) {
      return res.status(404).json({ message: 'Resume file not found' });
    }

    /**
     * Send file inline
     * - Browser decides whether to preview or download
     */
    res.setHeader('Content-Disposition', 'inline');
    res.sendFile(resumePath);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/applications/:id/apply
 * @desc    Apply to a job with resume upload
 * @access  Applicant only
 */
router.post(
  "/:id/apply",
  protect,
  authorize("applicant"),
  upload.single("resume"),
  async (req, res) => {
    try {
      const jobId = req.params.id;

      // Validate job existence
      const job = await Job.findById(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Prevent duplicate applications
      const existingApp = await Application.findOne({
        job: jobId,
        applicant: req.user._id,
      });
      if (existingApp) {
        return res.status(400).json({ message: "Already applied for this job" });
      }

      // Resume file must be provided
      if (!req.file) {
        return res.status(400).json({ message: "Resume file is required" });
      }

      // Save resume file path
      const resumePath = req.file.path;

      // Create new application record
      const application = new Application({
        job: jobId,
        applicant: req.user._id,
        resumeUrl: resumePath,
      });

      await application.save();

      res.status(200).json({ message: "Application submitted", application });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * @route   GET /api/applications/:userId
 * @desc    Fetch all applications submitted by a user
 * @access  Applicant (self only)
 */
router.get('/:userId', protect, authorize('applicant'), async (req, res) => {
  try {
    /**
     * Ensure user can only access their own applications
     */
    if (req.user._id.toString() !== req.params.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Fetch applications with job details
    const applications = await Application.find({
      applicant: req.params.userId
    }).populate('job', 'title company location');

    res.json(applications);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: 'server error' });
  }
});

export default router;