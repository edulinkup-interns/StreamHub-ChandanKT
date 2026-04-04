const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  video: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, trim: true, maxlength: 2000 },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  replyCount: { type: Number, default: 0 },
  isPinned: { type: Boolean, default: false },
}, { timestamps: true });

commentSchema.index({ video: 1, createdAt: -1 });
commentSchema.index({ parent: 1 });

module.exports = mongoose.model('Comment', commentSchema);
