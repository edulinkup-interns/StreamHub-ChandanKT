const Video = require('../models/Video');
const WatchHistory = require('../models/WatchHistory');

// Basic recommendation without LLM
const getBasicRecommendations = async (userId, limit = 10) => {
  if (!userId) {
    return Video.find({ status: 'published', visibility: 'public' })
      .sort({ views: -1, createdAt: -1 })
      .limit(limit)
      .populate('creator', 'username displayName avatar');
  }

  const history = await WatchHistory.find({ user: userId })
    .sort({ watchedAt: -1 })
    .limit(20)
    .populate('video', 'category tags');

  const categoryCounts = {};
  const watchedVideoIds = [];

  history.forEach(({ video }) => {
    if (!video) return;
    watchedVideoIds.push(video._id);
    if (video.category) {
      categoryCounts[video.category] = (categoryCounts[video.category] || 0) + 1;
    }
  });

  const topCategory = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0];

  const query = {
    status: 'published',
    visibility: 'public',
    _id: { $nin: watchedVideoIds },
  };

  if (topCategory) query.category = topCategory;

  const recommendations = await Video.find(query)
    .sort({ views: -1, createdAt: -1 })
    .limit(limit)
    .populate('creator', 'username displayName avatar');

  if (recommendations.length < limit) {
    const extra = await Video.find({
      status: 'published',
      visibility: 'public',
      _id: { $nin: [...watchedVideoIds, ...recommendations.map(v => v._id)] },
    })
      .sort({ createdAt: -1 })
      .limit(limit - recommendations.length)
      .populate('creator', 'username displayName avatar');
    return [...recommendations, ...extra];
  }

  return recommendations;
};

// Groq LLM-powered recommendations
const getGroqRecommendations = async (userId, limit = 10) => {
  try {
    const Groq = require('groq-sdk');
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const history = await WatchHistory.find({ user: userId })
      .sort({ watchedAt: -1 })
      .limit(10)
      .populate('video', 'title category tags');

    const watchedTitles = history.map(h => h.video?.title).filter(Boolean);

    if (watchedTitles.length === 0) {
      return getBasicRecommendations(userId, limit);
    }

    const allVideos = await Video.find({ status: 'published', visibility: 'public' })
      .select('_id title category tags')
      .limit(100);

    const prompt = `Based on these recently watched videos: ${watchedTitles.join(', ')}.
From this list of available videos, return the IDs of the ${limit} most relevant ones as a JSON array:
${allVideos.map(v => `{"id":"${v._id}","title":"${v.title}","category":"${v.category}"}`).join('\n')}
Return only a JSON array of IDs like: ["id1","id2",...]`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
      max_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content || '[]';
    const match = content.match(/\[.*\]/s);
    const ids = match ? JSON.parse(match[0]) : [];

    if (ids.length === 0) return getBasicRecommendations(userId, limit);

    const videos = await Video.find({ _id: { $in: ids } })
      .populate('creator', 'username displayName avatar');

    return videos;
  } catch (err) {
    return getBasicRecommendations(userId, limit);
  }
};

const getRecommendations = async (userId, limit = 10) => {
  if (process.env.GROQ_API_KEY) {
    return getGroqRecommendations(userId, limit);
  }
  return getBasicRecommendations(userId, limit);
};

module.exports = { getRecommendations, getBasicRecommendations };
