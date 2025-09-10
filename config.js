/** @format */

const JWT_SECRET = process.env.JWT_SECRET || 'your-production-jwt-secret-here';
const PORT = process.env.PORT || 3000;
const HCAPTCHA_SECRET = process.env.HCAPTCHA_SECRET || "0x0000000000000000000000000000000000000000";
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bloxpvp_casino';
const TRANSACTION_SECRET = process.env.TRANSACTION_SECRET || "your-production-transaction-secret";
const XP_CONSTANT = process.env.XP_CONSTANT || 0.04;

module.exports = {
  JWT_SECRET,
  HCAPTCHA_SECRET,
  PORT,
  MONGODB_URI,
  TRANSACTION_SECRET,
  XP_CONSTANT,
};
