var mongoose = require('mongoose');
mongoose.Promise  = require('bluebird');

var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;

var Schema = mongoose.Schema;

var UserSchema = new Schema({
    email: String,
    firstName: String,
    lastName: String,
    password: String
});

UserSchema.pre('save', function(next){  
    var user = this;
    if (!user.isModified('password')) return next();

    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt){
        if(err) return next(err);

        bcrypt.hash(user.password, salt, function(err, hash){
            if(err) return next(err);
            user.password = hash;
            next();
        });
    });
});

module.exports = mongoose.model('User', UserSchema);
