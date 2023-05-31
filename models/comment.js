const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
    content: {type: String, required: true},
    date: {type: Date, required: true},
    liked_by: [{type: Schema.Types.Mixed, required: true}],
    user: {type: Schema.Types.Mixed, required: true},
    post: {type: Schema.Types.Mixed, required: true},
});

module.exports = mongoose.model("Comment", CommentSchema);