import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { searchApi } from '../../services/api';
import VideoCard from '../../components/common/VideoCard';
import Spinner from '../../components/common/Spinner';

const sortOptions = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'recent', label: 'Most Recent' },
  { value: 'popular', label: 'Most Popular' },
];

const categories = ['All', 'Technology', 'Education', 'Gaming', 'Music', 'Sports', 'News', 'Entertainment'];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'relevance';
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['search', query, category, sort],
    queryFn: () => searchApi.search({ q: query, category: category || undefined, sort }),
    select: (res) => res.data,
    enabled: !!(query || category || sort),
  });

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    setSearchParams(params);
  };

  const title = query
    ? `Search results for "${query}"`
    : category
    ? `${category} videos`
    : sort === 'popular'
    ? 'Trending'
    : 'Browse';

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold">{title}</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <SlidersHorizontal size={16} /> Filters
        </button>
      </div>

      {showFilters && (
        <div className="bg-gray-900 rounded-xl p-4 mb-5 flex flex-wrap gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Sort by</p>
            <div className="flex gap-2">
              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateParam('sort', opt.value)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    sort === opt.value ? 'bg-white text-gray-900' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Category</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => updateParam('category', cat === 'All' ? '' : cat)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    (cat === 'All' && !category) || cat === category
                      ? 'bg-white text-gray-900'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="md" /></div>
      ) : !data?.results?.length ? (
        <div className="flex flex-col items-center py-20 text-gray-500 gap-3">
          <span className="text-5xl">🔍</span>
          <p className="text-lg">{query ? `No results for "${query}"` : 'No videos found'}</p>
          <p className="text-sm">Try different keywords or filters</p>
        </div>
      ) : (
        <>
          {data.total > 0 && (
            <p className="text-sm text-gray-500 mb-4">{data.total} results</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.results.map((video) => (
              <VideoCard key={video._id} video={video} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
