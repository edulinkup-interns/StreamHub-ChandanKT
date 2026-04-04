const Comment = require('../models/Comment');
const Video = require('../models/Video');

exports.addComment = async (req, res, next) => {
  try {
    const { content, parentId } = req.body;
    const video = await Video.findById(req.params.videoId);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    const comment = await Comment.create({
      video: req.params.videoId,
      author: req.user._id,
      content,
      parent: parentId || null,
    });

    if (parentId) {
      await Comment.findByIdAndUpdate(parentId, { $inc: { replyCount: 1 } });
    } else {
      await Video.findByIdAndUpdate(req.params.videoId, { $inc: { commentCount: 1 } });
    }

    await comment.populate('author', 'username displayName avatar');
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
};

exports.getComments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const comments = await Comment.find({ video: req.params.videoId, parent: null })
      .sort({ isPinned: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('author', 'username displayName avatar');

    const total = await Comment.countDocuments({ video: req.params.videoId, parent: null });
    res.json({ comments, total, page: Number(page) });
  } catch (err) {
    next(err);
  }
};

exports.getReplies = async (req, res, next) => {
  try {
    const replies = await Comment.find({ parent: req.params.commentId })
      .sort({ createdAt: 1 })
      .populate('author', 'username displayName avatar');
    res.json(replies);
  } catch (err) {
    next(err);
  }
};

exports.likeComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    const userId = req.user._id;
    const likedIdx = comment.likes.indexOf(userId);
    const dislikedIdx = comment.dislikes.indexOf(userId);

    if (likedIdx > -1) {
      comment.likes.splice(likedIdx, 1);
    } else {
      comment.likes.push(userId);
      if (dislikedIdx > -1) comment.dislikes.splice(dislikedIdx, 1);
    }
    await comment.save();
    res.json({ likes: comment.likes.length, liked: likedIdx === -1 });
  } catch (err) {
    next(err);
  }
};

exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (!comment.parent) {
      await Video.findByIdAndUpdate(comment.video, { $inc: { commentCount: -1 } });
    } else {
      await Comment.findByIdAndUpdate(comment.parent, { $inc: { replyCount: -1 } });
    }

    await comment.deleteOne();
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    next(err);
  }
};
