const Video = require('../models/Video');
const WatchHistory = require('../models/WatchHistory');
const User = require('../models/User');

exports.getChannelAnalytics = async (req, res, next) => {
  try {
    const videos = await Video.find({ creator: req.user._id })
      .sort({ createdAt: -1 })
      .populate('creator', 'username displayName avatar');
    const totalViews = videos.reduce((sum, v) => sum + v.views, 0);
    const totalLikes = videos.reduce((sum, v) => sum + v.likes.length, 0);
    const totalComments = videos.reduce((sum, v) => sum + v.commentCount, 0);

    const topVideos = [...videos]
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)
      .map(v => ({ _id: v._id, title: v.title, views: v.views, likes: v.likes.length }));

    const categoryBreakdown = {};
    videos.forEach(v => {
      categoryBreakdown[v.category] = (categoryBreakdown[v.category] || 0) + 1;
    });

    // Generate last 30 days growth data
    const growth = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayViews = videos
        .filter(v => {
          const vDate = new Date(v.createdAt).toISOString().split('T')[0];
          return vDate === dateStr;
        })
        .reduce((sum, v) => sum + v.views, 0);
      growth.push({ date: dateStr, views: dayViews });
    }

    // Recent videos (last 10)
    const recentVideos = videos.slice(0, 10);

    res.json({
      overview: {
        totalViews,
        subscribers: req.user.subscriberCount,
        totalVideos: videos.length,
        totalLikes,
        totalComments,
      },
      recentVideos,
      topVideos,
      categoryBreakdown,
      growth,
    });
  } catch (err) {
    next(err);
  }
};

exports.getVideoAnalytics = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.videoId);
    if (!video) return res.status(404).json({ error: 'Video not found' });
    if (video.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json({
      views: video.views,
      likes: video.likes.length,
      dislikes: video.dislikes.length,
      commentCount: video.commentCount,
      likeRatio: video.likes.length / (video.likes.length + video.dislikes.length + 1),
    });
  } catch (err) {
    next(err);
  }
};

exports.getWatchHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const history = await WatchHistory.find({ user: req.user._id })
      .sort({ watchedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate({
        path: 'video',
        populate: { path: 'creator', select: 'username displayName avatar' },
      });

    const filtered = history.filter(h => h.video);
    const total = await WatchHistory.countDocuments({ user: req.user._id });
    res.json({ history: filtered, total, page: Number(page) });
  } catch (err) {
    next(err);
  }
};

exports.clearWatchHistory = async (req, res, next) => {
  try {
    await WatchHistory.deleteMany({ user: req.user._id });
    res.json({ message: 'Watch history cleared' });
  } catch (err) {
    next(err);
  }
};
