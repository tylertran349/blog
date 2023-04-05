const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
    content: {type: String, required: true},
    date: {type: Date, required: true},
    liked_by: [{type: Schema.Types.ObjectId, ref: "User", required: true}],
    user: {type: Schema.Types.ObjectId, ref: "User", required: true},
    post: {type: Schema.Types.ObjectId, ref: "Post", required: true},
});

module.exports = mongoose.model("Comment", CommentSchema);