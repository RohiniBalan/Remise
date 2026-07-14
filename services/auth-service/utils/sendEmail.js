/**
 * Email utility — Nodemailer + Gmail SMTP
 * No third-party service account required; uses your own Gmail address.
 *
 * Required env vars (services/auth-service/.env):
 *   GMAIL_USER        — your Gmail address  (e.g. yourname@gmail.com)
 *   GMAIL_APP_PASSWORD — 16-char App Password from Google Account
 *                        (NOT your normal Gmail password)
 *
 * How to get an App Password (one-time, 2 min):
 *   1. Go to https://myaccount.google.com/security
 *   2. Enable "2-Step Verification" if not already on
 *   3. Search "App passwords" → select app: Mail, device: Other → Generate
 *   4. Copy the 16-char code → paste as GMAIL_APP_PASSWORD
 *
 * FRONTEND_URL — base URL of your Next.js app (http://localhost:3000 locally)
 */

const nodemailer = require('nodemailer');

// newly added dns
const dns = require('dns');

// ── Transporter (lazy-initialised so missing env vars don't crash boot) ───────
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass || pass === 'your_gmail_app_password_here') {
    return null; // email disabled — will log a warning per call
  }

  // _transporter = nodemailer.createTransport({
  //   service: 'gmail',
  //   auth: { user, pass },
  // });

  // return _transporter;

//   _transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: { user, pass },
// });

// _transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 587,
//   secure: false,
//   requireTLS: true,
//   auth: {
//     user,
//     pass,
//   },
//   family: 4,   // Force IPv4
// });

_transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user,
    pass,
  },
  tls: {
    rejectUnauthorized: false,
  },
  dnsLookup: (hostname, options, callback) => {
    dns.lookup(hostname, { family: 4 }, callback);
  },
});

// Verify SMTP connection
_transporter.verify((err, success) => {
  if (err) {
    console.error("❌ SMTP VERIFY ERROR:", err);
  } else {
    console.log("✅ SMTP Server is ready.");
  }
});

return _transporter;
}

// ── Low-level send ────────────────────────────────────────────────────────────
async function sendMail({ to, subject, html }) {
  const transporter = getTransporter();

  if (!transporter) {
    console.warn(
      '⚠️  [Email] GMAIL_USER / GMAIL_APP_PASSWORD not configured — email skipped.\n' +
      '   Set them in services/auth-service/.env to enable real emails.'
    );
    return;
  }

  await transporter.sendMail({
    from: `"${process.env.GMAIL_SENDER_NAME || 'Remise'}" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

// ── Shared HTML wrapper ───────────────────────────────────────────────────────
function emailWrapper(bodyHtml) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px">
      <table width="520" cellpadding="0" cellspacing="0"
             style="background:#fff;border-radius:16px;border:1px solid #e5e5e5;overflow:hidden">

        <!-- Header -->
        <tr>
          <td style="background:#FF0000;padding:20px 32px">
            <span style="font-size:26px;font-weight:900;color:#fff;letter-spacing:-1px">
              R<span style="color:#ffe0e0">E</span>mise
            </span>
          </td>
        </tr>

        <!-- Body -->
        <tr><td style="padding:32px">${bodyHtml}</td></tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9f9f9;padding:16px 32px;border-top:1px solid #eee;
                     font-size:11px;color:#aaa;text-align:center">
            © ${new Date().getFullYear()} Remise · You received this because you signed up at Remise.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// ── Email templates ───────────────────────────────────────────────────────────

/**
 * Send email-verification link after registration.
 */
async function sendVerificationEmail(toEmail, toName, token) {
  const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${token}`;

  // Always log to console — useful in dev even when email is not configured
  console.log(`\n🔗 [Email Verification] Link for ${toEmail}:\n   ${link}\n`);

  try {
    await sendMail({
      to: toEmail,
      subject: 'Verify your Remise account',
      html: emailWrapper(`
        <h2 style="margin:0 0 8px;font-size:22px;color:#111">Verify your email address</h2>
        <p style="color:#555;margin:0 0 24px;line-height:1.6">
          Hi <strong>${toName}</strong>, thanks for joining Remise!<br>
          Click the button below to confirm your email. The link expires in <strong>24 hours</strong>.
        </p>

        <div style="text-align:center;margin:28px 0">
          <a href="${link}"
             style="display:inline-block;background:#FF0000;color:#fff;font-weight:700;
                    font-size:15px;padding:14px 40px;border-radius:10px;text-decoration:none">
            Verify Email Address
          </a>
        </div>

        <p style="color:#999;font-size:12px;margin-top:24px;line-height:1.6">
          If the button doesn't work, paste this link into your browser:<br>
          <a href="${link}" style="color:#FF0000;word-break:break-all">${link}</a>
        </p>
        <p style="color:#ccc;font-size:11px;margin-top:16px">
          Didn't create an account? You can safely ignore this email.
        </p>
      `),
    });
    console.log(`✅ [Email] Verification email sent to ${toEmail}`);
  } catch (err) {
    console.error('❌ [Email] Failed to send verification email:', err.message);
  }
}

/**
 * Send password-reset link.
 */
async function sendPasswordResetEmail(toEmail, toName, token) {
  const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${token}`;

  console.log(`\n🔗 [Password Reset] Link for ${toEmail}:\n   ${link}\n`);

  try {
    await sendMail({
      to: toEmail,
      subject: 'Reset your Remise password',
      html: emailWrapper(`
        <h2 style="margin:0 0 8px;font-size:22px;color:#111">Reset your password</h2>
        <p style="color:#555;margin:0 0 24px;line-height:1.6">
          Hi <strong>${toName}</strong>, we received a password-reset request for your account.<br>
          This link expires in <strong>1 hour</strong>.
        </p>

        <div style="text-align:center;margin:28px 0">
          <a href="${link}"
             style="display:inline-block;background:#FF0000;color:#fff;font-weight:700;
                    font-size:15px;padding:14px 40px;border-radius:10px;text-decoration:none">
            Reset Password
          </a>
        </div>

        <p style="color:#999;font-size:12px;margin-top:24px;line-height:1.6">
          If the button doesn't work, paste this link into your browser:<br>
          <a href="${link}" style="color:#FF0000;word-break:break-all">${link}</a>
        </p>
        <p style="color:#ccc;font-size:11px;margin-top:16px">
          Didn't request a reset? Ignore this — your password stays unchanged.
        </p>
      `),
    });
    console.log(`✅ [Email] Password reset email sent to ${toEmail}`);
  } catch (err) {
    console.error('❌ [Email] Failed to send password reset email:', err.message);
  }
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
