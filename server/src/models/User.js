const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false,
  },
  displayName: { type: String, trim: true },
  avatar: { type: String, default: '' },
  banner: { type: String, default: '' },
  bio: { type: String, maxlength: 500, default: '' },
  subscriberCount: { type: Number, default: 0 },
  totalViews: { type: Number, default: 0 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.virtual('channelUrl').get(function () {
  return `/channel/${this.username}`;
});

module.exports = mongoose.model('User', userSchema);
