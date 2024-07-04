const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = 8007;

app.use(bodyParser.json());

const allowedOrigins = ['http://localhost:3000', 'https://viewassignmentfrontend.vercel.app'];

app.use(cors({
  origin: function(origin, callback){
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1){
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

const mongoURI = 'mongodb+srv://parthmanocha2901:nM1f3T9HLQItVAqQ@cluster0.ecvzxuo.mongodb.net/assignment?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

app.get('/', (req, res) => {
  res.json({ message: 'Dev Here! Started' });
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
