const nodemailer = require('nodemailer');

const sendEmail = async options => {
  // 1) Create Transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    //   service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PWD
    }
  });

  // 2) Define Email options
  const mailOptions = {
    from: 'Saman Arshad <saman.arshad97@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message
    // html:
  };
  // 3) Send email with nodemailer
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
