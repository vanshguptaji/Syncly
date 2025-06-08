# Syncly

A real-time chat application with secure authentication, user management, and messaging features.

## Security Features

### HTTPS Support
Syncly now supports HTTPS for secure communication. To use HTTPS:

1. Generate SSL certificates:
   ```
   npm run ssl:gen
   ```

2. Start the server with HTTPS support:
   ```
   npm run dev:secure
   ```

### Secure Authentication
- OTP-based email verification
- JWT token-based authentication
- Secure cookies with httpOnly and secure flags
- HTTPS-only in production

### Password Security
- Password strength validation (8+ chars, uppercase, lowercase, numbers, special chars)
- Bcrypt password hashing
- OTP expires after 1 minute for enhanced security
- Manual OTP renewal required after expiration

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables in `.env` file:
   ```
   PORT=3000
   HTTPS_PORT=3443
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   FRONTEND_URL=https://localhost:5173
   
   # SSL Configuration
   SSL_KEY_PATH=./ssl/key.pem
   SSL_CERT_PATH=./ssl/cert.pem
   
   # Email Configuration
   EMAIL_SERVICE=gmail
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   ```

3. Generate SSL certificates:
   ```
   npm run ssl:gen
   ```

4. Start the development server:
   ```
   npm run dev:secure
   ```