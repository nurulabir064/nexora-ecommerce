import { Router } from 'express';
import { z } from 'zod';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
const router = Router();
router.get('/product/:productId', asyncHandler(async (req, res) => {
  if (!/^[a-f\d]{24}$/i.test(req.params.productId)) return res.status(400).json({ message: 'Invalid product ID.' });
  const product = await Product.findOne({ _id: req.params.productId, isActive: true }).select('_id');
  if (!product) return res.status(404).json({ message: 'Product not found.' });
  const reviews = await Review.find({ product: product._id, isPublished: true }).populate('user','name').sort({ createdAt: -1 }).limit(50);
  res.json({ reviews });
}));
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const parsed = z.object({ productId: z.string().regex(/^[a-f\d]{24}$/i), orderId: z.string().regex(/^[a-f\d]{24}$/i), rating: z.number().int().min(1).max(5), title: z.string().trim().max(120).optional(), comment: z.string().trim().min(5).max(2000) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Please provide a valid review.' });
  const [order, product] = await Promise.all([
    Order.findOne({ _id: parsed.data.orderId, user: req.user._id, status: 'delivered', 'items.product': parsed.data.productId }).select('_id'),
    Product.findOne({ _id: parsed.data.productId, isActive: true }).select('_id')
  ]);
  if (!order || !product) return res.status(403).json({ message: 'Only customers who received this available product can review it.' });
  const review = await Review.create({ product: product._id, user: req.user._id, order: order._id, rating: parsed.data.rating, title: parsed.data.title, comment: parsed.data.comment });
  res.status(201).json({ review, message: 'Review submitted for moderation.' });
}));
export default router;
