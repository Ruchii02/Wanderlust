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

UserActivation.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);