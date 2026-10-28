const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title must be provided'],
      trim: true
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
      default: 'Unknown Author'
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      default: 'General'
    },
    availabilityStatus: {
      type: Boolean,
      default: true
    },
    creationDate: {
      type: Date,
      default: Date.now
    }
  },
  {
    versionKey: false,
    autoIndex: false,
    autoCreate: false
  }
);

module.exports = mongoose.model('Book', bookSchema);
