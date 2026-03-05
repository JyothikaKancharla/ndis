const jwt = require("jsonwebtoken");

/**
 * Authentication middleware with enhanced security
 * Verifies JWT token and validates user session
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers && req.headers.authorization;
  const token = authHeader ? authHeader.split(" ")[1] : null;
  
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: "No authentication token provided" 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user info to request
    req.user = {
      _id: decoded._id,
      id: decoded._id,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
      phone: decoded.phone,
      isActive: decoded.isActive
    };

    // Check if user is active
    if (!req.user.isActive) {
      return res.status(403).json({
        success: false,
        message: "User account is disabled"
      });
    }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: "Token has expired"
      });
    }
    return res.status(401).json({
      success: false,
      message: "Invalid or malformed token"
    });
  }
};

/**
 * Role-based access control (RBAC) middleware
 * Ensures user has required role(s)
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: This action requires one of the following roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Legacy wrapper for backward compatibility
 */
const authMiddleware = (allowedRoles = []) => {
  return (req, res, next) => {
    authenticate(req, res, () => {
      if (allowedRoles.length > 0) {
        authorize(...allowedRoles)(req, res, next);
      } else {
        next();
      }
    });
  };
};

module.exports = {
  authenticate,
  authorize,
  authMiddleware // Legacy export
};
