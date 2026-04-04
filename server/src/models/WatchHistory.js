const mongoose = require('mongoose');

const watchHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  video: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
  watchedAt: { type: Date, default: Date.now },
  progress: { type: Number, default: 0 }, // seconds watched
  completed: { type: Boolean, default: false },
}, { timestamps: true });

watchHistorySchema.index({ user: 1, watchedAt: -1 });
watchHistorySchema.index({ user: 1, video: 1 });

module.exports = mongoose.model('WatchHistory', watchHistorySchema);
