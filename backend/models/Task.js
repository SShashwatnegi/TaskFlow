const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    title: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date
    },
    priority: {
        type: String,
        default: 'medium'
    },
    category: {
        type: String,
        default: 'task'
    },
    notes: {
        type: String,
        default: ''
    },
    done: {
        type: Boolean,
        default: false
    },
    remindersSent: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Task', taskSchema);
