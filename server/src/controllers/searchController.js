const Video = require('../models/Video');
const User = require('../models/User');

exports.search = async (req, res, next) => {
  try {
    const { q, category, sort = 'relevance', page = 1, limit = 12, type = 'video' } = req.query;

    const sortMap = {
      relevance: { createdAt: -1 },
      recent: { createdAt: -1 },
      latest: { createdAt: -1 },
      popular: { views: -1 },
      oldest: { createdAt: 1 },
    };

    if (type === 'channel') {
      const searchQuery = q || '';
      const users = await User.find({
        $or: [
          { username: { $regex: searchQuery, $options: 'i' } },
          { displayName: { $regex: searchQuery, $options: 'i' } },
        ],
      })
        .limit(Number(limit))
        .skip((page - 1) * limit)
        .select('username displayName avatar subscriberCount bio');
      return res.json({ channels: users, total: users.length });
    }

    const query = {
      status: 'published',
      visibility: 'public',
    };

    let projection = {};
    let sortOption = sortMap[sort] || sortMap.relevance;

    if (q && q.trim().length > 0) {
      query.$text = { $search: q };
      if (sort === 'relevance') {
        projection = { score: { $meta: 'textScore' } };
        sortOption = { score: { $meta: 'textScore' } };
      }
    }
    if (category) query.category = category;

    const results = await Video.find(query, projection)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('creator', 'username displayName avatar');

    const total = await Video.countDocuments(query);
    res.json({ results, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

exports.getSuggestions = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const videos = await Video.find({
      title: { $regex: q, $options: 'i' },
      status: 'published',
      visibility: 'public',
    })
      .limit(8)
      .select('title');
    res.json(videos.map(v => v.title));
  } catch (err) {
    next(err);
  }
};
