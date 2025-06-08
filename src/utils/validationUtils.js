// Email validation regex
// This checks for a valid email format with proper domain structure
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Password validation regex
// Requires at least:
// - 8 characters
// - One uppercase letter
// - One lowercase letter
// - One number
// - One special character
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

/**
 * Validates an email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if email is valid
 */
const isValidEmail = (email) => {
  return emailRegex.test(email);
};

/**
 * Validates a password
 * @param {string} password - Password to validate
 * @returns {boolean} True if password meets requirements
 */
const isValidPassword = (password) => {
  return passwordRegex.test(password);
};

/**
 * Gets detailed password validation errors
 * @param {string} password - Password to validate
 * @returns {string[]} Array of validation error messages
 */
const getPasswordValidationErrors = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one special character (@, $, !, %, *, ?, &)');
  }
  
  return errors;
};

module.exports = {
  isValidEmail,
  isValidPassword,
  getPasswordValidationErrors
};
