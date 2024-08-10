const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

//pass and user will be automatically created by passport mongoose
const userSchema = new Schema({
    email: {
        type: String,
        required: true
    }
});

UserSchema.plugin(passportLocalMongoose); 
//plugin used because it implements username password and hashing we don't need to build from scratch
module.exports = mongoose.model('User', userSchema);