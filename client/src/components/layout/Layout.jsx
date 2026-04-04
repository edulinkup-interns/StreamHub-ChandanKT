import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import useUIStore from '../../store/uiStore';

export default function Layout() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <Navbar />
      <div className="flex flex-1 pt-14">
        <Sidebar />
        <main
          className={`flex-1 transition-all duration-300 ${
            sidebarOpen ? 'ml-60' : 'ml-16'
          } p-4 lg:p-6`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
