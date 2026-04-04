const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const { protect, optionalAuth } = require('../middleware/auth');
const { uploadVideo } = require('../middleware/upload');

router.get('/', optionalAuth, videoController.getVideos);
router.get('/recommendations', optionalAuth, videoController.getRecommendedVideos);
router.get('/:id', optionalAuth, videoController.getVideoById);

router.post('/',
  protect,
  uploadVideo.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]),
  videoController.uploadVideo
);

router.put('/:id',
  protect,
  uploadVideo.fields([{ name: 'thumbnail', maxCount: 1 }]),
  videoController.updateVideo
);

router.delete('/:id', protect, videoController.deleteVideo);
router.post('/:id/like', protect, videoController.likeVideo);
router.post('/:id/dislike', protect, videoController.dislikeVideo);
router.post('/:id/progress', protect, videoController.updateWatchProgress);

module.exports = router;
