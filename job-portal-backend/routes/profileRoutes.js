import express from 'experess'
import { protect } from '../middlewares/authMiddleware.js';
import User from '../models/User.js';

const router = express.Router();

// @route   GET /api/profile/me
// @desc    Get logged-in user's profile
// @access  Private

router.get('/me', protect, async (req, res) => {
    try{
        const user = await User.findById(req.user._id);
        res.json(user);
    }
    catch(error) {
        res.status(500).json({ message: 'Server error'});
    }
});


// @route   PUT /api/profile/me
// @desc    Update logged-in user's profile
// @access  Private

router.put('/me', protect, async (req, res) => {
    try {
        const updates = req.body;
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: {profile: updates }},
            { new: true }
        );
        res.json({ message: 'Profile updated'});
    }
    catch(error) {
        res.status(500).json({ message: 'Server error'});
    }
});


export default router;
