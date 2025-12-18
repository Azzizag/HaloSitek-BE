const multer = require('multer');
const FileUploadHelper = require('../utils/file-upload-helper');

const uploadArsipediaImage = multer({
  storage: FileUploadHelper.getStorage('arsipedia_images'),
  fileFilter: FileUploadHelper.imageFilter,
  limits: {
    fileSize: FileUploadHelper.getMaxFileSize(),
  },
}).single('image'); // field name = image

module.exports = {
  uploadArsipediaImage,
};
