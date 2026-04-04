import { useEffect, useRef, useState } from 'react';
import 'video.js/dist/video-js.css';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ThumbsUp, ThumbsDown, Share2, BookmarkPlus, ChevronDown, ChevronUp, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { videoApi, commentApi, channelApi } from '../../services/api';
import useAuthStore from '../../store/authStore';
import VideoCard from '../../components/common/VideoCard';
import Spinner from '../../components/common/Spinner';

function VideoPlayer({ video }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    if (!video?.videoUrl || !containerRef.current) return;

    let player;

    import('video.js').then(({ default: videojs }) => {
      if (!playerRef.current) {
        // Programmatically create the video element to avoid React DOM mutation issues
        const videoElement = document.createElement('video-js');
        videoElement.className = 'video-js vjs-big-play-centered w-full rounded-xl overflow-hidden';
        containerRef.current.appendChild(videoElement);

        player = videojs(videoElement, {
          controls: true,
          responsive: true,
          fluid: true,
          preload: 'auto',
          sources: [{ src: video.videoUrl, type: 'video/mp4' }],
          poster: video.thumbnailUrl,
        });

        playerRef.current = player;
      } else {
        // Update existing player
        player = playerRef.current;
        player.src([{ src: video.videoUrl, type: 'video/mp4' }]);
        player.poster(video.thumbnailUrl);
      }
    });

    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [video?.videoUrl, video?.thumbnailUrl]);

  return (
    <div data-vjs-player>
      <div ref={containerRef} className="w-full rounded-xl overflow-hidden bg-black" />
    </div>
  );
}

function CommentSection({ videoId }) {
  const [commentText, setCommentText] = useState('');
  const [showReplies, setShowReplies] = useState({});
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['comments', videoId],
    queryFn: () => commentApi.getComments(videoId),
    select: (res) => res.data,
  });

  const addMutation = useMutation({
    mutationFn: (text) => commentApi.addComment(videoId, { content: text }),
    onSuccess: () => {
      qc.invalidateQueries(['comments', videoId]);
      setCommentText('');
      toast.success('Comment added!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => commentApi.deleteComment(id),
    onSuccess: () => qc.invalidateQueries(['comments', videoId]),
  });

  const likeMutation = useMutation({
    mutationFn: (id) => commentApi.likeComment(id),
    onSuccess: () => qc.invalidateQueries(['comments', videoId]),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) return toast.error('Sign in to comment');
    if (!commentText.trim()) return;
    addMutation.mutate(commentText.trim());
  };

  return (
    <div className="mt-6">
      <h3 className="font-semibold text-lg mb-4">{data?.total || 0} Comments</h3>

      {user && (
        <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
          <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : user.displayName?.[0]}
          </div>
          <div className="flex-1">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="input-field"
            />
            <div className="flex justify-end mt-2">
              <button type="submit" disabled={addMutation.isPending || !commentText.trim()} className="btn-primary flex items-center gap-2 py-1.5 text-sm">
                <Send size={14} /> Post
              </button>
            </div>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center py-6"><Spinner /></div>
      ) : (
        <div className="space-y-4">
          {data?.comments?.map((comment) => (
            <div key={comment._id} className="flex gap-3">
              <Link to={`/channel/${comment.author?.username}`} className="flex-shrink-0">
                <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden text-sm font-bold">
                  {comment.author?.avatar
                    ? <img src={comment.author.avatar} alt="" className="w-full h-full object-cover" />
                    : comment.author?.displayName?.[0]}
                </div>
              </Link>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Link to={`/channel/${comment.author?.username}`} className="text-sm font-medium hover:text-white">
                    {comment.author?.displayName || comment.author?.username}
                  </Link>
                  <span className="text-gray-500 text-xs">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-gray-300">{comment.text}</p>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={() => user ? likeMutation.mutate(comment._id) : toast.error('Sign in to like')}
                    className="flex items-center gap-1 text-gray-500 hover:text-white text-xs transition-colors"
                  >
                    <ThumbsUp size={13} /> {comment.likes?.length || 0}
                  </button>
                  {user?._id === comment.author?._id && (
                    <button
                      onClick={() => deleteMutation.mutate(comment._id)}
                      className="text-gray-500 hover:text-red-400 text-xs transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function VideoPage() {
  const { id } = useParams();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [descExpanded, setDescExpanded] = useState(false);

  const { data: video, isLoading } = useQuery({
    queryKey: ['video', id],
    queryFn: () => videoApi.getById(id),
    select: (res) => res.data,
  });

  const { data: recommendations } = useQuery({
    queryKey: ['recommendations'],
    queryFn: () => videoApi.getVideos({ limit: 10 }),
    select: (res) => res.data?.videos || [],
  });

  const likeMutation = useMutation({
    mutationFn: () => videoApi.like(id),
    onSuccess: () => qc.invalidateQueries(['video', id]),
  });

  const dislikeMutation = useMutation({
    mutationFn: () => videoApi.dislike(id),
    onSuccess: () => qc.invalidateQueries(['video', id]),
  });

  const subscribeMutation = useMutation({
    mutationFn: () => channelApi.subscribe(video.creator._id),
    onSuccess: () => {
      qc.invalidateQueries(['video', id]);
      toast.success('Subscription updated!');
    },
  });

  const handleLike = () => {
    if (!user) return toast.error('Sign in to like videos');
    likeMutation.mutate();
  };

  const handleDislike = () => {
    if (!user) return toast.error('Sign in to rate videos');
    dislikeMutation.mutate();
  };

  const handleSubscribe = () => {
    if (!user) return toast.error('Sign in to subscribe');
    subscribeMutation.mutate();
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied!');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <p className="text-lg">Video not found</p>
      </div>
    );
  }

  const isLiked = user && video.likes?.includes(user._id);
  const isDisliked = user && video.dislikes?.includes(user._id);
  const isSubscribed = user && video.creator?.subscribers?.includes(user._id);

  const formatCount = (n) => {
    if (!n) return '0';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 max-w-screen-2xl">
      {/* Main */}
      <div className="flex-1 min-w-0">
        {/* Player */}
        <div className="rounded-xl overflow-hidden bg-black">
          <VideoPlayer video={video} />
        </div>

        {/* Title & Actions */}
        <div className="mt-4">
          <h1 className="text-xl font-bold leading-snug">{video.title}</h1>

          <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
            {/* Channel info */}
            <div className="flex items-center gap-3">
              <Link to={`/channel/${video.creator?.username}`}>
                <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center font-bold">
                  {video.creator?.avatar
                    ? <img src={video.creator.avatar} alt="" className="w-full h-full object-cover" />
                    : video.creator?.displayName?.[0]}
                </div>
              </Link>
              <div>
                <Link to={`/channel/${video.creator?.username}`} className="font-medium text-sm hover:text-red-400 transition-colors block">
                  {video.creator?.displayName || video.creator?.username}
                </Link>
                <p className="text-gray-500 text-xs">
                  {formatCount(video.creator?.subscriberCount)} subscribers
                </p>
              </div>
              <button
                onClick={handleSubscribe}
                className={`ml-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isSubscribed
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {isSubscribed ? 'Subscribed' : 'Subscribe'}
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-gray-800 rounded-full overflow-hidden">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-700 transition-colors ${isLiked ? 'text-blue-400' : ''}`}
                >
                  <ThumbsUp size={16} /> {formatCount(video.likes?.length)}
                </button>
                <div className="w-px h-6 bg-gray-700" />
                <button
                  onClick={handleDislike}
                  className={`flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-700 transition-colors ${isDisliked ? 'text-red-400' : ''}`}
                >
                  <ThumbsDown size={16} />
                </button>
              </div>
              <button onClick={handleShare} className="btn-secondary flex items-center gap-2 text-sm py-2">
                <Share2 size={16} /> Share
              </button>
            </div>
          </div>

          {/* Stats & Description */}
          <div className="mt-4 bg-gray-900 rounded-xl p-4">
            <p className="text-sm text-gray-400 font-medium mb-2">
              {formatCount(video.views)} views ·{' '}
              {formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}
              {video.category && ` · ${video.category}`}
            </p>
            <div className={`text-sm text-gray-300 whitespace-pre-line ${!descExpanded ? 'line-clamp-3' : ''}`}>
              {video.description || 'No description provided.'}
            </div>
            {video.description?.length > 200 && (
              <button
                onClick={() => setDescExpanded(!descExpanded)}
                className="flex items-center gap-1 text-sm font-medium mt-2 hover:text-white transition-colors"
              >
                {descExpanded ? <><ChevronUp size={16} /> Show less</> : <><ChevronDown size={16} /> Show more</>}
              </button>
            )}
          </div>
        </div>

        {/* Comments */}
        <CommentSection videoId={id} />
      </div>

      {/* Sidebar recommendations */}
      <div className="xl:w-96 flex-shrink-0">
        <h3 className="font-semibold mb-3 text-gray-400 text-sm uppercase tracking-wide">Up next</h3>
        <div className="space-y-2">
          {recommendations
            ?.filter((v) => v._id !== id)
            .slice(0, 8)
            .map((v) => (
              <VideoCard key={v._id} video={v} horizontal />
            ))}
        </div>
      </div>
    </div>
  );
}
