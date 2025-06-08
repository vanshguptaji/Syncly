const User = require('../models/User');
const path = require('path');
const fs = require('fs');

exports.updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No profile picture uploaded'
      });
    }
    
    const profilePicPath = `/uploads/profile-pictures/${path.basename(req.file.path)}`;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePic: profilePicPath },
      { new: true }
    ).select('-password');
    
    if (!user) {
      fs.unlinkSync(req.file.path);
      
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully',
      user
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Update profile picture error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating profile picture',
      error: error.message
    });
  }
};
