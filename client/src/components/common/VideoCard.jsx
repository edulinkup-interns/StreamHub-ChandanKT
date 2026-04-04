import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const formatViews = (views) => {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`;
  return views?.toString() || '0';
};

const formatDuration = (seconds) => {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function VideoCard({ video, horizontal = false }) {
  if (!video) return null;

  const timeAgo = video.createdAt
    ? formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })
    : '';

  if (horizontal) {
    return (
      <Link to={`/watch/${video._id}`} className="flex gap-3 group hover:bg-gray-800 rounded-xl p-2 transition-colors">
        <div className="relative flex-shrink-0 w-40 aspect-video rounded-lg overflow-hidden bg-gray-800">
          {video.thumbnailUrl
            ? <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            : <div className="w-full h-full flex items-center justify-center text-gray-600 text-3xl">▶</div>}
          {video.duration > 0 && (
            <span className="absolute bottom-1 right-1 bg-black/80 text-xs px-1.5 py-0.5 rounded">
              {formatDuration(video.duration)}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium line-clamp-2 group-hover:text-red-400 transition-colors">{video.title}</h3>
          <p className="text-gray-400 text-xs mt-1">{video.creator?.displayName || video.creator?.username}</p>
          <p className="text-gray-500 text-xs">{formatViews(video.views)} views · {timeAgo}</p>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/watch/${video._id}`} className="video-card group">
      <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-800 mb-3">
        {video.thumbnailUrl
          ? <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
          : <div className="w-full h-full flex items-center justify-center text-gray-600 text-5xl">▶</div>}
        {video.duration > 0 && (
          <span className="absolute bottom-2 right-2 bg-black/80 text-xs px-1.5 py-0.5 rounded font-medium">
            {formatDuration(video.duration)}
          </span>
        )}
      </div>
      <div className="flex gap-3">
        <Link to={`/channel/${video.creator?.username}`} className="flex-shrink-0">
          {video.creator?.avatar
            ? <img src={video.creator.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
            : <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold">
                {video.creator?.displayName?.[0] || '?'}
              </div>}
        </Link>
        <div className="min-w-0">
          <h3 className="font-medium text-sm line-clamp-2 group-hover:text-red-400 transition-colors leading-snug">
            {video.title}
          </h3>
          <Link to={`/channel/${video.creator?.username}`} className="text-gray-400 text-xs mt-1 hover:text-white block">
            {video.creator?.displayName || video.creator?.username}
          </Link>
          <p className="text-gray-500 text-xs">{formatViews(video.views)} views · {timeAgo}</p>
        </div>
      </div>
    </Link>
  );
}
