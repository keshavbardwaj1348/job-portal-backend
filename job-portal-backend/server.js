// C:\learn\MERN Project\job-portal\job-portal-backend\server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import jobRoutes from './routes/jobRoutes.js'
import applicationRoutes from './routes/applicationRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const app = express();

//Middlewares
app.use(cors());
app.use(express.json());

//routes
app.use("/api/auth", authRoutes);
// removed: app.use("/api/dashboard", dashboardRoutes);
app.use("/api/jobs", jobRoutes);

app.use('/api/applications', applicationRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use("/uploads", express.static("uploads"));


app.get('/', (req, res) => {
    res.send('Job portal API is running...');
})

// connect to mongodb
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true}).then(() => {
    console.log('Mongodb connected');
    app.listen(process.env.PORT || 5000, () => {
        console.log(`Server running on port ${process.env.PORT || 5000}`);
    })
}).catch((err) => {
    console.error("Mongodb connection error:", err);
})
