const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Local Storage Provider
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = uploadDir;
    // Categorize uploads if possible based on fieldname
    if (file.fieldname === 'avatar') {
      folder = path.join(uploadDir, 'avatars');
    } else if (file.fieldname === 'csv') {
      folder = path.join(uploadDir, 'csvs');
    } else if (file.fieldname === 'transcript') {
      folder = path.join(uploadDir, 'transcripts');
    }

    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
    
    cb(null, folder);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'avatar') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      const err = new Error('Only images are allowed for avatars');
      err.status = 400;
      cb(err, false);
    }
  } else if (file.fieldname === 'csv') {
    if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      const err = new Error('Only CSV files are allowed');
      err.status = 400;
      cb(err, false);
    }
  } else {
    cb(null, true);
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: fileFilter
});

class StorageService {
  constructor() {
    this.upload = upload;
  }

  // Middleware factory for single file uploads
  single(fieldName) {
    return this.upload.single(fieldName);
  }

  getFileUrl(req, file) {
    // Basic local URL derivation
    if (!file) return null;
    let type = 'misc';
    if (file.fieldname === 'avatar') type = 'avatars';
    else if (file.fieldname === 'csv') type = 'csvs';
    else if (file.fieldname === 'transcript') type = 'transcripts';
    
    return `/uploads/${type}/${file.filename}`;
  }
}

module.exports = new StorageService();
