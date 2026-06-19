const multer = require('multer');
const { validateUploadedFile } = require('../../shared/middlewares/security.middleware');

// Use memory storage so we control upload to S3 manually
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  try {
    validateUploadedFile(file);
    cb(null, true);
  } catch (error) {
    cb(error, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
});

module.exports = { upload };
