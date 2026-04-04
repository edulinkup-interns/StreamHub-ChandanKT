import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { videoApi } from '../../services/api';
import VideoCard from '../../components/common/VideoCard';
import Spinner from '../../components/common/Spinner';

const categories = ['All', 'Technology', 'Education', 'Gaming', 'Music', 'Sports', 'News', 'Entertainment'];

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState('All');

  const { data, isLoading } = useQuery({
    queryKey: ['videos', activeCategory],
    queryFn: () => videoApi.getVideos(activeCategory !== 'All' ? { category: activeCategory } : {}),
    select: (res) => res.data,
  });

  return (
    <div>
      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-white text-gray-900'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="md" />
        </div>
      ) : !data?.videos?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <span className="text-5xl mb-4">📺</span>
          <p className="text-lg">No videos yet</p>
          <p className="text-sm mt-1">Be the first to upload!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.videos.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
