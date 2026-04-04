import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { History, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { analyticsApi } from '../../services/api';
import VideoCard from '../../components/common/VideoCard';
import Spinner from '../../components/common/Spinner';

export default function HistoryPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['watchHistory'],
    queryFn: () => analyticsApi.getWatchHistory(),
    select: (res) => res.data,
  });

  const clearMutation = useMutation({
    mutationFn: () => analyticsApi.clearHistory(),
    onSuccess: () => {
      qc.invalidateQueries(['watchHistory']);
      toast.success('Watch history cleared');
    },
  });

  const handleClear = () => {
    if (window.confirm('Clear all watch history? This cannot be undone.')) {
      clearMutation.mutate();
    }
  };

  // Group by day
  const groupedHistory = (() => {
    if (!data?.history) return [];
    const groups = {};
    data.history.forEach((item) => {
      const date = new Date(item.watchedAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let label;
      if (date.toDateString() === today.toDateString()) label = 'Today';
      else if (date.toDateString() === yesterday.toDateString()) label = 'Yesterday';
      else label = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

      if (!groups[label]) groups[label] = [];
      groups[label].push(item);
    });
    return Object.entries(groups);
  })();

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <History size={24} className="text-red-400" /> Watch History
        </h1>
        {data?.history?.length > 0 && (
          <button
            onClick={handleClear}
            disabled={clearMutation.isPending}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors"
          >
            <Trash2 size={16} /> Clear history
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="md" /></div>
      ) : !data?.history?.length ? (
        <div className="flex flex-col items-center py-20 text-gray-500 gap-3">
          <History size={48} />
          <p className="text-lg">No watch history yet</p>
          <p className="text-sm">Videos you watch will appear here</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedHistory.map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">{dateLabel}</h2>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item._id} className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <VideoCard video={item.video} horizontal />
                    </div>
                    <span className="text-gray-600 text-xs mt-3 flex-shrink-0">
                      {formatDistanceToNow(new Date(item.watchedAt), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
