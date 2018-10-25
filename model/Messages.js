var mongoose = require('mongoose');
mongoose.Promise  = require('bluebird');

var Schema = mongoose.Schema;

var MessageSchema = new Schema({
    sEmail: String,
    rEmail: String,
    message: String,
    timestampSent: String,
    ipAddressSent: String,
    msgStatus: String,
});

// UserSchema.pre('save', function(next){
//     var user = this;
//     if (!user.isModified('password')) return next();
//
//     bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt){
//         if(err) return next(err);
//
//         bcrypt.hash(user.password, salt, function(err, hash){
//             if(err) return next(err);
//             user.password = hash;
//             next();
//         });
//     });
// });

module.exports = mongoose.model('Messages', MessageSchema);
