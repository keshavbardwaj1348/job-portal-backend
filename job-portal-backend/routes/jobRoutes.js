import express from "express";
import Job from '../models/Job.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @desc    Create a new job (Recruiter only)
 * @route   POST /api/jobs
 * @access  Private (Recruiter)
 */

router.post('/', protect, authorize("recruiter", "admin"), async (req, res) => {
    try{
        const { title, company, location, salaryRange, description, requirements } = req.body;

        if(!title || !company || !location || !salaryRange || !description) {
            return res.status(400).json({message: 'All fields are required'});
        }

        const job = await Job.create({
            title,
            company,
            location,
            salaryRange,
            description,
            requirements,
            postedBy: req.user._id
        });
        res.status(201).json(job);
    }
    catch(error){
        console.log(error);
        res.status(500).json({message: "Server error"});
    }
});



/**
 * @desc    Get all jobs (Accessible to everyone logged in)
 * @route   GET /api/jobs
 * @access  Private (All roles)
 */

router.get('/', protect, async(req, res) => {
    try {
        const jobs = await Job.find().sort({createAt: -1});
        res.status(200).json(jobs);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({message: 'Server error'});
    }
});



/**
 * @desc    Get job by ID
 * @route   GET /api/jobs/:id
 * @access  Private (Applicant/Recruiter/Admin)
 */

router.get('/:id', protect, authorize('applicant', 'recruter', 'admin'), async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if(!job) {
            return res.status(400).json({ message: "Job not found" });
        }
        else {
            return res.status(200).json(job);
        }
    }
    catch(error) {
        console.log(error);
        res.status(500).json({ message: "Server error"});
    }
});



/**
 * @desc    Update a job
 * @route   PUT /api/jobs/:id
 * @access  Private (Recruiter/Admin who created job)
 */

router.put('/:id', protect, authorize('recruiter', 'admin'), async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if(!job){
            return res.status(404).json({ messgae: "Job not found"});
        }
        //only allow owner or admin
        if(job.postedBy.toString() != req.user._id.toString() && req.user.role != 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this job' });
        }

        Object.assign(job, req.body);
        const updatedJob = await job.save();
        res.status(200).json(updatedJob);
    }
    catch(error) {
        console.error(error);
        res.status(500).json({message: 'Server error'});
    }
});



/**
 * @desc    Delete a job
 * @route   DELETE /api/jobs/:id
 * @access  Private (Recruiter/Admin who created job)
 */

router.delete('/:id', protect, authorize('admin', 'recruiter'), async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if(!job) {
            return res.status(404).json({ message: 'Job not found'});
        }
        if(job.postedBy.toString() != req.user._id && req.user.role != 'admin'){
            return res.status(403).json({ message: 'Not authorized to delete this job'});
        }

        await job.deleteOne();
        res.status(200).json({ message: 'Job removed'});
    }
    catch(error) {
        console.error(error);
        res.status(500).json({ message: 'Server error'});
    }
})



export default router;