const mongoose = require('mongoose');
require("dotenv").config();

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    contact:String,
    issuedBooks: [{
        bookName: String,
    }],
    numberOfIssuedBooks: Number,
    signedIn: Boolean
});

const User = new mongoose.model("User", userSchema);

module.exports = User;