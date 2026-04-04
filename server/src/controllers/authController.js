const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { uploadImage } = require('../utils/cloudinaryUpload');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

exports.register = async (req, res, next) => {
  try {
    const { username, email, password, displayName } = req.body;
    const user = await User.create({ username, email, password, displayName: displayName || username });
    const token = signToken(user._id);
    res.status(201).json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        subscriberCount: user.subscriberCount,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = signToken(user._id);
    res.json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        subscriberCount: user.subscriberCount,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { displayName, bio } = req.body;
    const updates = {};
    if (displayName) updates.displayName = displayName;
    if (bio !== undefined) updates.bio = bio;

    if (req.files?.avatar?.[0]) {
      const result = await uploadImage(req.files.avatar[0].buffer, 'avatars');
      updates.avatar = result.secure_url;
    }
    if (req.files?.banner?.[0]) {
      const result = await uploadImage(req.files.banner[0].buffer, 'banners');
      updates.banner = result.secure_url;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};
