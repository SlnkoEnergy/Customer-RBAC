  const mongoose = require("mongoose");

  const moduleSchema = new mongoose.Schema({
    name: String,
    description: String,
    type: {
      type: String,
      enum:["sidebar", "menu"]
    }
  });

  module.exports = mongoose.model("CustomerModule", moduleSchema);
