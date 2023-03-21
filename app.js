const express = require('express');
const app = express();
require('dotenv').config();
const mongoose = require("mongoose");
mongoose.set('strictQuery', false);
const mongoDB = process.env.MONGO_URL;

main().catch(err => console.log(err));
async function main() {
    await mongoose.connect(mongoDB);
}

app.get('/', (req, res) => {
    res.send("Hello world!");
});

app.listen(3000, () => {
    console.log("App listening on port 3000");
});