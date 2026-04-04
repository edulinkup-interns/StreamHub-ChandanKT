import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Upload, X, Image } from 'lucide-react';
import toast from 'react-hot-toast';
import { videoApi } from '../../services/api';
import Spinner from '../../components/common/Spinner';

const categories = ['Technology', 'Education', 'Gaming', 'Music', 'Sports', 'News', 'Entertainment', 'Other'];

export default function UploadPage() {
  const navigate = useNavigate();
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const videoInputRef = useRef(null);
  const thumbInputRef = useRef(null);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const handleVideoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) return toast.error('Please select a video file');
    if (file.size > 500 * 1024 * 1024) return toast.error('Video must be under 500MB');
    setVideoFile(file);
  };

  const handleThumbnailSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Please select an image');
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('video/')) {
      setVideoFile(file);
    }
  };

  const onSubmit = async (data) => {
    if (!videoFile) return toast.error('Please select a video file');

    const formData = new FormData();
    formData.append('video', videoFile);
    if (thumbnailFile) formData.append('thumbnail', thumbnailFile);
    formData.append('title', data.title);
    formData.append('description', data.description || '');
    formData.append('category', data.category);
    formData.append('tags', data.tags || '');
    if (data.visibility) formData.append('visibility', data.visibility);

    try {
      setIsUploading(true);
      setUploadProgress(0);
      const res = await videoApi.upload(formData, setUploadProgress);
      toast.success('Video uploaded successfully!');
      navigate(`/watch/${res.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Upload Video</h1>

      {!videoFile ? (
        <div
          className="border-2 border-dashed border-gray-600 rounded-2xl p-16 text-center cursor-pointer hover:border-red-500 transition-colors"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => videoInputRef.current?.click()}
        >
          <Upload size={48} className="mx-auto text-gray-500 mb-4" />
          <p className="text-lg font-medium">Drag & drop or click to upload</p>
          <p className="text-gray-500 text-sm mt-2">MP4, MOV, AVI · Max 500MB</p>
          <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoSelect} />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Selected video */}
          <div className="bg-gray-900 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
              ▶
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{videoFile.name}</p>
              <p className="text-gray-500 text-xs">{(videoFile.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
            <button type="button" onClick={() => setVideoFile(null)} className="text-gray-500 hover:text-white">
              <X size={18} />
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              {...register('title', { required: 'Title is required', maxLength: { value: 100, message: 'Max 100 characters' } })}
              placeholder="Enter a descriptive title..."
              className="input-field"
            />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              {...register('description')}
              placeholder="Tell viewers about your video..."
              rows={4}
              className="input-field resize-none"
            />
          </div>

          {/* Category & Visibility */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category *</label>
              <select {...register('category', { required: 'Category is required' })} className="input-field">
                <option value="">Select category...</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <p className="text-red-400 text-xs mt-1">{errors.category.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Visibility</label>
              <select {...register('visibility')} className="input-field">
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-1">Tags</label>
            <input
              {...register('tags')}
              placeholder="tag1, tag2, tag3 (comma-separated)"
              className="input-field"
            />
          </div>

          {/* Thumbnail */}
          <div>
            <label className="block text-sm font-medium mb-2">Thumbnail</label>
            <div className="flex items-start gap-4">
              <button
                type="button"
                onClick={() => thumbInputRef.current?.click()}
                className="w-40 aspect-video rounded-xl border-2 border-dashed border-gray-600 hover:border-gray-500 flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-gray-400 transition-colors flex-shrink-0"
              >
                {thumbnailPreview
                  ? <img src={thumbnailPreview} alt="thumbnail" className="w-full h-full object-cover rounded-xl" />
                  : <><Image size={24} /><span className="text-xs">Upload thumbnail</span></>}
              </button>
              <input ref={thumbInputRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnailSelect} />
              {thumbnailPreview && (
                <button
                  type="button"
                  onClick={() => { setThumbnailFile(null); setThumbnailPreview(null); }}
                  className="text-gray-500 hover:text-red-400 text-sm transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* Upload progress */}
          {isUploading && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={isUploading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {isUploading ? <><Spinner /> Uploading...</> : <><Upload size={16} /> Upload</>}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
