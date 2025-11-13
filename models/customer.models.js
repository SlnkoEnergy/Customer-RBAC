const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
  name: { type: String, trim: true, required: true },
  username: { type: String, trim: true, unique: true },
  email: { type: String, trim: true, unique: true, required: true },
  password: { type: String, required: true },
  company: {
    type: String,
  },
  phone: [
    {
      type: String,
    },
  ],
  roles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Role" }],
  otp: {
    type: Number,
    trim: true,
    default: null,
  },
  dob: {
    type: Date,
  },
  language: {
    type: String,
  },
  appearance: {
    font: {
      type: String,
    },
    theme: {
      type: String,
    },
  },
  sidebar: [
    {
      name: {
        type: String,
      },
      type: {
        type: String,
      },
    },
  ],
  layout: {
    type: String,
  },
  direction: {
    type: String,
  },
  location: {
    village: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
  },
  urls: [
    {
      type: String,
    },
  ],
  about: {
    type: String,
  },
  profile_url: {
    type: String,
  },
});

module.exports = mongoose.model("Customer", customerSchema);
