import { Router } from 'express';
import { z } from 'zod';
import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
const router = Router(); router.use(requireAuth);
router.get('/', asyncHandler(async (req, res) => { const list = await Wishlist.findOne({ user: req.user._id }).populate({ path: 'products', match: { isActive: true } }); res.json({ products: list?.products || [] }); }));
router.put('/', asyncHandler(async (req, res) => {
  const parsed = z.object({ productId: z.string().regex(/^[a-f\d]{24}$/i), action: z.enum(['add', 'remove']) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid wishlist request.' });
  if (parsed.data.action === 'add' && !await Product.exists({ _id: parsed.data.productId, isActive: true })) return res.status(404).json({ message: 'Product not found.' });
  const update = parsed.data.action === 'add' ? { $addToSet: { products: parsed.data.productId } } : { $pull: { products: parsed.data.productId } };
  const list = await Wishlist.findOneAndUpdate({ user: req.user._id }, update, { upsert: true, new: true }).populate('products');
  res.json({ products: list.products });
}));
export default router;
