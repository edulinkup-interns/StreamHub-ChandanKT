import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Eye, ThumbsUp, Users, BarChart2, TrendingUp, Video, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { analyticsApi, videoApi } from '../../services/api';
import useAuthStore from '../../store/authStore';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';

function StatCard({ icon: Icon, label, value, color = 'text-red-400' }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-gray-400 text-sm">{label}</p>
        <Icon size={20} className={color} />
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['channelAnalytics'],
    queryFn: () => analyticsApi.getChannelAnalytics(),
    select: (res) => res.data,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => videoApi.delete(id),
    onSuccess: () => {
      toast.success('Video deleted successfully');
      qc.invalidateQueries(['channelAnalytics']);
    },
    onError: () => {
      toast.error('Failed to delete video');
    }
  });

  const formatNum = (n) => {
    if (!n) return '0';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  const stats = analytics?.overview;
  const recentVideos = analytics?.recentVideos || [];

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center font-bold">
          {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : user?.displayName?.[0]}
        </div>
        <div>
          <h1 className="text-xl font-bold">Channel Dashboard</h1>
          <p className="text-gray-400 text-sm">@{user?.username}</p>
        </div>
        <Link to="/upload" className="btn-primary ml-auto flex items-center gap-2 text-sm">
          <Video size={16} /> Upload Video
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Eye} label="Total Views" value={formatNum(stats?.totalViews)} />
        <StatCard icon={Users} label="Subscribers" value={formatNum(stats?.subscribers)} color="text-blue-400" />
        <StatCard icon={Video} label="Total Videos" value={formatNum(stats?.totalVideos)} color="text-purple-400" />
        <StatCard icon={ThumbsUp} label="Total Likes" value={formatNum(stats?.totalLikes)} color="text-green-400" />
      </div>

      {/* Recent videos */}
      <div>
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <BarChart2 size={20} className="text-red-400" /> Recent Videos
        </h2>

        {!recentVideos.length ? (
          <div className="card p-12 text-center text-gray-500">
            <Video size={40} className="mx-auto mb-3 opacity-50" />
            <p>No videos uploaded yet</p>
            <Link to="/upload" className="btn-primary inline-flex items-center gap-2 mt-4 text-sm">
              <Video size={16} /> Upload your first video
            </Link>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400">
                    <th className="text-left px-4 py-3 font-medium">Video</th>
                    <th className="text-right px-4 py-3 font-medium">Views</th>
                    <th className="text-right px-4 py-3 font-medium">Likes</th>
                    <th className="text-right px-4 py-3 font-medium">Comments</th>
                    <th className="text-right px-4 py-3 font-medium">Published</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentVideos.map((video) => (
                    <tr key={video._id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-16 aspect-video rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                            {video.thumbnailUrl
                              ? <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-gray-600">▶</div>}
                          </div>
                          <Link to={`/watch/${video._id}`} className="font-medium line-clamp-2 hover:text-red-400 transition-colors max-w-xs">
                            {video.title}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400">{formatNum(video.views)}</td>
                      <td className="px-4 py-3 text-right text-gray-400">{formatNum(video.likes?.length)}</td>
                      <td className="px-4 py-3 text-right text-gray-400">{formatNum(video.commentCount)}</td>
                      <td className="px-4 py-3 text-right text-gray-500 whitespace-nowrap text-xs">
                        {formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this video?')) {
                              deleteMutation.mutate(video._id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="text-gray-500 hover:text-red-400 p-1 rounded-md transition-colors disabled:opacity-50"
                          title="Delete Video"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Growth chart placeholder */}
      <div className="mt-8">
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-blue-400" /> Growth (Last 30 Days)
        </h2>
        <div className="card p-6">
          {analytics?.growth?.length ? (
            <div className="flex items-end gap-1 h-32">
              {analytics.growth.map((point, i) => {
                const max = Math.max(...analytics.growth.map((p) => p.views || 0)) || 1;
                const height = Math.max(4, ((point.views || 0) / max) * 100);
                return (
                  <div key={i} className="flex-1 h-full flex flex-col items-center justify-end gap-1 group">
                    <div
                      className="w-full bg-red-600 rounded-t opacity-70 group-hover:opacity-100 transition-opacity"
                      style={{ height: `${height}%` }}
                      title={`${point.date}: ${point.views} views`}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-600">
              No data yet — start uploading!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
