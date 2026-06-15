/**
 * middleware/authMiddleware.js
 * JWT authentication middleware.
 * Attaches the decoded user payload to req.user on success.
 * Returns 401 if token is missing or invalid.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // JWT is passed in the Authorization header as: "Bearer <token>"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Reject if no token provided
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    // Verify the token using our JWT secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the user object (minus password) to the request
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    next();
  } catch (err) {
    // Token is expired or tampered with
    return res.status(401).json({ message: 'Not authorized, token invalid' });
  }
};

module.exports = { protect };
