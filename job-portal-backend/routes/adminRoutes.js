import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import User from '../models/User.js';
import Job from '../models/Job.js';

const router = express.Router();

// @route   GET /api/admin/users
// @desc    Get all users (jobseekers + employers)
// @access  Admin only

router.get('/users', protect, authorize('admin'), async (requestAnimationFrame, res) => {
    try {
        const users = await User.find();
        res.json(users);
    }
    catch(error) {
        console.log(error.message);
        res.status(500).json({ message: 'server error' });
    }
});


// @route   PUT /api/admin/users/:id/toggle
// @desc    Block or Unblock a user
// @access  Admin only

