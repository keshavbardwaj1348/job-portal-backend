import jwt from "jsonwebtoken";
import User from "../models/User.js";

//verify user is logged in
export const protect = async (req, res, next) => {
    let token;

    if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];

            //verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            //Attach user to req without (without password)
            req.user = await User.findById(decoded.id).select("-password");

            next();
        }
        catch(error) {
            return res.status(401).json({message: "Not authorized, token failed"})
        }
    }
    if(!token){
        return res.status(401).json({message: "Not authorized, No token"});
    }
};


//Restrict by role
export const authorize = (...roles) => {
    return (req, res, next) => {
        if(!roles.includes(req.user.role)) {
            return res.status(403).json({message: "Access denied"});
        }
        next();
    }
};