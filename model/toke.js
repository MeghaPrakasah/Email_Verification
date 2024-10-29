const mongoose = require("mongoose");
// Token schema for storing user verification tokens
const tokenschema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserDetails', // Reference to the 'UserDetails' model
        required: true
    },
    token: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600
    } // Token will expire in 1 hour (3600 seconds)
});
const Token = mongoose.model("Token", tokenschema);
module.exports = Token;