import { Router } from 'express';
import { z } from 'zod';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { issueCsrfToken } from '../middleware/csrf.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
const router = Router();
const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false });
const registerSchema = z.object({ name: z.string().trim().min(2).max(80), email: z.email().max(254), password: z.string().min(12).max(128) });
const loginSchema = z.object({ email: z.email().max(254), password: z.string().min(1).max(128) });
const cookieOptions = () => {
  const sameSite = process.env.COOKIE_SAME_SITE || 'lax';
  if (!['strict', 'lax', 'none'].includes(sameSite)) throw new Error('COOKIE_SAME_SITE must be strict, lax or none.');
  const secure = process.env.NODE_ENV === 'production';
  if (sameSite === 'none' && !secure) throw new Error('COOKIE_SAME_SITE=none requires NODE_ENV=production and secure cookies.');
  return { httpOnly: true, secure, sameSite, path: '/', maxAge: 24 * 60 * 60 * 1000 };
};
function setSession(res, userId) {
  const token = jwt.sign({}, process.env.JWT_SECRET, { subject: String(userId), expiresIn: process.env.JWT_EXPIRES_IN || '1d', issuer: 'nexora-api', audience: 'nexora-web' });
  res.cookie('nexora_session', token, cookieOptions());
}
const publicUser = user => ({ id: user.id, name: user.name, email: user.email, role: user.role });
router.get('/csrf', issueCsrfToken);
router.post('/register', authLimit, asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Please provide a valid name, email and password (at least 12 characters).' });
  const { name, password } = parsed.data; const email = parsed.data.email.toLowerCase().trim();
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
  try {
    const user = await User.create({ name, email, passwordHash });
    setSession(res, user._id); res.status(201).json({ user: publicUser(user) });
  } catch (error) { if (error.code === 11000) return res.status(409).json({ message: 'Email is already registered.' }); throw error; }
}));
router.post('/login', authLimit, asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid email or password.' });
  const user = await User.findOne({ email: parsed.data.email.toLowerCase().trim() }).select('+passwordHash');
  const valid = user && user.isActive && await argon2.verify(user.passwordHash, parsed.data.password);
  if (!valid) return res.status(401).json({ message: 'Invalid email or password.' });
  setSession(res, user._id); res.json({ user: publicUser(user) });
}));
router.post('/logout', (req, res) => { res.clearCookie('nexora_session', { ...cookieOptions(), maxAge: undefined }); res.status(204).end(); });
router.get('/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));
router.patch('/me', requireAuth, asyncHandler(async (req, res) => {
  const parsed = z.object({ name: z.string().trim().min(2).max(80) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Please provide a valid name.' });
  const user = await User.findByIdAndUpdate(req.user._id, { $set: parsed.data }, { new: true, runValidators: true });
  res.json({ user: publicUser(user) });
}));
export default router;
