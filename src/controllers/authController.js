const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { generateOTP, sendOTPEmail, verifyOTP } = require('../utils/otpUtils');

exports.registerOTP = async (req, res) => {
  try {
    const { username, email, password } = req.body;
=
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      if (existingUser.email === email && !existingUser.isVerified) {
        const otp = generateOTP(email);
        await sendOTPEmail(email, otp);
        
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
    }

    const user = new User({
      username,
      email,
      password,
      isVerified: false
    });

    await user.save();

    const otp = generateOTP(email);
    const emailResult = await sendOTPEmail(email, otp);

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
    
    const otpVerification = verifyOTP(email, otp);
    
    if (!otpVerification.valid) {
      return res.status(400).json({
        success: false,
        message: otpVerification.message
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
      secure: process.env.NODE_ENV === 'production',
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
    return res.status(500).json({
      success: false,
      message: 'Error during OTP verification',
      error: error.message
    });  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!user.isVerified) {
      const otp = generateOTP(email);
      await sendOTPEmail(email, otp);
      
      return res.status(403).json({
        success: false,
        message: 'Account not verified. A new OTP has been sent to your email.',
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
    await user.save();

    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '30d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, 
      secure: process.env.NODE_ENV === 'production',
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

    return res.status(200).json({
      success: true,
      user
    });  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching user data',
      error: error.message
    });
  }
};
