const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = 8007;

app.use(bodyParser.json());
app.use(cors({
  origin: 'https://viewassignmentfrontend.vercel.app/',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// // Set up multer for file uploads
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads/') // Make sure this directory exists
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + path.extname(file.originalname))
//   }
// });

// const upload = multer({ storage: storage });

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

const mongoURI = 'mongodb+srv://parthmanocha2901:nM1f3T9HLQItVAqQ@cluster0.ecvzxuo.mongodb.net/assignment?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

app.get('/',(req,res)=>{
    res.json({message:'Dev Here!Started'})
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

const authRoutes = require('./routes/authRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');

app.use('/auth', authRoutes);
app.use('/assignments', assignmentRoutes);

app.listen(PORT, () => {
  console.log(`Server running at ${PORT}`);
});