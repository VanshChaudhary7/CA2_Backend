const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Book = require('../models/bookModel');

// Utility for availability
const parseAvailabilityFlag = (input) => {
    if (typeof input === 'boolean') return input;
    if (typeof input === 'string') {
        const val = input.trim().toLowerCase();
        if (['true', 'available', 'yes', '1'].includes(val)) return true;
        if (['false', 'unavailable', 'borrowed', 'no', '0'].includes(val)) return false;
    }
    return null;
};
//task1
router.post('/', async (req, res) => {
    try {
        const { title, author, category, availabilityStatus } = req.body;

        // Validate title presence
        if (!title || typeof title !== 'string' || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: 'A valid non-empty title is mandatory.'
            });
        }

        const bookData = {
            title: title.trim(),
            author: (author && typeof author === 'string' && author.trim()) ? author.trim() : 'Unknown Author',
            category: (category && typeof category === 'string' && category.trim()) ? category.trim() : 'General'
        };

        if (availabilityStatus !== undefined) {
            const parsedStatus = parseAvailabilityFlag(availabilityStatus);
            if (parsedStatus !== null) {
                bookData.availabilityStatus = parsedStatus;
            }
        }

        const createdBook = await Book.create(bookData);

        return res.status(201).json({
            success: true,
            message: 'Book record successfully added to catalogue.',
            book: createdBook
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to create book record.',
            error: error.message
        });
    }
});

// task2
router.get('/', async (req, res) => {
    try {
        const requestedPage = parseInt(req.query.page, 10);
        const requestedLimit = parseInt(req.query.limit, 10);

        const page = !isNaN(requestedPage) && requestedPage > 0 ? requestedPage : 1;
        const limit = !isNaN(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 100) : 10;
        const skipCount = (page - 1) * limit;

        const [books, totalRecords] = await Promise.all([
            Book.find().skip(skipCount).limit(limit).lean(),
            Book.countDocuments()
        ]);

        return res.status(200).json({
            success: true,
            currentPage: page,
            totalRecords,
            totalPages: Math.ceil(totalRecords / limit),
            limit,
            books
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Could not fetch book records.',
            error: error.message
        });
    }
});

// task3
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { availabilityStatus } = req.body;

        if (availabilityStatus === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Field "availabilityStatus" is required in request payload.'
            });
        }

        const validatedStatus = parseAvailabilityFlag(availabilityStatus);
        if (validatedStatus === null) {
            return res.status(400).json({
                success: false,
                message: 'Invalid availability status provided. Expected boolean or recognized keyword.'
            });
        }

        if (!mongoose.isValidObjectId(id)) {
            return res.status(404).json({
                success: false,
                message: `No book found matching identifier: ${id}`
            });
        }

        const updatedBook = await Book.findByIdAndUpdate(
            id,
            { $set: { availabilityStatus: validatedStatus } },
            { new: true, runValidators: true }
        );

        if (!updatedBook) {
            return res.status(404).json({
                success: false,
                message: `No book found matching identifier: ${id}`
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Book availability status successfully updated.',
            book: updatedBook
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Unable to update availability status.',
            error: error.message
        });
    }
});

module.exports = router;
