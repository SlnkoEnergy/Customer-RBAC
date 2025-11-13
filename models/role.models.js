const mongoose = require("mongoose");
const updateStatus = require("../utils/updateStatus");

const roleSchema = new mongoose.Schema(
  {
    name: String,
    permissions: [
      { type: mongoose.Schema.Types.ObjectId, ref: "CustomerPermission" },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    status_history: [
      {
        status: {
          type: String,
          enum: ["inactive", "active"],
        },
        customer_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Customer",
        },
        remarks: {
          type: String,
        },
      },
    ],
    current_status: {
      status: {
        type: String,
        enum: ["inactive", "active"],
      },
      customer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
      },
      remarks: {
        type: String,
      },
    },
    icon: {
      type: String,
      required: true,
    },
    company: {
      type: String,
    },
  },
  { timestamps: true }
);

roleSchema.pre("save", function (next) {
  updateStatus(this, "active");
  next();
});

module.exports = mongoose.model("CustomerRole", roleSchema);
