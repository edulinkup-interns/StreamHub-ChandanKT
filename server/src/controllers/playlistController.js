const Playlist = require('../models/Playlist');
const Video = require('../models/Video');

exports.createPlaylist = async (req, res, next) => {
  try {
    const { title, description, visibility } = req.body;
    const playlist = await Playlist.create({
      title,
      description,
      owner: req.user._id,
      visibility: visibility || 'public',
    });
    res.status(201).json(playlist);
  } catch (err) {
    next(err);
  }
};

exports.getMyPlaylists = async (req, res, next) => {
  try {
    const playlists = await Playlist.find({ owner: req.user._id })
      .sort({ createdAt: -1 });
    res.json(playlists);
  } catch (err) {
    next(err);
  }
};

exports.getPlaylistById = async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id)
      .populate('owner', 'username displayName avatar')
      .populate({
        path: 'videos.video',
        populate: { path: 'creator', select: 'username displayName avatar' },
      });

    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    if (playlist.visibility === 'private' && playlist.owner._id.toString() !== req.user?._id?.toString()) {
      return res.status(403).json({ error: 'This playlist is private' });
    }
    res.json(playlist);
  } catch (err) {
    next(err);
  }
};

exports.addVideoToPlaylist = async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    if (playlist.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const video = await Video.findById(req.params.videoId);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    const alreadyAdded = playlist.videos.some(v => v.video.toString() === req.params.videoId);
    if (alreadyAdded) return res.status(400).json({ error: 'Video already in playlist' });

    playlist.videos.push({ video: req.params.videoId });
    if (!playlist.thumbnailUrl && video.thumbnailUrl) {
      playlist.thumbnailUrl = video.thumbnailUrl;
    }
    await playlist.save();
    res.json(playlist);
  } catch (err) {
    next(err);
  }
};

exports.removeVideoFromPlaylist = async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    if (playlist.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    playlist.videos = playlist.videos.filter(v => v.video.toString() !== req.params.videoId);
    await playlist.save();
    res.json(playlist);
  } catch (err) {
    next(err);
  }
};

exports.deletePlaylist = async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    if (playlist.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await playlist.deleteOne();
    res.json({ message: 'Playlist deleted' });
  } catch (err) {
    next(err);
  }
};

exports.updatePlaylist = async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    if (playlist.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const { title, description, visibility } = req.body;
    if (title) playlist.title = title;
    if (description !== undefined) playlist.description = description;
    if (visibility) playlist.visibility = visibility;
    await playlist.save();
    res.json(playlist);
  } catch (err) {
    next(err);
  }
};
