import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, Shuffle, Lock, Globe, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { playlistApi } from '../../services/api';
import useAuthStore from '../../store/authStore';
import VideoCard from '../../components/common/VideoCard';
import Spinner from '../../components/common/Spinner';

export default function PlaylistPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const { data: playlist, isLoading } = useQuery({
    queryKey: ['playlist', id],
    queryFn: () => playlistApi.getById(id),
    select: (res) => res.data,
  });

  const removeVideoMutation = useMutation({
    mutationFn: (videoId) => playlistApi.removeVideo(id, videoId),
    onSuccess: () => {
      qc.invalidateQueries(['playlist', id]);
      toast.success('Video removed from playlist');
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  if (!playlist) {
    return <div className="flex justify-center py-20 text-gray-500">Playlist not found</div>;
  }

  const isOwner = user?._id === playlist.owner?._id;
  const videos = playlist.videos?.map(v => v.video).filter(Boolean) || [];
  const firstVideo = videos[0];
  const totalDuration = videos.reduce((acc, v) => acc + (v.duration || 0), 0);
  const formatDur = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m} min`;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-screen-xl">
      {/* Sidebar info */}
      <div className="lg:w-72 flex-shrink-0">
        <div className="card p-4 lg:sticky lg:top-20">
          {/* Thumbnail */}
          <div className="aspect-video rounded-xl overflow-hidden bg-gray-800 mb-4">
            {(playlist.thumbnailUrl || firstVideo?.thumbnailUrl) ? (
              <img src={playlist.thumbnailUrl || firstVideo.thumbnailUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600 text-4xl">▶</div>
            )}
          </div>

          <h1 className="font-bold text-lg leading-snug mb-1">{playlist.title}</h1>
          <Link to={`/channel/${playlist.owner?.username}`} className="text-red-400 text-sm hover:text-red-300">
            {playlist.owner?.displayName || playlist.owner?.username}
          </Link>
          <div className="flex items-center gap-2 mt-2 text-gray-500 text-sm">
            {playlist.visibility === 'public' ? <Globe size={14} /> : <Lock size={14} />}
            <span>{playlist.visibility === 'public' ? 'Public' : 'Private'}</span>
            <span>·</span>
            <span>{videos.length} videos</span>
            {totalDuration > 0 && <><span>·</span><span>{formatDur(totalDuration)}</span></>}
          </div>

          {playlist.description && (
            <p className="text-gray-400 text-sm mt-3 line-clamp-3">{playlist.description}</p>
          )}

          <div className="flex gap-2 mt-4">
            {firstVideo && (
              <button
                onClick={() => navigate(`/watch/${firstVideo._id}`)}
                className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm py-2"
              >
                <Play size={16} /> Play all
              </button>
            )}
            <button
              onClick={() => {
                if (!videos.length) return;
                const random = videos[Math.floor(Math.random() * videos.length)];
                navigate(`/watch/${random._id}`);
              }}
              className="btn-secondary px-3 py-2"
            >
              <Shuffle size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Video list */}
      <div className="flex-1 min-w-0">
        {!videos.length ? (
          <div className="flex flex-col items-center py-20 text-gray-500 gap-3">
            <span className="text-4xl">📭</span>
            <p>This playlist is empty</p>
          </div>
        ) : (
          <div className="space-y-2">
            {videos.map((video, i) => (
              <div key={video._id} className="flex items-start gap-2 group">
                <span className="text-gray-600 text-sm w-6 text-right mt-3 flex-shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <VideoCard video={video} horizontal />
                </div>
                {isOwner && (
                  <button
                    onClick={() => removeVideoMutation.mutate(video._id)}
                    className="mt-3 p-1.5 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
