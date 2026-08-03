// OTP Storage in memory: mobile -> { otp, expiresAt, resendAvailableAfter, attempts }
const otpStore = new Map();

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute
const MAX_ATTEMPTS = 3; // 3 failed attempts locks it

/**
 * Generates a 6-digit random numeric OTP string.
 */
const generate6DigitOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP to the mobile number (mocked for development, logs to terminal).
 * @param {string} mobile - The customer mobile number with country code (e.g., '+919876543210')
 * @returns {Promise<object>} - Result of send operation
 */
const sendOTP = async (mobile) => {
  const cleanMobile = mobile.replace(/\s+/g, '');
  const now = Date.now();
  
  // Check cooldown
  const existing = otpStore.get(cleanMobile);
  if (existing && now < existing.resendAvailableAfter) {
    const waitSeconds = Math.ceil((existing.resendAvailableAfter - now) / 1000);
    return {
      success: false,
      message: `Please wait ${waitSeconds} seconds before requesting a new OTP.`
    };
  }

  // Generate OTP
  const otp = generate6DigitOTP();
  const expiresAt = now + OTP_EXPIRY_MS;
  const resendAvailableAfter = now + OTP_RESEND_COOLDOWN_MS;

  otpStore.set(cleanMobile, {
    otp,
    expiresAt,
    resendAvailableAfter,
    attempts: 0
  });

  // Production vs. Mock setup
  const useMock = process.env.USE_MOCK_OTP === 'true';

  if (useMock) {
    console.log(`[SMS MOCK] =======================================`);
    console.log(`[SMS MOCK] To: ${cleanMobile}`);
    console.log(`[SMS MOCK] Message: Your KHAMRAI BROILER CENTER verification OTP is: ${otp}`);
    console.log(`[SMS MOCK] Expiry: 5 minutes`);
    console.log(`[SMS MOCK] =======================================`);

    return {
      success: true,
      message: 'OTP sent successfully (Development Mock Mode). Check console.',
      otp: otp // Return OTP only in dev mode for easy automated verification
    };
  } else {
    // In production, trigger real SMS integration
    // Example: Twilio, Firebase Authentication verification or SMS Gateway APIs
    // For now, we will log to standard outputs and assume production config
    console.log(`[SMS PRODUCTION] Sending real SMS to ${cleanMobile}...`);
    
    // In production, we do not return the OTP to frontend.
    return {
      success: true,
      message: 'OTP has been sent to your mobile number.'
    };
  }
};

/**
 * Verifies the OTP submitted by the user.
 * @param {string} mobile - User's mobile number
 * @param {string} submittedOtp - The 6 digit string submitted
 * @returns {object} - Success boolean and failure message if any
 */
const verifyOTP = (mobile, submittedOtp) => {
  const cleanMobile = mobile.replace(/\s+/g, '');
  const record = otpStore.get(cleanMobile);
  const now = Date.now();

  if (!record) {
    return { success: false, message: 'No OTP requested for this mobile number.' };
  }

  // Check attempts limit
  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(cleanMobile);
    return { success: false, message: 'Too many incorrect attempts. Please request a new OTP.' };
  }

  // Check expiry
  if (now > record.expiresAt) {
    otpStore.delete(cleanMobile);
    return { success: false, message: 'OTP has expired. Please request a new one.' };
  }

  // Check matching
  if (record.otp === submittedOtp) {
    otpStore.delete(cleanMobile); // Burn OTP on successful verification
    return { success: true };
  } else {
    record.attempts += 1;
    otpStore.set(cleanMobile, record);
    const attemptsLeft = MAX_ATTEMPTS - record.attempts;
    return {
      success: false,
      message: `Incorrect OTP. You have ${attemptsLeft} attempts remaining.`
    };
  }
};

module.exports = {
  sendOTP,
  verifyOTP
};
