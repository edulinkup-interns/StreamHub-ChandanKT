import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { channelApi } from '../../services/api';
import useAuthStore from '../../store/authStore';
import VideoCard from '../../components/common/VideoCard';
import Spinner from '../../components/common/Spinner';

const tabs = ['Videos', 'About'];

export default function ChannelPage() {
  const { username } = useParams();
  const [activeTab, setActiveTab] = useState('Videos');
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const { data: channel, isLoading } = useQuery({
    queryKey: ['channel', username],
    queryFn: () => channelApi.getChannel(username),
    select: (res) => res.data,
  });

  const { data: videos, isLoading: videosLoading } = useQuery({
    queryKey: ['channelVideos', username],
    queryFn: () => channelApi.getChannelVideos(username),
    select: (res) => res.data?.videos || [],
    enabled: activeTab === 'Videos',
  });

  const subscribeMutation = useMutation({
    mutationFn: () => channelApi.subscribe(channel._id),
    onSuccess: () => {
      qc.invalidateQueries(['channel', username]);
      toast.success('Subscription updated!');
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  if (!channel) {
    return <div className="flex justify-center py-20 text-gray-500">Channel not found</div>;
  }

  const isSubscribed = user && channel.subscribers?.includes(user._id);
  const isOwner = user?._id === channel._id || user?.username === username;
  const formatCount = (n) => {
    if (!n) return '0';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
  };

  return (
    <div>
      {/* Banner */}
      <div className="w-full h-40 md:h-56 rounded-2xl bg-gradient-to-r from-gray-800 to-gray-700 overflow-hidden mb-0">
        {channel.banner && (
          <img src={channel.banner} alt="banner" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Channel header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 px-2 -mt-8 mb-6">
        <div className="w-24 h-24 rounded-full bg-gray-700 border-4 border-gray-950 overflow-hidden flex items-center justify-center text-3xl font-bold flex-shrink-0">
          {channel.avatar
            ? <img src={channel.avatar} alt="" className="w-full h-full object-cover" />
            : channel.displayName?.[0]}
        </div>
        <div className="flex-1 min-w-0 sm:pb-2">
          <h1 className="text-2xl font-bold">{channel.displayName}</h1>
          <p className="text-gray-400 text-sm">@{channel.username}</p>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            <span className="flex items-center gap-1"><Users size={14} /> {formatCount(channel.subscriberCount)} subscribers</span>
            <span>·</span>
            <span>{channel.videoCount || 0} videos</span>
          </div>
        </div>
        {!isOwner && (
          <button
            onClick={() => user ? subscribeMutation.mutate() : toast.error('Sign in to subscribe')}
            disabled={subscribeMutation.isPending}
            className={`px-6 py-2 rounded-full font-medium text-sm transition-colors ${
              isSubscribed ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {isSubscribed ? 'Subscribed' : 'Subscribe'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-white text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Videos tab */}
      {activeTab === 'Videos' && (
        videosLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : !videos?.length ? (
          <div className="flex flex-col items-center py-20 text-gray-500 gap-3">
            <span className="text-4xl">📹</span>
            <p>No videos uploaded yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {videos.map((v) => <VideoCard key={v._id} video={v} />)}
          </div>
        )
      )}

      {/* About tab */}
      {activeTab === 'About' && (
        <div className="max-w-2xl space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-gray-400 text-sm whitespace-pre-line">
              {channel.bio || 'No description provided.'}
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Stats</h3>
            <div className="space-y-2 text-sm text-gray-400">
              <p>Joined {formatDistanceToNow(new Date(channel.createdAt), { addSuffix: true })}</p>
              <p>{formatCount(channel.totalViews)} total views</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
