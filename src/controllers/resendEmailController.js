const bcrypt = require("bcryptjs");
const VerificationCode = require("../models/VerificationCode");
const { asyncHandler } = require('../middleware/errorHandler');
const { sendVerificationCodeEmail } = require("../services/resendEmailService");

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const EXPIRES_AFTER_MS = 10 * 60 * 1000;

const sendCode = asyncHandler(async (req, res) => {
  const { firstName, companyName, receiverEmail } = req.body;

  if (!receiverEmail) {
    return res.status(400).json({ success: false, message: "email manquant" });
  }
  if (!firstName) {
    return res.status(400).json({ success: false, message: "Nom manquant" });
  }

  const email = receiverEmail.toLowerCase().trim();
  const verificationCode = generateVerificationCode();
  const hashedCode = await bcrypt.hash(verificationCode, 10);

  await VerificationCode.create({ email, code: hashedCode });

  await sendVerificationCodeEmail(email, {
    verificationCode,
    firstName,
    companyName,
  });

  setTimeout(async () => {
    try {
      await VerificationCode.findOneAndUpdate({ email }, { code: null });
    } catch (err) {
      console.error("Failed to clear expired verification code:", err);
    }
  }, EXPIRES_AFTER_MS);

  return res.json({
    success: true,
    message: "Le code a été envoyé avec succès",
    ...(process.env.NODE_ENV !== "production" ? { dev: verificationCode } : {}),
  });
});

module.exports = { sendCode };
