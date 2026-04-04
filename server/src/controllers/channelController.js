const User = require('../models/User');
const Video = require('../models/Video');
const Subscription = require('../models/Subscription');

exports.getChannel = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: 'Channel not found' });

    const isSubscribed = req.user
      ? !!(await Subscription.findOne({ subscriber: req.user._id, channel: user._id }))
      : false;

    res.json({ ...user.toJSON(), isSubscribed });
  } catch (err) {
    next(err);
  }
};

exports.getChannelVideos = async (req, res, next) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: 'Channel not found' });

    const query = { creator: user._id, status: 'published' };
    if (req.user?._id.toString() !== user._id.toString()) {
      query.visibility = 'public';
    }

    const videos = await Video.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('creator', 'username displayName avatar');

    const total = await Video.countDocuments(query);
    res.json({ videos, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

exports.subscribe = async (req, res, next) => {
  try {
    const channel = await User.findById(req.params.channelId);
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    if (channel._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot subscribe to yourself' });
    }

    const existing = await Subscription.findOne({
      subscriber: req.user._id,
      channel: req.params.channelId,
    });

    if (existing) {
      await existing.deleteOne();
      await User.findByIdAndUpdate(req.params.channelId, { $inc: { subscriberCount: -1 } });
      return res.json({ subscribed: false, message: 'Unsubscribed' });
    }

    await Subscription.create({ subscriber: req.user._id, channel: req.params.channelId });
    await User.findByIdAndUpdate(req.params.channelId, { $inc: { subscriberCount: 1 } });
    res.json({ subscribed: true, message: 'Subscribed' });
  } catch (err) {
    next(err);
  }
};

exports.getSubscriptions = async (req, res, next) => {
  try {
    const subs = await Subscription.find({ subscriber: req.user._id })
      .populate('channel', 'username displayName avatar subscriberCount');
    res.json(subs.map(s => s.channel));
  } catch (err) {
    next(err);
  }
};

exports.getSubscriptionFeed = async (req, res, next) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const subs = await Subscription.find({ subscriber: req.user._id }).select('channel');
    const channelIds = subs.map(s => s.channel);

    const videos = await Video.find({
      creator: { $in: channelIds },
      status: 'published',
      visibility: 'public',
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('creator', 'username displayName avatar');

    const total = await Video.countDocuments({
      creator: { $in: channelIds },
      status: 'published',
      visibility: 'public',
    });

    res.json({ videos, total, page: Number(page) });
  } catch (err) {
    next(err);
  }
};
