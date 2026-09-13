const express = require("express");
const { sendCode } = require("../controllers/resendEmailController");
const { resendLimiter } = require("../middleware/rateLimiter")

const router = express.Router();

router.post("/send", resendLimiter, sendCode);

module.exports = router