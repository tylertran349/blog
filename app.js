const express = require('express');
const app = express();
require('dotenv').config();
const mongoose = require("mongoose");
mongoose.set('strictQuery', false);
const mongoDB = process.env.MONGO_URL;
const routes = require('./routes');
const cors = require('cors');

app.use(cors());

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect(mongoDB);
}

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Add the "Access-Control-Allow-Origin" header to all responses, allowing any domain to access the API's resources
    next();
});

app.use(express.static('public'));

app.use('/users', routes.user);
app.use('/posts', routes.post);
app.use('/comments', routes.comment);

const port = process.env.PORT || 3000; // Use the PORT environment variable if it exists, otherwise, default to port 3000

app.listen(port, () => {
    console.log("App listening on port 3000");
});