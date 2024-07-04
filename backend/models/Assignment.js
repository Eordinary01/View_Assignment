const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  course: { type: String, required: true },
  branch: { type: String, required: true },
  year: { type: String, required: true },
  subject: { type: String, required: true },
  fileUrl: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: true // This will add createdAt and updatedAt fields
});

const Assignment = mongoose.model('Assignment', assignmentSchema);

module.exports = Assignment;
