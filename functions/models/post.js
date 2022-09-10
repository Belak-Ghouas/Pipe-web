const mongoose = require("mongoose");

const model = mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },

  userId: {
    type: String,
    required: true,
  },

});

module.exports = new mongoose.model("Posts", model);
