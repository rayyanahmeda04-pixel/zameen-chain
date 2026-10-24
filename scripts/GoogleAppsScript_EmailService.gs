/**
 * =========================================================================
 * ZameenChain - Google Apps Script Email OTP Dispatcher
 * =========================================================================
 * 
 * INSTRUCTIONS TO DEPLOY IN 1 MINUTE:
 * 1. Go to https://script.google.com
 * 2. Click "New project"
 * 3. Delete existing code and paste this entire file
 * 4. Click "Deploy" -> "New deployment"
 * 5. Select type: "Web app"
 *    - Description: "ZameenChain Email Verification"
 *    - Execute as: "Me" (your Google account)
 *    - Who has access: "Anyone" (Crucial for frontend fetch)
 * 6. Click "Deploy" and authorize permissions.
 * 7. Copy the "Web app URL" (starts with https://script.google.com/macros/s/...)
 * 8. Paste it in your frontend/.env:
 *    VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/.../exec
 * =========================================================================
 */

function doGet(e) {
  return handleRequest(e ? e.parameter : {});
}

function doPost(e) {
  var params = {};
  if (e && e.postData && e.postData.contents) {
    try {
      params = JSON.parse(e.postData.contents);
    } catch (err) {
      params = e.parameter || {};
    }
  } else if (e && e.parameter) {
    params = e.parameter;
  }
  return handleRequest(params);
}

function handleRequest(params) {
  try {
    var email = params.email;
    var code = params.code || params.otp;
    var name = params.name || "Karachi Citizen";

    if (!email || !code) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Missing email or code parameter."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var subject = "🏛️ ZameenChain: Your Email Verification Code is " + code;

    var htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; background-color: #0b1329; color: #f1f5f9; padding: 32px; border-radius: 20px; border: 1px solid #1e293b;">
        
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; background: linear-gradient(135deg, #059669, #14b8a6); border-radius: 14px; font-size: 24px;">
            🏛️
          </div>
          <h2 style="margin: 12px 0 4px 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
            ZameenChain Karachi
          </h2>
          <p style="margin: 0; color: #94a3b8; font-size: 13px;">
            Decentralized Cadastre & Land Title Verification System
          </p>
        </div>

        <div style="background-color: #111e38; border: 1px solid #1e3a5f; padding: 24px; border-radius: 16px; text-align: center; margin-bottom: 24px;">
          <p style="margin: 0 0 12px 0; font-size: 14px; color: #cbd5e1;">
            Hello <strong>${name}</strong>,
          </p>
          <p style="margin: 0 0 20px 0; font-size: 13px; color: #94a3b8; line-height: 1.5;">
            Please enter the following 6-digit verification code to authenticate your email address and complete registration:
          </p>

          <div style="display: inline-block; background-color: #05192d; border: 2px dashed #0284c7; padding: 14px 28px; border-radius: 12px; margin-bottom: 12px;">
            <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #38bdf8;">
              ${code}
            </span>
          </div>

          <p style="margin: 8px 0 0 0; font-size: 11px; color: #64748b;">
            ⏱️ This security code is valid for 10 minutes.
          </p>
        </div>

        <div style="border-top: 1px solid #1e293b; padding-top: 20px; font-size: 11px; color: #64748b; line-height: 1.6; text-align: center;">
          <p style="margin: 0;">
            Security Notice: Never share this OTP with anyone. Government of Sindh officials will never ask for your verification code.
          </p>
          <p style="margin: 8px 0 0 0; color: #475569;">
            Government of Sindh • Karachi Development Authority (KDA) • ZameenChain Protocol
          </p>
        </div>

      </div>
    `;

    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: htmlBody
    });

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Verification email sent to " + email
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
