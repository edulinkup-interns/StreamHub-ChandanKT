import { NavLink } from 'react-router-dom';
import { Home, Flame, History, ThumbsUp, PlaySquare, Users, BarChart2, Clock } from 'lucide-react';
import useUIStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';

const navItems = [
  { to: '/', icon: Home, label: 'Home', exact: true },
  { to: '/search?sort=popular', icon: Flame, label: 'Trending' },
  { to: '/subscriptions', icon: Users, label: 'Subscriptions', auth: true },
  { to: '/history', icon: History, label: 'History', auth: true },
  { to: '/playlists', icon: PlaySquare, label: 'Playlists', auth: true },
  { to: '/dashboard', icon: BarChart2, label: 'Dashboard', auth: true },
];

const categories = ['Technology', 'Education', 'Gaming', 'Music'];

export default function Sidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const user = useAuthStore((s) => s.user);

  return (
    <aside
      className={`fixed left-0 top-14 bottom-0 z-40 bg-gray-900 border-r border-gray-800 transition-all duration-300 overflow-y-auto ${
        sidebarOpen ? 'w-60' : 'w-16'
      }`}
    >
      <nav className="py-3">
        {navItems.filter(item => !item.auth || user).map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg transition-colors text-sm ${
                isActive ? 'bg-gray-800 text-white font-medium' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon size={20} className="flex-shrink-0" />
            {sidebarOpen && <span>{label}</span>}
          </NavLink>
        ))}

        {sidebarOpen && (
          <>
            <div className="mx-4 my-3 border-t border-gray-800" />
            <p className="px-5 py-1 text-xs text-gray-500 uppercase tracking-wider">Categories</p>
            {categories.map(cat => (
              <NavLink
                key={cat}
                to={`/search?category=${cat}`}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 mx-2 rounded-lg transition-colors text-sm ${
                    isActive ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <span className="w-5 h-5 rounded text-xs flex items-center justify-center bg-gray-700">
                  {cat[0]}
                </span>
                {cat}
              </NavLink>
            ))}
          </>
        )}
      </nav>
    </aside>
  );
}
