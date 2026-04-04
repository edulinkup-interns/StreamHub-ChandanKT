const Video = require('../models/Video');
const WatchHistory = require('../models/WatchHistory');
const { uploadVideo, uploadImage, deleteResource } = require('../utils/cloudinaryUpload');
const { getRecommendations } = require('../utils/recommendations');

exports.uploadVideo = async (req, res, next) => {
  try {
    const { title, description, category, tags, visibility } = req.body;

    if (!req.files?.video?.[0]) {
      return res.status(400).json({ error: 'Video file is required' });
    }

    const videoBuffer = req.files.video[0].buffer;
    const videoResult = await uploadVideo(videoBuffer);

    let thumbnailUrl = '';
    let thumbnailPublicId = '';
    if (req.files?.thumbnail?.[0]) {
      const thumbResult = await uploadImage(req.files.thumbnail[0].buffer);
      thumbnailUrl = thumbResult.secure_url;
      thumbnailPublicId = thumbResult.public_id;
    } else {
      // Auto-generate thumbnail from video
      thumbnailUrl = videoResult.secure_url.replace(/\.[^/.]+$/, '.jpg')
        .replace('/video/upload/', '/video/upload/so_0/');
    }

    const video = await Video.create({
      title,
      description,
      creator: req.user._id,
      videoUrl: videoResult.secure_url,
      cloudinaryPublicId: videoResult.public_id,
      thumbnailUrl,
      thumbnailPublicId,
      duration: Math.round(videoResult.duration || 0),
      category,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      visibility: visibility || 'public',
      status: 'published',
      format: videoResult.format,
    });

    await video.populate('creator', 'username displayName avatar');
    res.status(201).json(video);
  } catch (err) {
    next(err);
  }
};

exports.getVideos = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, category, sort = 'latest' } = req.query;
    const query = { status: 'published', visibility: 'public' };
    if (category) query.category = category;

    const sortMap = {
      latest: { createdAt: -1 },
      popular: { views: -1 },
      oldest: { createdAt: 1 },
    };

    const videos = await Video.find(query)
      .sort(sortMap[sort] || sortMap.latest)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('creator', 'username displayName avatar');

    const total = await Video.countDocuments(query);
    res.json({ videos, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

exports.getVideoById = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('creator', 'username displayName avatar subscriberCount bio');

    if (!video || (video.visibility !== 'public' && video.creator._id.toString() !== req.user?._id?.toString())) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Increment views
    await Video.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    // Track watch history
    if (req.user) {
      await WatchHistory.findOneAndUpdate(
        { user: req.user._id, video: video._id },
        { watchedAt: new Date() },
        { upsert: true }
      );
    }

    res.json({ ...video.toJSON(), views: video.views + 1 });
  } catch (err) {
    next(err);
  }
};

exports.updateVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video not found' });
    if (video.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { title, description, category, tags, visibility } = req.body;
    const updates = {};
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (category) updates.category = category;
    if (tags) updates.tags = tags.split(',').map(t => t.trim());
    if (visibility) updates.visibility = visibility;

    if (req.files?.thumbnail?.[0]) {
      if (video.thumbnailPublicId) await deleteResource(video.thumbnailPublicId);
      const result = await uploadImage(req.files.thumbnail[0].buffer);
      updates.thumbnailUrl = result.secure_url;
      updates.thumbnailPublicId = result.public_id;
    }

    const updated = await Video.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('creator', 'username displayName avatar');
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.deleteVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video not found' });
    if (video.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (video.cloudinaryPublicId) await deleteResource(video.cloudinaryPublicId, 'video');
    if (video.thumbnailPublicId) await deleteResource(video.thumbnailPublicId);
    await video.deleteOne();
    res.json({ message: 'Video deleted successfully' });
  } catch (err) {
    next(err);
  }
};

exports.likeVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    const userId = req.user._id;
    const likedIdx = video.likes.indexOf(userId);
    const dislikedIdx = video.dislikes.indexOf(userId);

    if (likedIdx > -1) {
      video.likes.splice(likedIdx, 1);
    } else {
      video.likes.push(userId);
      if (dislikedIdx > -1) video.dislikes.splice(dislikedIdx, 1);
    }
    await video.save();
    res.json({ likes: video.likes.length, dislikes: video.dislikes.length, liked: likedIdx === -1 });
  } catch (err) {
    next(err);
  }
};

exports.dislikeVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    const userId = req.user._id;
    const dislikedIdx = video.dislikes.indexOf(userId);
    const likedIdx = video.likes.indexOf(userId);

    if (dislikedIdx > -1) {
      video.dislikes.splice(dislikedIdx, 1);
    } else {
      video.dislikes.push(userId);
      if (likedIdx > -1) video.likes.splice(likedIdx, 1);
    }
    await video.save();
    res.json({ likes: video.likes.length, dislikes: video.dislikes.length, disliked: dislikedIdx === -1 });
  } catch (err) {
    next(err);
  }
};

exports.getRecommendedVideos = async (req, res, next) => {
  try {
    const videos = await getRecommendations(req.user?._id);
    res.json(videos);
  } catch (err) {
    next(err);
  }
};

exports.updateWatchProgress = async (req, res, next) => {
  try {
    const { progress, completed } = req.body;
    await WatchHistory.findOneAndUpdate(
      { user: req.user._id, video: req.params.id },
      { progress, completed, watchedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
