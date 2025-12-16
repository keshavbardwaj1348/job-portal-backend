import multer from "multer";
import path from "path";
import fs from "fs";

/**
 * Upload directory path for candidate resumes
 * All uploaded resume files will be stored here
 */
const uploadPath = "uploads/resumes";

/**
 * Ensure the uploads directory exists before handling file uploads
 * - Prevents multer from failing if the directory is missing
 * - `recursive: true` safely creates nested directories if required
 * - Safe to execute on every server startup
 */
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

/**
 * Multer disk storage configuration
 * Controls where and how resume files are saved on disk
 */
const storage = multer.diskStorage({

  /**
   * Specifies the destination directory for uploaded files
   */
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },

  /**
   * Defines the stored filename format
   * - Preserves original file extension
   * - Appends a timestamp to avoid filename collisions
   * - Example: resume-1700000000000.pdf
   */
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + Date.now() + ext);
  },
});

/**
 * File filter for validating resume file types
 * - Allows only document formats used for resumes
 * - Prevents uploading of unsupported or unsafe file types
 */
function fileFilter(req, file, cb) {

  // Allowed resume file extensions
  const allowedTypes = /pdf|doc|docx/;

  // Extract and normalize file extension
  const ext = path.extname(file.originalname).toLowerCase();

  /**
   * Validate file extension
   * - Accept file if extension is allowed
   * - Reject file with a meaningful error message otherwise
   */
  if (allowedTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error("Only PDF, DOC, and DOCX files are allowed"),
      false
    );
  }
}

/**
 * Multer upload middleware configuration
 * - Uses disk storage defined above
 * - Restricts maximum file size to 2 MB
 * - Applies file type validation for security and consistency
 */
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Maximum file size: 2 MB
  fileFilter,
});

/**
 * Export upload middleware
 * Typical usage:
 * upload.single("resume")
 */
export default upload;