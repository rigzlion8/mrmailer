const nodemailer = require("nodemailer");
const { MAIL, PROFILE } = require("./config");
const fs = require("fs");


function transporter() {
return nodemailer.createTransport({
host: MAIL.host,
port: Number(MAIL.port),
secure: MAIL.secure === true || MAIL.secure === "true",
auth: {
user: MAIL.user,
pass: MAIL.pass
}
});
}


async function sendEmail({ to, subject, text, attachCV = true }) {
const tx = transporter();
const attachments = [];


if (attachCV && PROFILE.attachCV && PROFILE.cvPath) {
if (fs.existsSync(PROFILE.cvPath)) {
attachments.push({ filename: PROFILE.cvPath.split("/").pop(), path: PROFILE.cvPath });
} else {
console.warn(`[email] CV file not found at ${PROFILE.cvPath}`);
}
}


const info = await tx.sendMail({
from: `${MAIL.fromName} <${MAIL.fromEmail}>`,
to,
subject,
text,
attachments
});
return info;
}


module.exports = { sendEmail };