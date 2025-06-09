// Add resendOTP endpoint to authController.js
exports.resendOTP = async (req, res) => {
  try {
    const { email, otpType } = req.body;

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Determine OTP type
    const type = otpType === 'password-reset' ? 'Password Reset OTP' : 'Registration OTP';
    
    // Generate and send new OTP
    const otp = generateOTP(email);
    const emailResult = await sendOTPEmail(email, otp, type);

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email',
        error: emailResult.error
      });
    }

    return res.status(200).json({
      success: true,
      message: `New ${type} has been sent to your email`,
      email
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error resending OTP',
      error: error.message
    });
  }
};
