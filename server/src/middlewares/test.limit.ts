// router.post("/register",
//   rateLimit(registerIpLimiter, ipKey),
//   validate(registerSchema, "body"),
//   rateLimit(registerEmailLimiter, emailKey),
//   authController.register);

// router.post("/resend-verification",
//   rateLimit(resendIpLimiter, ipKey),
//   validate(resendSchema, "body"),
//   rateLimit(resendCooldownLimiter, emailKey),   // 1/min
//   rateLimit(resendEmailLimiter, emailKey),      // 5/hour
//   authController.resendVerification);

// router.post("/forgot-password",
//   rateLimit(forgotIpLimiter, ipKey),
//   validate(forgotSchema, "body"),
//   rateLimit(forgotEmailLimiter, emailKey),
//   authController.forgotPassword);

// router.post("/verify-email",
//   rateLimit(verifyIpLimiter, ipKey),
//   validate(verifySchema, "body"),
//   rateLimit(verifyAttemptLimiter, emailKey),    // 5 guesses per account
//   authController.verifyEmail);

// router.post("/reset-password",
//   rateLimit(resetIpLimiter, ipKey),
//   validate(resetSchema, "body"),
//   authController.resetPassword);