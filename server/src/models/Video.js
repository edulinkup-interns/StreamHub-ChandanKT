const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, default: '', maxlength: 5000 },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  videoUrl: { type: String, required: true },
  cloudinaryPublicId: { type: String },
  thumbnailUrl: { type: String, default: '' },
  thumbnailPublicId: { type: String },
  duration: { type: Number, default: 0 },
  category: {
    type: String,
    enum: ['Technology', 'Education', 'Gaming', 'Music', 'Sports', 'News', 'Entertainment', 'Other'],
    default: 'Other',
  },
  tags: [{ type: String, trim: true }],
  status: {
    type: String,
    enum: ['processing', 'published', 'private', 'draft'],
    default: 'processing',
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'unlisted'],
    default: 'public',
  },
  views: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  commentCount: { type: Number, default: 0 },
  hlsUrl: { type: String, default: '' },
  format: { type: String },
  resolution: { type: String },
}, { timestamps: true });

videoSchema.index({ title: 'text', description: 'text', tags: 'text' });
videoSchema.index({ creator: 1, createdAt: -1 });
videoSchema.index({ category: 1, createdAt: -1 });
videoSchema.index({ views: -1 });

module.exports = mongoose.model('Video', videoSchema);
