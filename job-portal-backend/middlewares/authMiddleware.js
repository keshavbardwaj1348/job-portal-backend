import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Middleware: protect
 * ------------------
 * Purpose:
 * - Protects private routes by validating JWT access tokens
 * - Attaches authenticated user details to `req.user`
 *
 * Flow:
 * 1. Extract token from Authorization header (Bearer token)
 * 2. Verify token using JWT_SECRET
 * 3. Fetch user from database using decoded token data
 * 4. Perform security checks (user existence, blocked status)
 * 5. Allow request to proceed if all checks pass
 */
export const protect = async (req, res, next) => {
  // Will hold JWT token extracted from request headers
  let token = null;

  try {
    /**
     * Check if Authorization header exists
     * Expected format:
     * Authorization: Bearer <JWT_TOKEN>
     */
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {

      // Extract the token from "Bearer <token>"
      token = req.headers.authorization.split(" ")[1];

      // Verify and decode JWT token using secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      /**
       * Fetch authenticated user from DB
       * - decoded.id comes from token payload
       * - Exclude password field for security
       */
      req.user = await User.findById(decoded.id).select("-password");

      // If user no longer exists in DB
      if (!req.user) {
        return res.status(401).json({ message: "Not authorized" });
      }

      // If user account is blocked by admin/system
      if (req.user.isBlocked) {
        return res.status(403).json({ message: "Account blocked" });
      }

      // User authenticated successfully → proceed to next middleware/controller
      return next();
    }

    // Authorization header missing or token not provided
    return res.status(401).json({ message: "Not authorized, no token" });

  } catch (error) {
    /**
     * Handles:
     * - Invalid token
     * - Expired token
     * - JWT verification failure
     * - Any unexpected auth-related error
     */
    console.error("Auth protect error:", error.message);
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

/**
 * Middleware: authorize
 * ---------------------
 * Purpose:
 * - Restricts access based on user roles
 *
 * Usage Example:
 * authorize("admin")
 * authorize("admin", "manager")
 *
 * Requirement:
 * - Must be used AFTER `protect` middleware
 * - Assumes `req.user` is already populated
 */
export const authorize = (...roles) => {
  return (req, res, next) => {

    // Check if user's role is allowed to access this route
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Role authorized → proceed
    next();
  };
};