const express = require('express');
const chrono = require('chrono-node');
const Task = require('../models/Task');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Get all tasks for user
router.get('/', authMiddleware, async (req, res) => {
    try {
        const tasks = await Task.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create task with NLP parsing or direct payload
router.post('/', authMiddleware, async (req, res) => {
    try {
        let taskData = { ...req.body, user: req.user.id };

        // Fallback for Chrome Extension parsing
        if (req.body.rawText && !req.body.title) {
            const parsedResults = chrono.parse(req.body.rawText);
            let parsedDate = new Date();
            if (parsedResults.length > 0) {
                parsedDate = parsedResults[0].start.date();
            }
            taskData.title = req.body.rawText;
            taskData.date = parsedDate;
            taskData.endDate = new Date(parsedDate.getTime() + 60 * 60000); // 1 hour default
            taskData.done = false;
        }

        const task = new Task(taskData);
        await task.save();
        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update task
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const task = await Task.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { $set: req.body },
            { new: true }
        );
        if (!task) return res.status(404).json({ error: 'Task not found' });
        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete task
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        if (!task) return res.status(404).json({ error: 'Task not found' });
        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
