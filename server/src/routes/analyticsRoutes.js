const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.get('/channel', protect, analyticsController.getChannelAnalytics);
router.get('/video/:videoId', protect, analyticsController.getVideoAnalytics);
router.get('/history', protect, analyticsController.getWatchHistory);
router.delete('/history', protect, analyticsController.clearWatchHistory);

module.exports = router;
