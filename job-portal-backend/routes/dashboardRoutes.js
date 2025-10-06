import express from "express";
import { protect, authorize } from "../middlewares/authMiddleware.js";


const router = express.Router();

//Applicant Dashboard
router.get('/applicant', protect, authorize("applicant"), (req, res) => {
    res.json({
        message: 'Applicant Dashboard',
        user: req.user
    })
});


//Recruiter Dashboard
router.get('/recruiter', protect, authorize("recruiter"), (req, res) => {
    res.json({
        message: 'Recruiter Dashboard',
        user: req.user
    })
});


//Admin Dashboard
router.get('/admin', protect, authorize("admin"), (req, res) => {
    res.json({
        message: 'Admin Dashboard',
        user: req.user
    })
});


export default router;