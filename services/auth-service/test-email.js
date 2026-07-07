require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

transporter.sendMail({
  from: `"Remise" <${process.env.GMAIL_USER}>`,
  to:   process.env.GMAIL_USER,   // send to yourself as a test
  subject: 'Nodemailer test ✅',
  text: 'Gmail + Nodemailer is working!',
}).then(() => {
  console.log('✅ Email sent successfully — check your inbox');
}).catch(err => {
  console.error('❌ Failed:', err.message);
});