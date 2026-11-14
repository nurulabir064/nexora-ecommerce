import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Coupon from '../models/Coupon.js';
import Review from '../models/Review.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
const router = Router(); router.use(requireAuth, requireRole('admin'));
const httpsUrl = z.url().refine(value => new URL(value).protocol === 'https:', { message: 'Only HTTPS URLs are allowed.' });
const productSchema = z.object({ name: z.string().trim().min(2).max(160), slug: z.string().trim().min(2).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), description: z.string().trim().min(10).max(5000), category: z.string().regex(/^[a-f\d]{24}$/i), brand: z.string().trim().max(80).optional(), price: z.number().finite().min(0), compareAtPrice: z.number().finite().min(0).nullable().optional(), images: z.array(z.object({ url: httpsUrl, alt: z.string().max(160).optional() })).min(1).max(8), stock: z.number().int().min(0).max(100000), isActive: z.boolean().optional() });
router.get('/overview', asyncHandler(async (_req, res) => {
  const [products, customers, orders, revenue] = await Promise.all([
    Product.countDocuments({ isActive: true }), User.countDocuments({ role: 'customer', isActive: true }), Order.countDocuments(),
    Order.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$total' } } }])
  ]);
  res.json({ overview: { products, customers, orders, revenue: revenue[0]?.total || 0 } });
}));
router.get('/products', asyncHandler(async (req, res) => { const page = Math.max(1, Number(req.query.page) || 1); const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20)); const [items,total] = await Promise.all([Product.find().populate('category','name').sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit), Product.countDocuments()]); res.json({ items, pagination: { page, limit, total } }); }));
router.post('/products', asyncHandler(async (req, res) => { const parsed = productSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ message: 'Invalid product data.', errors: parsed.error.flatten() }); if (!await Category.exists({ _id: parsed.data.category, isActive: true })) return res.status(400).json({ message: 'Select an active category.' }); const product = await Product.create(parsed.data); res.status(201).json({ product }); }));
router.patch('/products/:id', asyncHandler(async (req, res) => { const parsed = productSchema.partial().safeParse(req.body); if (!parsed.success) return res.status(400).json({ message: 'Invalid product data.', errors: parsed.error.flatten() }); if (parsed.data.category && !await Category.exists({ _id: parsed.data.category, isActive: true })) return res.status(400).json({ message: 'Select an active category.' }); const product = await Product.findByIdAndUpdate(req.params.id, { $set: parsed.data }, { new: true, runValidators: true }); if (!product) return res.status(404).json({ message: 'Product not found.' }); res.json({ product }); }));
router.delete('/products/:id', asyncHandler(async (req, res) => { const product = await Product.findByIdAndUpdate(req.params.id, { $set: { isActive: false } }, { new: true }); if (!product) return res.status(404).json({ message: 'Product not found.' }); res.json({ message: 'Product archived.' }); }));
router.get('/categories', asyncHandler(async (_req, res) => { res.json({ categories: await Category.find().sort({ name: 1 }) }); }));
router.post('/categories', asyncHandler(async (req, res) => { const parsed = z.object({ name: z.string().trim().min(2).max(60), slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), image: httpsUrl.optional() }).safeParse(req.body); if (!parsed.success) return res.status(400).json({ message: 'Invalid category.' }); const category = await Category.create(parsed.data); res.status(201).json({ category }); }));
router.patch('/categories/:id', asyncHandler(async (req, res) => { const parsed = z.object({ name: z.string().trim().min(2).max(60).optional(), slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(), image: httpsUrl.optional(), isActive: z.boolean().optional() }).safeParse(req.body); if (!parsed.success) return res.status(400).json({ message: 'Invalid category.' }); const category = await Category.findByIdAndUpdate(req.params.id, { $set: parsed.data }, { new: true, runValidators: true }); if (!category) return res.status(404).json({ message: 'Category not found.' }); res.json({ category }); }));
router.delete('/categories/:id', asyncHandler(async (req, res) => { const category = await Category.findByIdAndUpdate(req.params.id, { $set: { isActive: false } }, { new: true }); if (!category) return res.status(404).json({ message: 'Category not found.' }); res.json({ message: 'Category archived.' }); }));
router.get('/customers', asyncHandler(async (req, res) => { const page = Math.max(1, Number(req.query.page) || 1); const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20)); const [customers,total] = await Promise.all([User.find({ role: 'customer' }).select('name email isActive createdAt').sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit), User.countDocuments({ role: 'customer' })]); res.json({ customers, pagination: { page, limit, total } }); }));
router.get('/reviews', asyncHandler(async (_req, res) => { const reviews = await Review.find().populate('user','name').populate('product','name slug').sort({ createdAt: -1 }).limit(100); res.json({ reviews }); }));
router.patch('/reviews/:id', asyncHandler(async (req, res) => {
  const parsed = z.object({ isPublished: z.boolean() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid review update.' });
  const session = await mongoose.startSession();
  let review;
  try {
    await session.withTransaction(async () => {
      review = await Review.findByIdAndUpdate(req.params.id, { $set: parsed.data }, { new: true, runValidators: true, session });
      if (!review) { const error = new Error('Review not found.'); error.statusCode = 404; throw error; }
      const stats = await Review.aggregate([
        { $match: { product: review.product, isPublished: true } },
        { $group: { _id: '$product', average: { $avg: '$rating' }, count: { $sum: 1 } } }
      ]).session(session);
      await Product.updateOne(
        { _id: review.product },
        { $set: { ratingAverage: stats[0]?.average || 0, ratingCount: stats[0]?.count || 0 } },
        { session }
      );
    });
  } finally { await session.endSession(); }
  res.json({ review });
}));
const couponInput = z.object({ code: z.string().trim().min(3).max(32).transform(v => v.toUpperCase()), type: z.enum(['percentage','fixed']), value: z.number().positive(), minimumOrder: z.number().min(0).default(0), maximumDiscount: z.number().positive().optional(), startsAt: z.iso.datetime(), expiresAt: z.iso.datetime(), usageLimit: z.number().int().positive().optional(), isActive: z.boolean().default(true) }).refine(v => v.type !== 'percentage' || v.value <= 100, { message: 'Percentage coupons cannot exceed 100%.' });
router.get('/coupons', asyncHandler(async (_req, res) => res.json({ coupons: await Coupon.find().sort({ createdAt: -1 }) })));
router.post('/coupons', asyncHandler(async (req, res) => { const parsed = couponInput.safeParse(req.body); if (!parsed.success) return res.status(400).json({ message: 'Invalid coupon data.' }); if (new Date(parsed.data.expiresAt) <= new Date(parsed.data.startsAt)) return res.status(400).json({ message: 'Expiry must be after start date.' }); const coupon = await Coupon.create(parsed.data); res.status(201).json({ coupon }); }));
router.patch('/coupons/:id', asyncHandler(async (req, res) => {
  const patchSchema = couponInput.partial().refine(value => Object.keys(value).length > 0, { message: 'Provide at least one coupon field to update.' });
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid coupon data.' });
  const current = await Coupon.findById(req.params.id);
  if (!current) return res.status(404).json({ message: 'Coupon not found.' });
  const merged = { ...current.toObject(), ...parsed.data };
  if (new Date(merged.expiresAt) <= new Date(merged.startsAt)) return res.status(400).json({ message: 'Expiry must be after start date.' });
  if (merged.type === 'percentage' && merged.value > 100) return res.status(400).json({ message: 'Percentage coupons cannot exceed 100%.' });
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, { $set: parsed.data }, { new: true, runValidators: true });
  res.json({ coupon });
}));
router.delete('/coupons/:id', asyncHandler(async (req, res) => { const coupon = await Coupon.findByIdAndUpdate(req.params.id, { $set: { isActive: false } }, { new: true }); if (!coupon) return res.status(404).json({ message: 'Coupon not found.' }); res.json({ message: 'Coupon disabled.' }); }));
router.get('/orders', asyncHandler(async (req, res) => { const page = Math.max(1, Number(req.query.page) || 1); const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20)); const [orders,total] = await Promise.all([Order.find().populate('user','name email').sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit), Order.countDocuments()]); res.json({ orders, pagination: { page, limit, total } }); }));
router.patch('/orders/:id/status', asyncHandler(async (req, res) => {
  const parsed = z.object({ status: z.enum(['confirmed','processing','shipped','delivered','cancelled']) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid order status.' });
  const session = await mongoose.startSession(); let order;
  try { await session.withTransaction(async () => {
    order = await Order.findById(req.params.id).session(session);
    if (!order) { const e = new Error('Order not found.'); e.statusCode = 404; throw e; }
    if (order.status === 'delivered' || order.status === 'cancelled') { const e = new Error('This order can no longer be changed.'); e.statusCode = 409; throw e; }
    const allowed = { placed: ['confirmed', 'cancelled'], confirmed: ['processing', 'cancelled'], processing: ['shipped', 'cancelled'], shipped: ['delivered'], delivered: [], cancelled: [] };
    if (!allowed[order.status]?.includes(parsed.data.status)) { const e = new Error(`Cannot change order from ${order.status} to ${parsed.data.status}.`); e.statusCode = 409; throw e; }
    if (parsed.data.status === 'cancelled') {
      for (const item of order.items) await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } }, { session });
      if (order.couponCode) await Coupon.updateOne({ code: order.couponCode, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } }, { session });
    }
    order.status = parsed.data.status;
    await order.save({ session });
  }); } finally { await session.endSession(); }
  res.json({ order });
}));

// COD is not considered paid merely because delivery status changed.
// An admin must explicitly confirm cash collection after delivery.
router.patch('/orders/:id/payment', asyncHandler(async (req, res) => {
  const parsed = z.object({ paymentStatus: z.literal('paid') }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid payment update.' });
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, status: 'delivered', paymentMethod: 'cod', paymentStatus: 'pending' },
    { $set: { paymentStatus: 'paid' } },
    { new: true, runValidators: true }
  );
  if (!order) return res.status(409).json({ message: 'Only delivered, unpaid COD orders can be marked as paid.' });
  res.json({ order });
}));

export default router;
