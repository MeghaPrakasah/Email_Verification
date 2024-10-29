const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../model/model'); // Ensure path is correct
const Token = require('../model/toke'); // Ensure path is correct

const route = express.Router();

route.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: existingUser.isVerified ? 'Email already exists' : 'Email already exists. Verification pending.' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            isVerified: false
        });
        await newUser.save();

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const newToken = new Token({
            userId: newUser._id,
            token: verificationToken,
            createdAt: Date.now()
        });
        await newToken.save();

        // Verification URL
        const verificationUrl = `${req.protocol}://${req.get('host')}/main/verify/${newUser._id}/${verificationToken}`;

        // Mail transporter setup
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            }
        });

        // Email content
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: newUser.email,
            subject: 'Email Verification',
            text: `Please verify your email by clicking on the following link: ${verificationUrl}`,
            html: `<p>Please verify your email by clicking on the following link:</p><a href="${verificationUrl}">${verificationUrl}</a>`
        };

        try {
            await transporter.sendMail(mailOptions);
            res.status(201).json({ message: 'User registration successful. Verification email sent.', newUser });
        } catch (error) {
            console.error('Error sending email:', error.message);
            res.status(500).json({ error: `Error sending verification email: ${error.message}` });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});


route.get('/verify/:userId/:token', async (req, res) => {
    try {
        const { userId, token } = req.params;
        console.log(`Received verification request for userId: ${userId} with token: ${token}`);

        // Check if token exists
        const tokenRecord = await Token.findOne({ userId, token });
        if (!tokenRecord) {
            console.error('Token not found or expired.');
            return res.status(400).json({ error: 'Invalid or expired token' });
        }
        console.log('Token found:', tokenRecord);

        // Find user by userId
        const user = await User.findById(userId);
        if (!user) {
            console.error('User not found.');
            return res.status(404).json({ error: 'User not found' });
        }

        // Set user as verified
        user.isVerified = true;
        await user.save();
        console.log(`User ${user.username} is now verified:`, user.isVerified);

        // Delete the token after successful verification
        await Token.deleteOne({ _id: tokenRecord._id });
        console.log('Token deleted after successful verification.');

        res.status(200).json({ message: 'Email verified successfully' });
    } catch (error) {
        console.error(`Error during email verification: ${error.message}`);
        res.status(500).json({ error: 'Server error' });
    }
});



module.exports = route;
