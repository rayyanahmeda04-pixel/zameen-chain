const GAS_URL_KEY = "zameen_chain_gas_url";
const ACTIVE_OTP_KEY = "zameen_chain_active_otp";

export const DEFAULT_GAS_URL = "https://script.google.com/macros/s/AKfycbxKxzXovNSMnGUOR42nJ2tiZaflGvxsd3gVAlpXzt7MDFUJHLKOd_VViwaKVV2jZDUg/exec";

export function getGoogleScriptUrl() {
  const custom = localStorage.getItem(GAS_URL_KEY);
  if (custom && custom.trim()) return custom.trim();
  return import.meta.env.VITE_GOOGLE_SCRIPT_URL || DEFAULT_GAS_URL;
}

export function setGoogleScriptUrl(url) {
  if (!url) {
    localStorage.removeItem(GAS_URL_KEY);
  } else {
    localStorage.setItem(GAS_URL_KEY, url.trim());
  }
}

/**
 * Generate a 6-digit OTP and send it via Google Apps Script (if configured)
 * Always keeps active OTP in session for immediate verification.
 */
export async function sendVerificationOtp(email, name = "") {
  const cleanEmail = email.trim().toLowerCase();
  
  // Generate random 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // 10 minutes expiry
  const otpData = {
    email: cleanEmail,
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000
  };
  localStorage.setItem(ACTIVE_OTP_KEY, JSON.stringify(otpData));

  const scriptUrl = getGoogleScriptUrl();
  let sentViaScript = false;
  let scriptError = null;

  if (scriptUrl) {
    try {
      // Use GET with query parameters and mode: 'no-cors'
      // This reliably handles Google Apps Script 302 redirects without browser CORS blocks
      const endpoint = new URL(scriptUrl);
      endpoint.searchParams.append('email', cleanEmail);
      endpoint.searchParams.append('code', otp);
      endpoint.searchParams.append('name', name || 'User');
      endpoint.searchParams.append('_t', Date.now().toString());

      await fetch(endpoint.toString(), {
        method: 'GET',
        mode: 'no-cors'
      });
      sentViaScript = true;
      console.log(`[EmailService] OTP ${otp} dispatched via Google Apps Script to: ${cleanEmail}`);
    } catch (err) {
      console.warn("[EmailService] Google Script dispatch notice:", err);
      scriptError = err.message;
    }
  } else {
    console.log(`[EmailService] Local simulation: OTP for ${cleanEmail} is [${otp}]`);
  }

  return {
    success: true,
    email: cleanEmail,
    otp,
    sentViaScript,
    scriptError
  };
}

/**
 * Verify entered 6-digit code against active OTP
 */
export function verifyOtp(email, enteredCode) {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = enteredCode.trim();

  const raw = localStorage.getItem(ACTIVE_OTP_KEY);
  if (!raw) {
    return { valid: false, message: "No verification code requested. Please request a code first." };
  }

  try {
    const data = JSON.parse(raw);
    if (data.email !== cleanEmail) {
      return { valid: false, message: "Email mismatch. Please request a new code." };
    }

    if (Date.now() > data.expiresAt) {
      return { valid: false, message: "Verification code has expired. Please click Resend Code." };
    }

    if (data.otp !== cleanCode) {
      return { valid: false, message: "Incorrect verification code. Please check your email and try again." };
    }

    // Code is valid! Clear used OTP
    localStorage.removeItem(ACTIVE_OTP_KEY);
    return { valid: true };
  } catch (e) {
    return { valid: false, message: "Error verifying code. Please try again." };
  }
}
