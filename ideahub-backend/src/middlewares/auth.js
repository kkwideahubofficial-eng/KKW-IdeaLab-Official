import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    let token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!token && req.query?.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: 'Server misconfiguration: missing JWT_SECRET' });
    }

    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = user; // attach user for downstream handlers
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export async function requireCoordinator(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  if (req.user.userType !== 'INTERNAL') {
    return res.status(403).json({ message: 'Access denied: Coordinators/Heads must be Internal users' });
  }
  // Allow coordinator, head, or admin
  const allowedRoles = ['coordinator', 'head', 'admin'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied: Coordinators/Heads only' });
  }
  return next();
}

export async function requireInternalUser(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  if (req.user.userType !== 'INTERNAL') {
    return res.status(403).json({ message: 'Access Restricted. This feature is available only for KK Wagh students.' });
  }
  return next();
}

export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    let token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!token && req.query?.token) {
      token = req.query.token;
    }

    if (!token) {
      return next();
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return next();
    }

    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (user) {
      req.user = user;
    }
    return next();
  } catch (err) {
    return next();
  }
}

export default { requireAuth, requireCoordinator, requireInternalUser, optionalAuth };

