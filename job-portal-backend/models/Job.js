import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        company: {
            type: String,
            required: true,
            trim: true
        },
        location: {
            type: String,
            required: true,
        },
        salaryRange: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true,
        },
        requirements: {
            type: [String],  //Array of skills/requirements
            default: [],
        },
        postedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',  //Link to the recruiter who posted it
            required: true,
        },
        datePosted: {
            type: Date,
            default: Date.now,
        },
        status: {
            type: String,
            enum: ["open", "closed"],
            default: "open",
        },
    },
    { timestamps: true }
);

const Job = mongoose.model('Job', jobSchema);

export default Job;