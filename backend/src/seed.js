import 'dotenv/config';
import argon2 from 'argon2';
import mongoose from 'mongoose';
import { connectDatabase } from './config/db.js';
import User from './models/User.js';
import Category from './models/Category.js';
import Product from './models/Product.js';

await connectDatabase(process.env.MONGODB_URI);
try {
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword || adminPassword.length < 16) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 16 characters) before running the seed script.');
  const existingAdmin = await User.findOne({ email: adminEmail }).select('role');
  if (existingAdmin && existingAdmin.role !== 'admin') {
    throw new Error('ADMIN_EMAIL is already registered as a customer. Choose a separate email for the initial admin account; the seed script will not silently promote an existing customer.');
  }
  if (!existingAdmin) {
    const passwordHash = await argon2.hash(adminPassword, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
    await User.create({ name: 'NEXORA Admin', email: adminEmail, passwordHash, role: 'admin' });
  }
  const catalog = [
    { name: 'Fashion', slug: 'fashion', products: [
      ['Everyday Canvas Tote','everyday-canvas-tote','A roomy, durable everyday tote for daily essentials.',890,1190,42,'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=85'],
      ['Soft Knit Weekend Set','soft-knit-weekend-set','An easy, comfortable set for slow mornings and everyday plans.',2890,3490,18,'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=85']
    ]},
    { name: 'Electronics', slug: 'electronics', products: [
      ['Studio Wireless Headphones','studio-wireless-headphones','Comfort-first wireless listening with balanced sound.',3490,4290,25,'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85'],
      ['Compact Bluetooth Speaker','compact-bluetooth-speaker','Big sound in a compact design for everyday listening.',2190,null,31,'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=85']
    ]},
    { name: 'Home', slug: 'home', products: [
      ['Minimal Ceramic Vase','minimal-ceramic-vase','A sculptural ceramic accent for a considered home.',1250,null,14,'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=900&q=85'],
      ['Linen Cushion Cover','linen-cushion-cover','Soft-touch linen texture to refresh your favourite corner.',750,null,55,'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=900&q=85']
    ]},
    { name: 'Beauty', slug: 'beauty', products: [
      ['Botanical Skin Care Kit','botanical-skin-care-kit','A simple daily ritual with thoughtfully selected essentials.',1590,1890,22,'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=85']
    ]},
    { name: 'Accessories', slug: 'accessories', products: [
      ['Daily Hydration Bottle','daily-hydration-bottle','A reusable bottle for commutes, desk days and more.',990,1290,63,'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=85']
    ]}
  ];
  for (const group of catalog) {
    const category = await Category.findOneAndUpdate({ slug: group.slug }, { $set: { name: group.name, isActive: true }, $setOnInsert: { slug: group.slug } }, { upsert: true, new: true });
    for (const [name, slug, description, price, compareAtPrice, stock, image] of group.products) {
      await Product.updateOne({ slug }, { $set: { name, description, category: category._id, price, compareAtPrice: compareAtPrice ?? undefined, stock, images: [{ url: image, alt: name }], isActive: true }, $setOnInsert: { slug, currency: 'BDT' } }, { upsert: true, runValidators: true });
    }
  }
  console.info('NEXORA seed completed. Admin account is created only if it did not already exist.');
} finally { await mongoose.disconnect(); }
