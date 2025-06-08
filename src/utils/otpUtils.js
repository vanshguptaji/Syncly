const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');

const otpStorage = {};

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

exports.generateOTP = (email) => {
  const otp = otpGenerator.generate(6, { 
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
    digits: true
  });
  
  otpStorage[email] = {
    otp,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000) 
  };
  
  return otp;
};

exports.verifyOTP = (email, otp) => {
  const otpData = otpStorage[email];
  
  if (!otpData) {
    return { valid: false, message: 'No OTP found for this email' };
  }
  
  if (new Date() > otpData.expiresAt) {
    delete otpStorage[email]; 
    return { valid: false, message: 'OTP has expired' };
  }
  
  if (otpData.otp !== otp) {
    return { valid: false, message: 'Invalid OTP' };
  }
  
  delete otpStorage[email];
  return { valid: true, message: 'OTP verified successfully' };
};

exports.sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Syncly - Your Registration OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #333;">Welcome to Syncly!</h2>
        <p>Thank you for registering with us. To complete your registration, please use the following OTP:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
          ${otp}
        </div>
        <p>This OTP is valid for 15 minutes.</p>
        <p>If you didn't request this OTP, please ignore this email.</p>
        <p style="margin-top: 30px; font-size: 12px; color: #777;">
          This is an automated email. Please do not reply to this email.
        </p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};
