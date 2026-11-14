import mongoose from 'mongoose';
const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, required: true, maxlength: 5000 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  brand: { type: String, trim: true, maxlength: 80 },
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, min: 0 },
  currency: { type: String, enum: ['BDT'], default: 'BDT' },
  images: [{ url: { type: String, required: true }, alt: { type: String, maxlength: 160 } }],
  variants: [{ name: String, options: [String] }],
  stock: { type: Number, required: true, min: 0, default: 0 },
  isActive: { type: Boolean, default: true, index: true },
  ratingAverage: { type: Number, min: 0, max: 5, default: 0 },
  ratingCount: { type: Number, min: 0, default: 0 }
}, { timestamps: true });
productSchema.index({ name: 'text', description: 'text', brand: 'text' });
productSchema.index({ category: 1, price: 1, createdAt: -1 });
export default mongoose.model('Product', productSchema);
