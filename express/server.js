require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bookRoutes = require('./Routes/bookRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/LibraryDB';

// Middleware
app.use(express.json());

// MongoDB connection
mongoose.connect(DATABASE_URL)
  .then(() => console.log('Connected to MongoDB LibraryDB'))
  .catch((err) => console.error('Database connection error:', err.message));

// Mount routes
app.use('/api/books', bookRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'Library Book Management API' });
});

app.listen(PORT, () => {
  console.log(`Server is actively running on port ${PORT}`);
});
