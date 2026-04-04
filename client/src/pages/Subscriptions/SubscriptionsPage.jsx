import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { channelApi } from '../../services/api';
import VideoCard from '../../components/common/VideoCard';
import Spinner from '../../components/common/Spinner';

export default function SubscriptionsPage() {
  const { data: feed, isLoading: feedLoading } = useQuery({
    queryKey: ['subscriptionFeed'],
    queryFn: () => channelApi.getSubscriptionFeed(),
    select: (res) => res.data?.videos || [],
  });

  const { data: subscriptions, isLoading: subsLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => channelApi.getSubscriptions(),
    select: (res) => res.data || [],
  });

  const formatNum = (n) => {
    if (!n) return '0';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <Users size={24} className="text-red-400" /> Subscriptions
      </h1>

      {/* Subscribed channels row */}
      {!subsLoading && subscriptions?.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Channels you follow</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {subscriptions.map((channel) => (
              <Link
                key={channel._id}
                to={`/channel/${channel.username}`}
                className="flex flex-col items-center gap-2 flex-shrink-0 group"
              >
                <div className="w-14 h-14 rounded-full bg-gray-700 overflow-hidden ring-2 ring-transparent group-hover:ring-red-500 transition-all flex items-center justify-center font-bold text-lg">
                  {channel.avatar
                    ? <img src={channel.avatar} alt="" className="w-full h-full object-cover" />
                    : channel.displayName?.[0]}
                </div>
                <p className="text-xs text-gray-400 group-hover:text-white transition-colors text-center max-w-[60px] truncate">
                  {channel.displayName || channel.username}
                </p>
                <p className="text-xs text-gray-600">{formatNum(channel.subscriberCount)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Feed */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Latest from your subscriptions</h2>

        {feedLoading ? (
          <div className="flex justify-center py-20"><Spinner size="md" /></div>
        ) : !feed?.length ? (
          <div className="flex flex-col items-center py-20 text-gray-500 gap-3">
            <Users size={48} />
            <p className="text-lg">No videos yet</p>
            <p className="text-sm">
              {subscriptions?.length
                ? 'Channels you follow haven\'t uploaded recently'
                : 'Subscribe to channels to see their latest videos here'}
            </p>
            {!subscriptions?.length && (
              <Link to="/" className="btn-primary text-sm mt-2">Discover channels</Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {feed.map((video) => (
              <VideoCard key={video._id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
