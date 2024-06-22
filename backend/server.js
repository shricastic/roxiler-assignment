const express = require('express');
const app = express();
const bodyParser = require('body-parser');
require('dotenv').config();

const PORT = process.env.PORT || 3001;
const connectDB = require('./config/db.js');

const userRoutes = require('./routes/userRoutes');

connectDB();

app.use('/', userRoutes);
app.use(bodyParser.json());

app.listen(PORT, ()=>{
  console.log(`server running on port ${PORT}`);
})
