const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
    content: {type: String, required: true},
    date: {type: Date, required: true},
    likes: {type: Number, required: true},
    user: {type: Schema.Types.ObjectId, ref: "User", required: true},
    post: {type: Schema.Types.ObjectId, ref: "Post", required: true},
});

module.exports = mongoose.model("Comment", CommentSchema);