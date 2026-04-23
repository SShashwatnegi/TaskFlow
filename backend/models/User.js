const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    otp: {
        type: String,
    },
    otpExpiry: {
        type: Date,
    },
    pushSubscriptions: {
        type: Array,
        default: []
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
