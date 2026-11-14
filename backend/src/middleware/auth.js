import jwt from 'jsonwebtoken';
import User from '../models/User.js';
export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.nexora_session;
    if (!token) return res.status(401).json({ message: 'Authentication required' });
    const payload = jwt.verify(token, process.env.JWT_SECRET, { issuer: 'nexora-api', audience: 'nexora-web' });
    const user = await User.findById(payload.sub).select('name email role isActive');
    if (!user || !user.isActive) return res.status(401).json({ message: 'Session is no longer valid' });
    req.user = user;
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
