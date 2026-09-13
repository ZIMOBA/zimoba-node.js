const mongoose = require("mongoose");

const verificationCodeSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
  },
  resendTemplateId: {
    type: String,
    trim: true
  },
  code: { type: String, default: null }
})

const verificationCode = mongoose.model("VerificationCode", verificationCodeSchema);
module.exports = verificationCode
