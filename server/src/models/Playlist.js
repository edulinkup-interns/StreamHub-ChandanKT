const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, default: '', maxlength: 2000 },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  videos: [{
    video: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
    addedAt: { type: Date, default: Date.now },
  }],
  visibility: {
    type: String,
    enum: ['public', 'private', 'unlisted'],
    default: 'public',
  },
  thumbnailUrl: { type: String, default: '' },
}, { timestamps: true });

playlistSchema.index({ owner: 1 });

module.exports = mongoose.model('Playlist', playlistSchema);
