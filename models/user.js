if (!process.env.MONGODB_URI) {
    require('dotenv').config();
}
const dns = require('dns');
try {
    dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
var Schema = mongoose.Schema;
if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => { console.log('Connected to MongoDB via Mongoose'); })
        .catch(err => { console.error('MongoDB connection error:', err); });
} else {
    console.error('MONGODB_URI is not defined in environment variables');
}
var db = mongoose.connection;
var UserSchema =  mongoose.Schema({
    email: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
        minlength: 3,
        trim: true,
        unique: true,
        index: true
    },
    display_name:{
        type: String,
        minlength:3,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 5
    },
    txtp: String,
    role: { type: String, default: 'user' },
    logged: String,
    bio: String,
    user_url:String,
    user_registered: {
    type: Date,
    default: Date.now
  }
});

var User = module.exports = mongoose.model('User', UserSchema);
module.exports.createUser = function(newUser, callback){
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(newUser.password, salt, function(err, hash) {
            // Store hash in your password DB. 
            newUser.password = hash;
            newUser.save(callback);
        });
    }); 
}
module.exports.getUserById = function(id, callback){
    User.findById(id, callback);
};

module.exports.getUserByUsername = function(username, callback){
    var query = {username: username};
    User.findOne(query, callback);

}
module.exports.comparePassword = function(candidatePassword, hash, callback){
    if (!hash) {
        return callback(null, false);
    }
    bcrypt.compare(candidatePassword, hash, function(err, isMatch){
        if (err) return callback(err);
        callback(null, isMatch);
    });
};