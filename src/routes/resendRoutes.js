const express = require("express");
const { sendCode, verifyCode } = require("../controllers/resendEmailController");
const { resendLimiter } = require("../middleware/rateLimiter")

const router = express.Router();

router.post("/send", resendLimiter, sendCode);
router.post("/verify", verifyCode);

module.exports = router