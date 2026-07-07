const QRCode = require('qrcode');

// Standard VPA shape: <local-part>@<bank/PSP handle>, e.g. 'merchant@upi'.
const UPI_ID_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

const isValidUpiId = (upiId) => typeof upiId === 'string' && UPI_ID_REGEX.test(upiId.trim());

// Builds the NPCI UPI Deep Link URI (upi://pay?pa=...&pn=...&cu=INR) — the
// standard scheme recognized by Google Pay, PhonePe, Paytm, and BHIM for a
// static "pay to this VPA" QR. No amount/transaction fields are included
// since this is a reusable store QR, not a per-order one.
const generateUpiQrDataUri = async (upiId, payeeName) => {
  const params = new URLSearchParams({
    pa: upiId.trim(),
    pn: payeeName || 'Store',
    cu: 'INR',
  });
  const upiUri = `upi://pay?${params.toString()}`;
  return QRCode.toDataURL(upiUri);
};

module.exports = { isValidUpiId, generateUpiQrDataUri };
