const mongoose = require("mongoose")

const marketingSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    firstName: {
      type: String,
      trim: true
    },
    lastName: {
      type: String,
      trim: true
    },
  },
  { timestamps: true }
);
const marketing =  mongoose.model("Marketing")
module.exports = marketing