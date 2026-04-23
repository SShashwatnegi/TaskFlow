const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const { publicVapidKey } = require('../services/pushService');

const router = express.Router();

router.get('/vapid-public-key', (req, res) => {
    res.status(200).json({ publicKey: publicVapidKey });
});

router.post('/subscribe', authMiddleware, async (req, res) => {
    try {
        const { subscription } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        // Ensure no duplicates
        let exists = false;
        if (user.pushSubscriptions && user.pushSubscriptions.length > 0) {
            exists = user.pushSubscriptions.some(sub => sub.endpoint === subscription.endpoint);
        } else {
            user.pushSubscriptions = [];
        }
        
        if (!exists) {
            user.pushSubscriptions.push(subscription);
            await user.save();
        }
        res.status(201).json({ message: 'Subscribed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
