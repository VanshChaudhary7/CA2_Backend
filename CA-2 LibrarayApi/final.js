const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/LibraryDB?directConnection=true';

app.use(express.json());
//esteblish connection
mongoose.connect(DB_URI)
  .then(() => console.log('Successfully connected to MongoDB LibraryDB'))
  .catch((connErr) => console.error('MongoDB connection error:', connErr.message));

// schema 
const bookRecordSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is mandatory'],
      trim: true
    },
    author: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true
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
  { versionKey: false }
);

const Book = mongoose.model('Book', bookRecordSchema);

// Helper function to parse and normalize availability input
function parseAvailability(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', 'available', 'yes', '1'].includes(normalized)) return true;
    if (['false', 'unavailable', 'borrowed', 'no', '0'].includes(normalized)) return false;
  }
  return null;
}
//task 1
app.post('/api/books', async (req, res) => {
  try {
    const { title, author, category, availabilityStatus } = req.body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: A valid non-empty book title must be provided.'
      });
    }

    const payload = {
      title: title.trim(),
      author: (author && typeof author === 'string' && author.trim()) ? author.trim() : 'Unknown Author',
      category: (category && typeof category === 'string' && category.trim()) ? category.trim() : 'Uncategorized'
    };

    if (availabilityStatus !== undefined) {
      const parsedStatus = parseAvailability(availabilityStatus);
      if (parsedStatus !== null) {
        payload.availabilityStatus = parsedStatus;
      }
    }

    const savedBook = await Book.create(payload);

    return res.status(201).json({
      success: true,
      message: 'Book entry registered successfully.',
      book: savedBook
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Unable to process book creation.',
      details: err.message
    });
  }
});
//task2
app.get('/api/books', async (req, res) => {
  try {
    const pageNumber = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const offset = (pageNumber - 1) * pageSize;

    const [bookList, totalRecords] = await Promise.all([
      Book.find().skip(offset).limit(pageSize).lean(),
      Book.countDocuments()
    ]);

    return res.status(200).json({
      success: true,
      currentPage: pageNumber,
      totalRecords,
      totalPages: Math.ceil(totalRecords / pageSize),
      limit: pageSize,
      books: bookList
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve book records.',
      details: err.message
    });
  }
});

// task 3
app.patch('/api/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { availabilityStatus } = req.body;

    // Validate availabilityStatus field presence
    if (availabilityStatus === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing parameter: availabilityStatus is required in the request body.'
      });
    }
    const normalizedStatus = parseAvailability(availabilityStatus);
    if (normalizedStatus === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status: availabilityStatus must be a boolean or a valid status indicator.'
      });
    }
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({
        success: false,
        message: `Book record not found with id: ${id}`
      });
    }

    const updatedRecord = await Book.findByIdAndUpdate(
      id,
      { $set: { availabilityStatus: normalizedStatus } },
      { returnDocument: 'after', runValidators: true }
    );

    if (!updatedRecord) {
      return res.status(404).json({
        success: false,
        message: `Book record not found with id: ${id}`
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Book availability status updated successfully.',
      book: updatedRecord
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update book record.',
      details: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Library Book Management API running at http://localhost:${PORT}`);
});
