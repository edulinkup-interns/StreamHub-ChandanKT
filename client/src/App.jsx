import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/Home/HomePage';
import VideoPage from './pages/Video/VideoPage';
import UploadPage from './pages/Upload/UploadPage';
import ChannelPage from './pages/Channel/ChannelPage';
import SearchPage from './pages/Search/SearchPage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import PlaylistPage from './pages/Playlist/PlaylistPage';
import PlaylistsPage from './pages/Playlist/PlaylistsPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import HistoryPage from './pages/History/HistoryPage';
import SubscriptionsPage from './pages/Subscriptions/SubscriptionsPage';
import ProtectedRoute from './components/common/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="watch/:id" element={<VideoPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="channel/:username" element={<ChannelPage />} />
          <Route path="playlist/:id" element={<PlaylistPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="upload" element={<UploadPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="subscriptions" element={<SubscriptionsPage />} />
            <Route path="playlists" element={<PlaylistsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
