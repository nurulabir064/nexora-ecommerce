import { Router } from 'express';
import mongoose from 'mongoose';
import { randomUUID, createHash } from 'node:crypto';
import { z } from 'zod';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Coupon from '../models/Coupon.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
const router = Router(); router.use(requireAuth);
const addressSchema = z.object({ recipient: z.string().trim().min(2).max(80), phone: z.string().trim().regex(/^(?:\\+?88)?01[3-9]\\d{8}$/), addressLine: z.string().trim().min(8).max(240), district: z.string().trim().min(2).max(60), city: z.string().trim().min(2).max(60), postalCode: z.string().trim().max(12).optional().default('') });
router.post('/', asyncHandler(async (req, res) => {
  const parsed = z.object({ shippingAddress: addressSchema, couponCode: z.string().trim().max(32).optional() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Please check your shipping details.' });
  const idempotencyKey = req.get('idempotency-key');
  if (typeof idempotencyKey !== 'string' || !/^[a-f0-9-]{36}$/i.test(idempotencyKey)) {
    return res.status(400).json({ message: 'A valid Idempotency-Key UUID header is required.' });
  }
  const requestHash = createHash('sha256').update(JSON.stringify(parsed.data)).digest('hex');
  const assertSameRequest = order => {
    if (order.requestHash && order.requestHash !== requestHash) {
      const error = new Error('This Idempotency-Key was already used with different checkout details.');
      error.statusCode = 409;
      throw error;
    }
    return order;
  };
  const existingOrder = await Order.findOne({ user: req.user._id, idempotencyKey });
  if (existingOrder) return res.status(200).json({ order: assertSameRequest(existingOrder), replayed: true });
  const session = await mongoose.startSession(); let createdOrder; let replayed = false;
  try {
    await session.withTransaction(async () => {
      const duplicate = await Order.findOne({ user: req.user._id, idempotencyKey }).session(session);
      if (duplicate) { createdOrder = assertSameRequest(duplicate); replayed = true; return; }
      const cart = await Cart.findOne({ user: req.user._id }).session(session);
      if (!cart?.items.length) { const error = new Error('Your cart is empty.'); error.statusCode = 400; throw error; }
      const ids = cart.items.map(item => item.product);
      const products = await Product.find({ _id: { $in: ids }, isActive: true }).session(session);
      if (products.length !== ids.length) { const error = new Error('A product in your cart is no longer available.'); error.statusCode = 409; throw error; }
      const byId = new Map(products.map(p => [String(p._id), p]));
      const orderItems = []; let subtotal = 0;
      for (const cartItem of cart.items) {
        const product = byId.get(String(cartItem.product));
        const reserved = await Product.updateOne({ _id: product._id, isActive: true, stock: { $gte: cartItem.quantity } }, { $inc: { stock: -cartItem.quantity } }, { session });
        if (reserved.modifiedCount !== 1) { const error = new Error(`${product.name} does not have enough stock.`); error.statusCode = 409; throw error; }
        subtotal += product.price * cartItem.quantity;
        orderItems.push({ product: product._id, name: product.name, image: product.images?.[0]?.url || '', unitPrice: product.price, quantity: cartItem.quantity });
      }
      let discount = 0; let couponCode;
      if (parsed.data.couponCode) {
        const code = parsed.data.couponCode.toUpperCase();
        const coupon = await Coupon.findOneAndUpdate({ code, isActive: true, minimumOrder: { $lte: subtotal }, startsAt: { $lte: new Date() }, expiresAt: { $gte: new Date() }, $expr: { $or: [{ $eq: ['$usageLimit', null] }, { $lt: ['$usedCount', '$usageLimit'] }] } }, { $inc: { usedCount: 1 } }, { new: true, session });
        if (!coupon) { const error = new Error('Coupon is invalid, expired, exhausted or does not meet the minimum order.'); error.statusCode = 400; throw error; }
        discount = coupon.type === 'percentage' ? subtotal * coupon.value / 100 : coupon.value;
        if (coupon.maximumDiscount != null) discount = Math.min(discount, coupon.maximumDiscount);
        discount = Math.min(subtotal, Math.round(discount)); couponCode = coupon.code;
      }
      const shippingFee = subtotal >= 3000 ? 0 : 80;
      [createdOrder] = await Order.create([{ orderNumber: `NX-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${randomUUID().replaceAll('-', '').slice(0,10).toUpperCase()}`, idempotencyKey, requestHash, user: req.user._id, items: orderItems, shippingAddress: parsed.data.shippingAddress, subtotal, shippingFee, discount, total: subtotal + shippingFee - discount, couponCode, paymentMethod: 'cod' }], { session });
      await Cart.updateOne({ user: req.user._id }, { $set: { items: [] } }, { session });
    });
  } catch (error) {
    if (error.code === 11000) {
      const replay = await Order.findOne({ user: req.user._id, idempotencyKey });
      if (replay) return res.status(200).json({ order: assertSameRequest(replay), replayed: true });
    }
    throw error;
  } finally { await session.endSession(); }
  res.status(replayed ? 200 : 201).json({ order: createdOrder, replayed });
}));
router.get('/mine', asyncHandler(async (req, res) => { const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50).select('-__v'); res.json({ orders }); }));
router.get('/mine/:id', asyncHandler(async (req, res) => { const order = await Order.findOne({ _id: req.params.id, user: req.user._id }); if (!order) return res.status(404).json({ message: 'Order not found.' }); res.json({ order }); }));
export default router;
