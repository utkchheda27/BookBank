const PORT = process.env.PORT || 3000;
const server = require("./index.js");
const mongoose=require("mongoose");
require('dotenv').config();

mongoose.connect("mongodb+srv://" + process.env.usernameMongoDB + ":" + process.env.password + "@cluster0.kb4v2ak.mongodb.net/test");

server.listen(PORT, function(){
    console.log('listening on port: ' + PORT);
});