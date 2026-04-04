const express = require('express');
const router = express.Router();
const playlistController = require('../controllers/playlistController');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/my', protect, playlistController.getMyPlaylists);
router.post('/', protect, playlistController.createPlaylist);
router.get('/:id', optionalAuth, playlistController.getPlaylistById);
router.put('/:id', protect, playlistController.updatePlaylist);
router.delete('/:id', protect, playlistController.deletePlaylist);
router.post('/:id/videos/:videoId', protect, playlistController.addVideoToPlaylist);
router.delete('/:id/videos/:videoId', protect, playlistController.removeVideoFromPlaylist);

module.exports = router;
