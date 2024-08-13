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
      course: course.toUpperCase(),
      branch: branch.toUpperCase(),
      year: year.toUpperCase(),
      subject: subject.toUpperCase(),
      fileUrl: `/uploads/${req.file.filename}`,
      uploadedBy: req.user.id,
      college: req.user.college.toUpperCase()
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
    let assignments;
    if (req.user.role === 'admin') {
      // If user is admin, fetch all assignments
      assignments = await Assignment.find().populate('uploadedBy', 'email college');
    } else {
      // If user is not admin, fetch only assignments from their college
      assignments = await Assignment.find({ college: req.user.college }).populate('uploadedBy', 'email college');
    }
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
    const filePath = path.join(__dirname, '..', 'uploads', req.params.filename);
    
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
// Delete assignment route (admin only)
router.delete('/assignments/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Delete the file from the server
    const filePath = path.join(__dirname, '..', assignment.fileUrl);
    try {
      await fs.unlink(filePath);
    } catch (unlinkError) {
      console.error('Error deleting file:', unlinkError);
      // If the file doesn't exist, we'll just log it and continue
    }

    // Delete the assignment from the database
    await Assignment.findByIdAndDelete(req.params.id);

    res.json({ message: 'Assignment deleted successfully' });
  } catch (err) {
    console.error('Delete assignment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// Update assignment route (admin only)
router.put('/assignments/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { course, branch, year, subject,college } = req.body;
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    assignment.course = course.toUpperCase();
    assignment.branch = branch.toUpperCase();
    assignment.year = year.toUpperCase();
    assignment.subject = subject.toUpperCase();
    assignment.college = college.toUpperCase();

    await assignment.save();

    res.json({ message: 'Assignment updated successfully', assignment });
  } catch (err) {
    console.error('Update assignment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.get('/assignments/:id', verifyToken, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate('uploadedBy', 'email college');
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    if (req.user.role !== 'admin' && assignment.college !== req.user.college) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(assignment);
  } catch (err) {
    console.error('Fetch assignment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
