// C:\learn\MERN Project\job-portal\job-portal-backend\middlewares\uploadLogoMiddleware.js

import multer from "multer";
import path from "path";
import fs from "fs";

/**
 * Upload directory path for company logos
 * This is where all uploaded logo files will be stored on disk
 */
const uploadPath = "uploads/company-logos";

/**
 * Ensure the upload directory exists
 * - Prevents runtime errors when multer tries to save files
 * - `recursive: true` ensures parent folders are created if missing
 * - Safe to run on every server start
 */
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

/**
 * Multer storage configuration (disk storage)
 * Controls:
 * - Destination folder for uploaded files
 * - Naming convention for stored files
 */
const storage = multer.diskStorage({

  /**
   * Define where the uploaded file should be stored
   * `cb(null, uploadPath)` tells multer to save files in the defined directory
   */
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },

  /**
   * Define how uploaded files should be named
   * - Uses original file extension
   * - Appends timestamp to avoid filename collisions
   * - Example: logo-1700000000000.png
   */
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + Date.now() + ext);
  },
});

/**
 * File filter to validate uploaded file types
 * - Allows only common image formats
 * - Prevents non-image files from being uploaded (security & consistency)
 */
function fileFilter(req, file, cb) {

  // Allowed image extensions
  const allowed = /jpeg|jpg|png|gif/;

  // Extract and normalize file extension
  const ext = path.extname(file.originalname).toLowerCase();

  /**
   * Validate file extension
   * - If valid → accept file
   * - If invalid → reject with meaningful error
   */
  if (allowed.test(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error("Only image files are allowed (png, jpg, jpeg, gif)"),
      false
    );
  }
}

/**
 * Multer upload middleware configuration
 * - Uses disk storage defined above
 * - Limits file size to 2 MB (prevents abuse)
 * - Applies file type validation via fileFilter
 */
const uploadLogo = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Max file size: 2 MB
  fileFilter,
});

/**
 * Export middleware
 * Usage example:
 * uploadLogo.single("logo")
 */
export default uploadLogo;