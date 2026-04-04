const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

const uploadFromBuffer = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

const uploadVideo = async (buffer, folder = 'videos') => {
  return uploadFromBuffer(buffer, {
    resource_type: 'video',
    folder,
    eager: [
      { streaming_profile: 'full_hd', format: 'm3u8' },
    ],
    eager_async: true,
    transformation: [{ quality: 'auto' }],
  });
};

const uploadImage = async (buffer, folder = 'thumbnails') => {
  return uploadFromBuffer(buffer, {
    resource_type: 'image',
    folder,
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  });
};

const deleteResource = async (publicId, resourceType = 'image') => {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

module.exports = { uploadVideo, uploadImage, deleteResource };
