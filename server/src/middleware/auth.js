import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    // Fallback to cookie if present
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id).populate('employee');
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }
    if (!user.isActive) {
      return res.status(401).json({ message: 'User account is deactivated' });
    }
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ message: 'Not authorized, invalid token' });
  }
};

// Check permissions middleware
export const checkPermission = (feature, action) => {
  return (req, res, next) => {
    const { role } = req.user;

    // SuperAdmin has full access to everything
    if (role === 'SuperAdmin') {
      return next();
    }

    switch (feature) {
      case 'employees':
        if (action === 'view') {
          if (role === 'HRManager' || role === 'TeamManager') return next();
        }
        if (action === 'create' || action === 'edit') {
          if (role === 'HRManager') return next();
        }
        break;

      case 'attendance':
        if (action === 'view_all' || action === 'manage') {
          if (role === 'HRManager' || role === 'TeamManager') return next();
        }
        if (action === 'mark' || action === 'view_own') {
          return next(); // Everyone
        }
        break;

      case 'leaves':
        if (action === 'apply' || action === 'view_own') {
          return next(); // Everyone
        }
        if (action === 'approve' || action === 'view_all') {
          if (role === 'HRManager' || role === 'TeamManager') return next();
        }
        break;

      case 'payroll':
        if (action === 'process' || action === 'manage') {
          if (role === 'HRManager') return next();
        }
        if (action === 'view_own') {
          return next(); // Everyone
        }
        break;

      case 'recruitment':
        if (action === 'manage' || action === 'post_jobs') {
          if (role === 'HRManager') return next();
        }
        if (action === 'view') {
          if (role === 'HRManager' || role === 'TeamManager') return next();
        }
        break;

      case 'performance':
        if (action === 'manage_cycle') {
          if (role === 'HRManager') return next();
        }
        if (action === 'review' || action === 'goals') {
          return next(); // Everyone can participate in reviews and manage own goals
        }
        break;

      case 'settings':
        if (action === 'manage') {
          // Only SuperAdmin (already handled above, but here for completeness)
          if (role === 'SuperAdmin') return next();
        }
        break;

      case 'reports':
        if (action === 'view_all') {
          if (role === 'HRManager' || role === 'TeamManager') return next();
        }
        if (action === 'view_own') {
          return next(); // Everyone
        }
        break;

      default:
        break;
    }

    return res.status(403).json({ message: `Access denied. Role '${role}' is not authorized to perform '${action}' on '${feature}'` });
  };
};
