const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
  name: String,
  permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Permission" }],
});

module.exports = mongoose.model("CustomerRole", roleSchema);
