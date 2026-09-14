const mongoose = require("mongoose");

const verificationCodeSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    resendTemplateId: {
      type: String,
      trim: true,
    },
    code: { type: String, default: null },
    codeCreatedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const VerificationCode = mongoose.model("VerificationCode", verificationCodeSchema);
module.exports = VerificationCode;
