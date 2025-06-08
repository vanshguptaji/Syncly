const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');
const { uploadProfilePicture } = require('../utils/uploadUtils');

router.post('/update-profile-picture', protect, uploadProfilePicture, profileController.updateProfilePicture);

module.exports = router;
