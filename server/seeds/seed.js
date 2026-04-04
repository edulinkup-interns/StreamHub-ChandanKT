require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Video = require('../src/models/Video');
const Comment = require('../src/models/Comment');
const Playlist = require('../src/models/Playlist');
const Subscription = require('../src/models/Subscription');

const CATEGORIES = ['Technology', 'Education', 'Gaming', 'Music'];

const SAMPLE_VIDEOS = [
  { title: 'Getting Started with React 18', category: 'Technology', duration: 1245, tags: ['react', 'javascript', 'webdev'] },
  { title: 'Node.js REST API Complete Guide', category: 'Technology', duration: 3600, tags: ['nodejs', 'api', 'backend'] },
  { title: 'MongoDB Aggregation Pipeline', category: 'Education', duration: 2100, tags: ['mongodb', 'database'] },
  { title: 'Tailwind CSS Crash Course', category: 'Technology', duration: 1800, tags: ['css', 'tailwind', 'frontend'] },
  { title: 'JavaScript ES2024 Features', category: 'Education', duration: 920, tags: ['javascript', 'es2024'] },
  { title: 'Gaming Setup Tour 2024', category: 'Gaming', duration: 780, tags: ['gaming', 'setup', 'pc'] },
  { title: 'Lo-fi Hip Hop Mix - Study Music', category: 'Music', duration: 7200, tags: ['lofi', 'study', 'chill'] },
  { title: 'Web Security Best Practices', category: 'Education', duration: 2700, tags: ['security', 'webdev'] },
  { title: 'TypeScript for Beginners', category: 'Technology', duration: 3200, tags: ['typescript', 'javascript'] },
  { title: 'Building a Full Stack App', category: 'Technology', duration: 5400, tags: ['fullstack', 'mern', 'react'] },
];

const THUMBNAIL_URLS = [
  'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=640&h=360&fit=crop',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=640&h=360&fit=crop',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=640&h=360&fit=crop',
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=640&h=360&fit=crop',
  'https://images.unsplash.com/photo-1504164996022-09080787b6b8?w=640&h=360&fit=crop',
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=640&h=360&fit=crop',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=640&h=360&fit=crop',
  'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=640&h=360&fit=crop',
  'https://images.unsplash.com/photo-1587620962725-abab19836100?w=640&h=360&fit=crop',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=640&h=360&fit=crop',
];

// Public domain sample video URL
const SAMPLE_VIDEO_URL = 'https://res.cloudinary.com/demo/video/upload/dog.mp4';

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Clean up
  await Promise.all([
    User.deleteMany({}),
    Video.deleteMany({}),
    Comment.deleteMany({}),
    Playlist.deleteMany({}),
    Subscription.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  // Create users
  const users = await User.create([
    {
      username: 'creator1',
      email: 'creator1@example.com',
      password: 'password123',
      displayName: 'Tech Creator',
      bio: 'Passionate about technology and web development.',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=creator1',
    },
    {
      username: 'creator2',
      email: 'creator2@example.com',
      password: 'password123',
      displayName: 'Creative Studio',
      bio: 'Music, gaming and creative content.',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=creator2',
    },
    {
      username: 'viewer1',
      email: 'viewer1@example.com',
      password: 'password123',
      displayName: 'Viewer One',
      bio: 'Love watching tech and gaming content.',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=viewer1',
    },
  ]);
  console.log('Created users');

  // Create videos
  const videoData = SAMPLE_VIDEOS.map((v, i) => ({
    ...v,
    creator: i < 7 ? users[0]._id : users[1]._id,
    videoUrl: SAMPLE_VIDEO_URL,
    thumbnailUrl: THUMBNAIL_URLS[i],
    status: 'published',
    visibility: 'public',
    views: Math.floor(Math.random() * 10000),
  }));

  const videos = await Video.create(videoData);
  console.log('Created videos');

  // Create subscriptions
  await Subscription.create([
    { subscriber: users[2]._id, channel: users[0]._id },
    { subscriber: users[2]._id, channel: users[1]._id },
    { subscriber: users[1]._id, channel: users[0]._id },
  ]);
  await User.findByIdAndUpdate(users[0]._id, { subscriberCount: 2 });
  await User.findByIdAndUpdate(users[1]._id, { subscriberCount: 1 });
  console.log('Created subscriptions');

  // Create comments (20 total)
  const commentData = [];
  for (let i = 0; i < 20; i++) {
    commentData.push({
      video: videos[i % videos.length]._id,
      author: users[i % 3]._id,
      content: [
        'Great video! Very informative.',
        'This really helped me understand the concept.',
        'Keep up the good work!',
        'Can you make a follow-up video on this topic?',
        'Amazing content as always!',
        'I learned so much from this video.',
        'This is exactly what I was looking for.',
        'Thanks for making this so easy to understand.',
      ][i % 8],
      parent: null,
    });
  }
  const comments = await Comment.create(commentData);

  // Add 5 replies
  await Comment.create([
    { video: videos[0]._id, author: users[1]._id, content: 'Totally agree!', parent: comments[0]._id },
    { video: videos[0]._id, author: users[2]._id, content: 'Same here, very helpful!', parent: comments[0]._id },
    { video: videos[1]._id, author: users[0]._id, content: 'Glad you found it useful!', parent: comments[1]._id },
  ]);

  // Update comment counts
  for (const video of videos) {
    const count = await Comment.countDocuments({ video: video._id, parent: null });
    await Video.findByIdAndUpdate(video._id, { commentCount: count });
  }
  console.log('Created comments');

  // Create playlists
  await Playlist.create([
    {
      title: 'Web Development Essentials',
      description: 'Must-watch videos for every web developer.',
      owner: users[0]._id,
      videos: videos.slice(0, 4).map(v => ({ video: v._id })),
      visibility: 'public',
      thumbnailUrl: THUMBNAIL_URLS[0],
    },
    {
      title: 'Learn to Code',
      description: 'Best coding tutorials for beginners.',
      owner: users[2]._id,
      videos: videos.slice(2, 6).map(v => ({ video: v._id })),
      visibility: 'public',
      thumbnailUrl: THUMBNAIL_URLS[2],
    },
    {
      title: 'Entertainment Mix',
      description: 'Gaming and music videos.',
      owner: users[1]._id,
      videos: videos.slice(5, 8).map(v => ({ video: v._id })),
      visibility: 'public',
      thumbnailUrl: THUMBNAIL_URLS[5],
    },
  ]);
  console.log('Created playlists');

  console.log('\nSeed complete!');
  console.log('Users created:');
  console.log('  creator1 / creator1@example.com / password123');
  console.log('  creator2 / creator2@example.com / password123');
  console.log('  viewer1  / viewer1@example.com  / password123');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
