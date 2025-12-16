import express from "express";
import Job from '../models/Job.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

/**
 * Job Routes
 * ----------
 * Handles creation, retrieval, update, and deletion of job postings.
 *
 * Role-based access:
 * - Recruiter → Create, update, delete own jobs
 * - Admin     → Full access to all jobs
 * - Applicant → View jobs
 */
const router = express.Router();

/**
 * @route   POST /api/jobs
 * @desc    Create a new job posting
 * @access  Private (Recruiter/Admin)
 *
 * Notes:
 * - Job is always linked to the authenticated user via `postedBy`
 * - Basic required-field validation is performed
 */
router.post('/', protect, authorize("recruiter", "admin"), async (req, res) => {
  try {
    const { title, company, location, salaryRange, description, requirements } = req.body;

    // Validate mandatory fields before creating job
    if (!title || !company || !location || !salaryRange || !description) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Create job document and associate it with the logged-in user
    const job = await Job.create({
      title,
      company,
      location,
      salaryRange,
      description,
      requirements,
      postedBy: req.user._id, // recruiter/admin who created the job
    });

    res.status(201).json(job);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   GET /api/jobs
 * @desc    Retrieve all job listings
 * @access  Private (All authenticated users)
 *
 * Notes:
 * - Jobs are sorted by newest first
 * - Used for job listings/dashboard
 */
router.get('/', protect, async (req, res) => {
  try {
    // Fetch all jobs ordered by creation date (latest first)
    const jobs = await Job.find().sort({ createdAt: -1 });

    res.status(200).json(jobs);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/jobs/:id
 * @desc    Retrieve a single job by its ID
 * @access  Private (Applicant/Recruiter/Admin)
 */
router.get('/:id', protect, authorize('applicant', 'recruiter', 'admin'), async (req, res) => {
  try {
    // Find job using route parameter
    const job = await Job.findById(req.params.id);

    // Handle invalid or non-existent job
    if (!job) {
      return res.status(400).json({ message: "Job not found" });
    }

    res.status(200).json(job);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   PUT /api/jobs/:id
 * @desc    Update job details
 * @access  Private (Recruiter/Admin who created the job)
 *
 * Security:
 * - Only job owner or admin can update
 * - Only explicitly allowed fields can be modified
 */
router.put('/:id', protect, authorize('recruiter', 'admin'), async (req, res) => {
  try {
    // Find job to update
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    /**
     * Authorization check:
     * - Recruiter can only update their own jobs
     * - Admin can update any job
     */
    if (
      job.postedBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized to update this job" });
    }

    /**
     * Whitelist of fields allowed to be updated
     * Prevents accidental or malicious overwrites
     */
    const allowedFields = [
      "title",
      "company",
      "location",
      "salaryRange",
      "description",
      "requirements",
    ];

    // Apply updates only to allowed fields
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        job[field] = req.body[field];
      }
    });

    // Persist updates to database
    const updatedJob = await job.save();

    res.status(200).json(updatedJob);
  } catch (error) {
    console.error("Error updating job:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * @route   DELETE /api/jobs/:id
 * @desc    Delete a job posting
 * @access  Private (Recruiter/Admin who created the job)
 */
router.delete('/:id', protect, authorize('admin', 'recruiter'), async (req, res) => {
  try {
    // Find job by ID
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    /**
     * Authorization check:
     * - Recruiter can delete only their own jobs
     * - Admin can delete any job
     */
    if (
      job.postedBy.toString() !== req.user._id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized to delete this job' });
    }

    // Permanently remove job from database
    await job.deleteOne();

    res.status(200).json({ message: 'Job removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;