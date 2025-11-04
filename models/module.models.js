const mongoose = require("mongoose");

const moduleSchema = new mongoose.Schema({
  name: String,
  description: String,
});

module.exports = mongoose.model("Module", moduleSchema);
