const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { generateOTP, sendOTPEmail, verifyOTP } = require('../utils/otpUtils');
const { isValidEmail, isValidPassword, getPasswordValidationErrors } = require('../utils/validationUtils');

exports.registerOTP = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    if (!isValidPassword(password)) {
      const errors = getPasswordValidationErrors(password);
      return res.status(400).json({
        success: false,
        message: 'Password does not meet requirements',
        errors
      });
    }

    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      if (existingUser.email === email && !existingUser.isVerified) {
        const otp = generateOTP(email);
        await sendOTPEmail(email, otp, 'Registration OTP');
        
        return res.status(200).json({
          success: true,
          message: 'OTP has been sent to your email',
          userId: existingUser._id
        });
      }
      
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email or username already exists' 
      });
    }    const user = new User({
      username,
      email,
      password,
      isVerified: false
    });
    await user.save();

    const otp = generateOTP(email);
    const emailResult = await sendOTPEmail(email, otp, 'Registration OTP');

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email',
        error: emailResult.error
      });
    }

    return res.status(201).json({
      success: true,
      message: 'OTP has been sent to your email',
      userId: user._id
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error during registration process',
      error: error.message
    });
  }
};

exports.verifyAndRegister = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    const otpVerification = verifyOTP(email, otp);
    
    if (!otpVerification.valid) {
      return res.status(400).json({
        success: false,
        message: otpVerification.message,
        expired: otpVerification.expired || false
      });
    }
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    user.isVerified = true;
    await user.save();
      const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '30d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, 
      secure: process.env.NODE_ENV === 'production' || req.secure,
      sameSite: 'strict'
    });

    const userToReturn = { ...user.toObject() };
    delete userToReturn.password;

    return res.status(200).json({
      success: true,
      message: 'Registration completed successfully',
      user: userToReturn,
      token
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    return res.status(500).json({      success: false,
      message: 'Error during OTP verification',
      error: error.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({        success: false,
        message: 'Invalid email or password'
      });
    }
      if (!user.isVerified) {
      // If account is not verified, inform the user they need to verify
      // but don't automatically send a new OTP
      return res.status(403).json({
        success: false,
        message: 'Account not verified. Please verify your account using the OTP sent during registration or request a new one.',
        requiresVerification: true,
        userId: user._id
      });
    }

    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    user.isOnline = true;
    user.lastSeen = Date.now();
    await user.save();    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '30d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, 
      secure: process.env.NODE_ENV === 'production' || req.secure,
      sameSite: 'strict'
    });

    const userToReturn = { ...user.toObject() };
    delete userToReturn.password;

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userToReturn,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

exports.logout = async (req, res) => {
  try {
    if (req.user) {
      const user = await User.findById(req.user.id);
      if (user) {
        user.isOnline = false;
        user.lastSeen = Date.now();
        await user.save();
      }
    }

    res.clearCookie('token');
    
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error logging out',
      error: error.message
    });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({      success: true,
      user
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching user data',
      error: error.message
    });
  }
};

exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User with this email does not exist'
      });
    }

    const otp = generateOTP(email);
    const emailResult = await sendOTPEmail(email, otp, 'Password Reset OTP');

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email',
        error: emailResult.error
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Password reset OTP has been sent to your email'
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing password reset request',
      error: error.message
    });
  }
};

exports.verifyPasswordResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }
    
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    const otpVerification = verifyOTP(email, otp);
    
    if (!otpVerification.valid) {
      return res.status(400).json({
        success: false,
        message: otpVerification.message,
        expired: otpVerification.expired || false
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully. You can now reset your password',
      email: email
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying OTP',
      error: error.message
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;
    
    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, new password, and confirm password are required'
      });
    }
    
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    if (!isValidPassword(newPassword)) {
      const errors = getPasswordValidationErrors(newPassword);
      return res.status(400).json({
        success: false,
        message: 'Password does not meet requirements',
        errors
      });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match'
      });
    }
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    user.password = newPassword;
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message
    });
  }
};

exports.resendOTP = async (req, res) => {
  try {
    const { email, otpType } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const type = otpType === 'password-reset' ? 'Password Reset OTP' : 'Registration OTP';
    
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
