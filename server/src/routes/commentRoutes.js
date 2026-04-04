const express = require('express');
const router = express.Router({ mergeParams: true });
const commentController = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

// /api/comments/video/:videoId
router.post('/video/:videoId', protect, commentController.addComment);
router.get('/video/:videoId', commentController.getComments);
router.get('/:commentId/replies', commentController.getReplies);
router.post('/:commentId/like', protect, commentController.likeComment);
router.delete('/:commentId', protect, commentController.deleteComment);

module.exports = router;
