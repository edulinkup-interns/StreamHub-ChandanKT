const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'video') {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'), false);
    }
  } else if (file.fieldname === 'thumbnail' || file.fieldname === 'avatar' || file.fieldname === 'banner') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  } else {
    cb(null, true);
  }
};

const uploadVideo = multer({
  storage,
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
});

const uploadImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = { uploadVideo, uploadImage };
