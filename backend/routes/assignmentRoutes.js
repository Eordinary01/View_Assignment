const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const mime = require('mime-types');
const Assignment = require('../models/Assignment');
const { verifyToken } = require('../middlewares/auth');
const fs = require('fs');
const stream = require('stream');
const util = require('util');
const pipeline = util.promisify(stream.pipeline);
const fsSync = require('fs');

// Set up multer for file uploads with file type validation
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPEG, and PNG are allowed.'));
  }
};

const upload = multer({ 
  storage: storage, 
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 } // 5MB file size limit
});

// File upload route
router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }
    const { course, branch, year, subject } = req.body;
    const assignment = new Assignment({
      course,
      branch,
      year,
      subject,
      fileUrl: `/uploads/${req.file.filename}`,
      uploadedBy: req.user.id,
    });
    await assignment.save();
    res.status(201).json({ message: 'Assignment uploaded successfully' });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Get all assignments route
router.get('/assignments', verifyToken, async (req, res) => {
  try {
    const assignments = await Assignment.find().populate('uploadedBy', 'email');
    res.json(assignments);
  } catch (err) {
    console.error('Fetch assignments error:', err);
    res.status(400).json({ error: err.message });
  }
});

// File download route
// const path = require('path');
// const mime = require('mime-types');
// const fs = require('fs').promises;

// File download route
router.get('/uploads/:filename', verifyToken, (req, res) => {
  try {
    const filePath = path.join(__dirname, '../uploads', req.params.filename);
    
    // Check if file exists synchronously
    fs.accessSync(filePath, fs.constants.F_OK);
    
    // Get the correct MIME type
    const mimeType = mime.lookup(filePath) || 'application/octet-stream';
    
    // Set the correct headers
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.filename}"`);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err) {
    console.error('File download error:', err);
    if (err.code === 'ENOENT') {
      res.status(404).json({ error: 'File not found' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

module.exports = router;
