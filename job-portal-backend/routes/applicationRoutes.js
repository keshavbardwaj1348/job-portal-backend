import express from "express";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import Application from "../models/Application.js";
import Job from "../models/Job.js";

const router = express.Router();

// @route   POST /api/jobs/:id/apply
// @desc    Apply for a job
// @access  Jobseeker only

router.post("/:id/apply", protect, authorize("applicant"), upload.single('resume'), async (req, res) => {
    try {
        const { resumeUrl } = req.body;
        const jobId = req.params.id;
        const job = await Job.findById(jobId);

        if(!job) {
            return res.status(404).json({message: 'Job not found'});
        }

        //prevent duplicate application
        const existingApp = await Application.findOne({
            job: jobId,
            applicant: req.user._id,
        });
        if(existingApp) {
            return res.status(400).json({message: 'Already applied for this job'});
        }

        //const resumePath = req.file ? req.file.path : null;

        const application = new Application({
            job: jobId,
            applicant: req.user._id,
            resumeUrl,
            //resumeUrl: resumePath.path,
        });

        await application.save();
        res.status(200).json({message: 'Application submitted', application});
    }
    catch(error) {
        console.log(error.message);
        res.status(500).json({message: 'Server error'});
    }
});


// @route   GET /api/applications/:userId
// @desc    Get all applications by a user
// @access  Jobseeker only (self)

router.get('/:userId', protect, authorize('applicant'), async (req, res) => {
    try {
        if(req.user._id.toString() != req.params.userId) {
            return res.status(403).json({message: 'Not authorized'});
        }

        const applications = await Application.find({ applicant: req.params.userId}
        ).populate('job', 'title company location');

        res.json(applications);
    }
    catch(error) {
        console.log(error.message);
        return res.status(500).json({message: 'server error'});
    }
});



// @route   GET /api/jobs/:id/applicants
// @desc    Get all applicants for a job (Recruiter only)
// @access  Recruiter/Admin

router.get('/:id/applicants', protect, authorize('recruiter', 'admin'), async (req, res) => {
    try {
        const jobId = req.params.id;
        const job = await Job.findById(jobId);

        if(!job) {
            return res.status(404).json({message: 'Job not found'});
        }

        //Ensures recruiter owns the job (unless admin)
        if(req.user.role === 'recruiter' && job.postedBy.toString() != req.user._id.toString()) {
            return res.status(403).json({message: 'Not authorize to view applicants'});
        }

        const applicants  = await Application.find({job: jobId})
            .populate('applicant', 'name email')
            .populate('job', 'title company');

            res.json(applicants);
    }
    catch(error) {
        return res.status(500).json({message: 'Server error'});
    }
});


export default router;