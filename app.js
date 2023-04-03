const express = require('express');
const app = express();
require('dotenv').config();
const mongoose = require("mongoose");
mongoose.set('strictQuery', false);
const mongoDB = process.env.MONGO_URL;
const routes = require('./routes');

main().catch(err => console.log(err));
async function main() {
    await mongoose.connect(mongoDB);
}

app.use(express.static('public'));

app.use('/users', routes.user);
app.use('/posts', routes.post);
app.use('/comments', routes.comment);

app.listen(3000, () => {
    console.log("App listening on port 3000");
});