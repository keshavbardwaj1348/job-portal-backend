import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		trim: true,
  	},
  	email: {
		type: String,
		required: true,
		unique: true,
		lowercase: true,
		trim: true,
		match: [/\S+@\S+\.\S+/, "is invalid"],
  	},
 	password: {
		type: String,
		required: true,
		minlength: 6,
		select: false,
  	},
	role: {
		type: String,
		enum: ["applicant", "recruiter", "admin"],
		default: "applicant",
	},
	isBlocked: {
		type: Boolean,
		default: false,
	},
	profile: {
		//Applicant Profile
		resumeUrl: { type: String },
		skills: [String],
		experience: { type: String },
		bio: { type: String },

		//Recruiter profile
		companyName: { type: String },
		companyLogo: { type:String },
		website: { type: String },
		description: { type: String }
	}
}, {timestamps: true});


//Create model from schema 
const User = mongoose.model("User", userSchema);

export default User;
