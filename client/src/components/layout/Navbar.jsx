import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Search, Upload, Bell, User, LogOut, BarChart2, History, ListVideo } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useUIStore from '../../store/uiStore';
import { searchApi } from '../../services/api';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSugg, setShowSugg] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const searchRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (!searchRef.current?.contains(e.target)) setShowSugg(false);
      if (!menuRef.current?.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchSuggestions = async (q) => {
    if (!q.trim()) return setSuggestions([]);
    try {
      const { data } = await searchApi.getSuggestions(q);
      setSuggestions(data);
    } catch (_) {}
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowSugg(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-gray-900 border-b border-gray-800 flex items-center px-4 gap-4">
      {/* Left */}
      <div className="flex items-center gap-3 w-60 flex-shrink-0">
        <button onClick={toggleSidebar} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
          <Menu size={20} />
        </button>
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-red-500">▶</span>
          <span>StreamHub</span>
        </Link>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-xl mx-auto" ref={searchRef}>
        <form onSubmit={handleSearch} className="flex">
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); fetchSuggestions(e.target.value); setShowSugg(true); }}
            onFocus={() => setShowSugg(true)}
            placeholder="Search videos..."
            className="flex-1 bg-gray-800 border border-gray-700 border-r-0 rounded-l-full px-4 py-2 text-sm focus:outline-none focus:border-gray-500"
          />
          <button type="submit" className="bg-gray-700 hover:bg-gray-600 border border-gray-700 px-4 rounded-r-full transition-colors">
            <Search size={16} />
          </button>
        </form>
        {showSugg && suggestions.length > 0 && (
          <div className="absolute top-14 bg-gray-900 border border-gray-700 rounded-xl shadow-xl py-2 w-full max-w-xl">
            {suggestions.map((s, i) => (
              <button
                key={i}
                className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm flex items-center gap-3"
                onClick={() => { navigate(`/search?q=${encodeURIComponent(s)}`); setShowSugg(false); setQuery(s); }}
              >
                <Search size={14} className="text-gray-500" /> {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 ml-auto">
        {user ? (
          <>
            <Link to="/upload" className="btn-primary flex items-center gap-2 text-sm py-1.5">
              <Upload size={16} /> Upload
            </Link>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-9 h-9 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center hover:ring-2 hover:ring-red-500 transition-all"
              >
                {user.avatar
                  ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  : <User size={18} />}
              </button>
              {showMenu && (
                <div className="absolute right-0 top-11 bg-gray-900 border border-gray-700 rounded-xl shadow-xl py-2 w-52 z-50">
                  <div className="px-4 py-2 border-b border-gray-700 mb-1">
                    <p className="font-medium text-sm">{user.displayName}</p>
                    <p className="text-gray-400 text-xs">@{user.username}</p>
                  </div>
                  <Link to={`/channel/${user.username}`} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-800 text-sm"><User size={16} />My Channel</Link>
                  <Link to="/dashboard" className="flex items-center gap-3 px-4 py-2 hover:bg-gray-800 text-sm"><BarChart2 size={16} />Dashboard</Link>
                  <Link to="/history" className="flex items-center gap-3 px-4 py-2 hover:bg-gray-800 text-sm"><History size={16} />Watch History</Link>
                  <Link to="/playlists" className="flex items-center gap-3 px-4 py-2 hover:bg-gray-800 text-sm"><ListVideo size={16} />Playlists</Link>
                  <div className="border-t border-gray-700 mt-1 pt-1">
                    <button onClick={logout} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-800 text-sm text-red-400 w-full">
                      <LogOut size={16} />Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn-secondary text-sm py-1.5">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm py-1.5">Sign Up</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
