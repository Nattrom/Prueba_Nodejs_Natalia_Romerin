import multer from 'multer';

/**
 * Configure Multer for JSON file uploads.
 * - Memory storage (files not persisted to disk)
 * - Accept JSON files only
 * - Max file size: 5 MB
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
