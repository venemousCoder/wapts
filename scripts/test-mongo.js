const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/wapts_dev')
  .then(() => {
    console.log("Connected successfully to standalone.");
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
