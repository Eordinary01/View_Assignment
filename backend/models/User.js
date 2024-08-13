const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  college: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin'], default: 'student' }
});

// Existing pre-save hook for password hashing
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// New pre-save hook for uppercase conversion
userSchema.pre('save', function(next) {
  if (this.isModified('name')) this.name = this.name.toUpperCase();
  if (this.isModified('email')) this.email = this.email.toUpperCase();
  if (this.isModified('college')) this.college = this.college.toUpperCase();
  next();
  
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);``