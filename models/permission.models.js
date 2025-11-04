const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema({
  name: String,
  module: { type: mongoose.Schema.Types.ObjectId, ref: "Module" },
  access: [{ type: String, enum: ["create", "read", "update", "delete"] }],
});

module.exports = mongoose.model("Permission", permissionSchema);
