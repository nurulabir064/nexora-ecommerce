import jwt from 'jsonwebtoken';
import User from '../models/User.js';
export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.nexora_session;
    if (!token) return res.status(401).json({ message: 'Authentication required' });
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'nexora-api',
      audience: 'nexora-web',
      algorithms: ['HS256']
    });
    const user = await User.findById(payload.sub).select('name email role isActive sessionVersion');
    if (!user || !user.isActive || payload.sessionVersion !== user.sessionVersion) {
      return res.status(401).json({ message: 'Session is no longer valid' });
    }
    req.user = user;
    req.sessionToken = token;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }
}
export function requireRole(...roles) {
  return (req, res, next) => req.user && roles.includes(req.user.role)
    ? next()
    : res.status(403).json({ message: 'You do not have permission' });
}
