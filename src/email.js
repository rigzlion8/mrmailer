const nodemailer = require("nodemailer");
const { SMTP, PROFILE } = require("./config");
const fs = require("fs");


function transporter() {
// Try different configurations based on the host
const config = {
host: SMTP.host,
port: Number(SMTP.port),
secure: SMTP.secure === true || SMTP.secure === "true",
auth: {
user: SMTP.user,
pass: SMTP.pass
},
connectionTimeout: 60000, // 60 seconds
greetingTimeout: 30000,   // 30 seconds
socketTimeout: 60000,     // 60 seconds
};

// Add TLS configuration for Gmail
if (SMTP.host === 'smtp.gmail.com') {
config.tls = {
  rejectUnauthorized: false,
  ciphers: 'SSLv3'
};
// Try port 465 with SSL for Gmail
if (SMTP.port == 587) {
  config.port = 465;
  config.secure = true;
}
}

console.log(`[email] 🔧 SMTP Config: ${config.host}:${config.port} (secure: ${config.secure})`);
return nodemailer.createTransport(config);
}


async function sendEmail({ to, subject, text, attachCV = true }) {
console.log(`[email] 🚀 Starting email send to ${to}`);
console.log(`[email] 📧 Subject: ${subject}`);
console.log(`[email] 📝 Body length: ${text.length} characters`);

const tx = transporter();
const attachments = [];

if (attachCV && PROFILE.attachCV && PROFILE.cvPath) {
console.log(`[email] 📎 Checking CV attachment: ${PROFILE.cvPath}`);
if (fs.existsSync(PROFILE.cvPath)) {
attachments.push({ filename: PROFILE.cvPath.split("/").pop(), path: PROFILE.cvPath });
console.log(`[email] ✅ CV attached: ${PROFILE.cvPath.split("/").pop()}`);
} else {
console.warn(`[email] ❌ CV file not found at ${PROFILE.cvPath} - continuing without attachment`);
}
} else {
console.log(`[email] 📎 CV attachment disabled or not configured`);
}

console.log(`[email] 📤 Sending via ${SMTP.host}:${SMTP.port} from ${SMTP.fromEmail}`);
try {
  const info = await tx.sendMail({
    from: `${SMTP.fromName} <${SMTP.fromEmail}>`,
    to,
    subject,
    text,
    attachments
  });

  console.log(`[email] ✅ Email sent successfully`);
  console.log(`[email] 📧 Message ID: ${info.messageId}`);
  console.log(`[email] 📬 Response: ${info.response}`);
  return info;
} catch (error) {
  console.error(`[email] ❌ Failed to send email:`, error.message);
  console.error(`[email] ❌ Error details:`, error);
  throw error;
}
}


module.exports = { sendEmail };