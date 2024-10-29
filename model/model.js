const { default: mongoose } = require("mongoose");
const userschema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false }

})
const User = mongoose.model('UserDetails', userschema);
module.exports = User;
