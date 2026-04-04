const express = require('express');
const router = express.Router();
const channelController = require('../controllers/channelController');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/subscriptions', protect, channelController.getSubscriptions);
router.get('/feed', protect, channelController.getSubscriptionFeed);
router.get('/:username', optionalAuth, channelController.getChannel);
router.get('/:username/videos', optionalAuth, channelController.getChannelVideos);
router.post('/:channelId/subscribe', protect, channelController.subscribe);

module.exports = router;
