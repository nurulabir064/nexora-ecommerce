import { Router } from 'express';
import { z } from 'zod';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
const router = Router(); router.use(requireAuth);
router.get('/', asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate({ path: 'items.product', match: { isActive: true }, select: 'name slug price images stock' });
  res.json({ items: (cart?.items || []).filter(row => row.product) });
}));
router.put('/', asyncHandler(async (req, res) => {
  const schema = z.object({ items: z.array(z.object({ productId: z.string().regex(/^[a-f\d]{24}$/i), quantity: z.number().int().min(1).max(20) })).max(50) });
  const parsed = schema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ message: 'Invalid cart items.' });
  const ids = parsed.data.items.map(x => x.productId);
  if (new Set(ids).size !== ids.length) return res.status(400).json({ message: 'A product can appear only once in the cart.' });
  const products = await Product.find({ _id: { $in: ids }, isActive: true }).select('_id stock');
  if (products.length !== new Set(ids).size) return res.status(400).json({ message: 'One or more products are unavailable.' });
  const byId = new Map(products.map(p => [String(p._id), p]));
  for (const item of parsed.data.items) if (item.quantity > byId.get(item.productId).stock) return res.status(409).json({ message: 'Requested quantity exceeds available stock.' });
  const cart = await Cart.findOneAndUpdate({ user: req.user._id }, { $set: { items: parsed.data.items.map(x => ({ product: x.productId, quantity: x.quantity })) } }, { upsert: true, new: true, runValidators: true }).populate('items.product', 'name slug price images stock');
  res.json({ items: cart.items });
}));
router.delete('/', asyncHandler(async (req, res) => { await Cart.findOneAndUpdate({ user: req.user._id }, { $set: { items: [] } }); res.status(204).end(); }));
export default router;
