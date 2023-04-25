const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {type: String, required: true},
    first_name: {type: String, required: true},
    last_name: {type: String, required: true},
    password: {type: String, required: true},
    is_admin: {type: Boolean, required: true},
    posts: [{type: Schema.Types.ObjectId, ref: "Post", required: true}],
    comments: [{type: Schema.Types.ObjectId, ref: "Comment", required: true}],
});

module.exports = mongoose.model("User", UserSchema);