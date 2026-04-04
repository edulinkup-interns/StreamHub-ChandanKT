import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ListVideo, Trash2, Lock, Globe } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { playlistApi } from '../../services/api';
import Spinner from '../../components/common/Spinner';

function CreatePlaylistModal({ onClose }) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const createMutation = useMutation({
    mutationFn: (data) => playlistApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries(['myPlaylists']);
      toast.success('Playlist created!');
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create playlist'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold mb-4">New Playlist</h2>
        <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
              {...register('title', { required: 'Name is required' })}
              placeholder="My awesome playlist..."
              className="input-field"
            />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              {...register('description')}
              placeholder="Optional description..."
              rows={2}
              className="input-field resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Visibility</label>
            <select {...register('visibility')} className="input-field">
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {createMutation.isPending ? <Spinner /> : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PlaylistsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const qc = useQueryClient();

  const { data: playlists, isLoading } = useQuery({
    queryKey: ['myPlaylists'],
    queryFn: () => playlistApi.getMyPlaylists(),
    select: (res) => res.data || [],
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => playlistApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries(['myPlaylists']);
      toast.success('Playlist deleted');
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Your Playlists</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> New Playlist
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="md" /></div>
      ) : !playlists?.length ? (
        <div className="flex flex-col items-center py-20 text-gray-500 gap-3">
          <ListVideo size={48} />
          <p className="text-lg">No playlists yet</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">Create your first playlist</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {playlists.map((pl) => (
            <div key={pl._id} className="card group relative">
              <Link to={`/playlist/${pl._id}`}>
                <div className="aspect-video bg-gray-800 relative overflow-hidden">
                  {(pl.thumbnailUrl || pl.videos?.[0]?.video?.thumbnailUrl) ? (
                    <img src={pl.thumbnailUrl || pl.videos[0].video.thumbnailUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-4xl">
                      <ListVideo size={40} />
                    </div>
                  )}
                  <div className="absolute inset-y-0 right-0 w-1/3 bg-black/40 flex flex-col items-center justify-center">
                    <ListVideo size={20} className="mb-1" />
                    <span className="text-xs font-bold">{pl.videos?.length || 0}</span>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm line-clamp-2 group-hover:text-red-400 transition-colors">{pl.title}</h3>
                  <div className="flex items-center gap-1 mt-1 text-gray-500 text-xs">
                    {pl.visibility === 'public' ? <Globe size={12} /> : <Lock size={12} />}
                    <span>{pl.visibility === 'public' ? 'Public' : 'Private'}</span>
                  </div>
                </div>
              </Link>
              <button
                onClick={() => deleteMutation.mutate(pl._id)}
                className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreatePlaylistModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
