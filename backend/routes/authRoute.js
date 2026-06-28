const express = require('express');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

router.post('/login', async (req, res) => {
    const { email } = req.body;
    try {
        let user = await User.findOne({ email });.0
        if (!user) {
            user = new User({ email });
        }
        
        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Hash the OTP securely before storing to DB
        const salt = await bcrypt.genSalt(10);
        const hashedOtp = await bcrypt.hash(otp, salt);

        user.otp = hashedOtp;
        user.otpExpiry = Date.now() + 10 * 60 * 1000; // 10 mins
        
        await user.save();
        
        // Send actual email using nodemailer
        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: `"TaskFlow Support" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Your TaskFlow Login OTP',
            text: `Your login OTP is: ${otp}`,
            html: `<h3>TaskFlow Login</h3><p>Your OTP is: <b style="font-size: 1.2rem;">${otp}</b></p><p>It is valid for 10 minutes.</p>`
        };

        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            await transporter.sendMail(mailOptions);
            console.log(`[REAL EMAIL] OTP sent to ${email}`);
        } else {
            console.log(`[SIMULATED EMAIL FALLBACK] OTP for ${email} is ${otp} (Please set EMAIL_USER and EMAIL_PASS in .env)`);
        }

        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/verify', async (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        if (user.otpExpiry < Date.now()) {
            return res.status(400).json({ error: 'Expired OTP' });
        }

        // Compare the raw OTP against the hashed OTP in the DB
        const isMatch = await bcrypt.compare(otp.toString(), user.otp);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }
        
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();
        
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
        
        res.status(200).json({ token, user: { email: user.email, id: user._id } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
