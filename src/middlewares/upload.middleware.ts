import multer from 'multer';

/**
 * Multer middleware for seed-data uploads.
 * Stores the uploaded file only in memory, accepts files identified as JSON
 * by MIME type or `.json` extension, and rejects files larger than 5 MB.
 * Controllers must read the resulting buffer from `req.file`; no file is
 * persisted on the server filesystem.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/json' && !file.originalname.endsWith('.json')) {
      return cb(new Error('Only JSON files are accepted'));
    }

    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

export default upload;
