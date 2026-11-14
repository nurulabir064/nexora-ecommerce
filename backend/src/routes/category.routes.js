import { Router } from 'express';
import Category from '../models/Category.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
const router = Router();
router.get('/', asyncHandler(async (_req, res) => { const categories = await Category.find({ isActive: true }).sort({ name: 1 }).select('name slug image'); res.json({ categories }); }));
export default router;
