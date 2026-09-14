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

  await VerificationCode.findOneAndUpdate(
    { email },
    { $set: { code: hashedCode, codeCreatedAt: new Date() } },
    { upsert: true, new: true }
  );

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

const verifyCode = asyncHandler(async (req, res) => {
  const { receiverEmail, code } = req.body;

  if (!receiverEmail) {
    return res.status(400).json({ success: false, message: "email manquant" });
  }
  if (!code) {
    return res.status(400).json({ success: false, message: "Code manquant" });
  }

  const email = receiverEmail.toLowerCase().trim();

  const record = await VerificationCode.findOne({ email });

  if (!record || !record.code || !record.codeCreatedAt) {
    return res.status(400).json({ success: false, message: "Code invalide ou expiré" });
  }

  const isExpired = Date.now() - record.codeCreatedAt.getTime() > EXPIRES_AFTER_MS;

  if (isExpired) {
    await VerificationCode.findByIdAndUpdate(record._id, { code: null, codeCreatedAt: null });
    return res.status(400).json({ success: false, message: "Code expiré" });
  }

  const isMatch = await bcrypt.compare(code.trim(), record.code);

  if (!isMatch) {
    return res.status(400).json({ success: false, message: "Code invalide" });
  }

  await VerificationCode.findByIdAndUpdate(record._id, { code: null, codeCreatedAt: null });

  return res.json({ success: true, message: "Code vérifié avec succès" });
});

module.exports = { sendCode, verifyCode };
