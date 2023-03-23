const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {type: String, required: true},
    first_name: {type: String, required: true},
    last_name: {type: String, required: true},
    password: {type: String, required: true},
    liked_posts: [{type: Schema.Types.ObjectId, ref: "Post", required: true}],
    liked_comments: [{type: Schema.Types.ObjectId, ref: "Comment", required: true}],
});

module.exports = mongoose.model("User", UserSchema);