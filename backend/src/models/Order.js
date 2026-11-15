import mongoose from 'mongoose';
const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true }, image: String,
  unitPrice: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  variant: { type: mongoose.Schema.Types.Mixed }
}, { _id: false });
const addressSchema = new mongoose.Schema({
  recipient: { type: String, required: true, trim: true }, phone: { type: String, required: true, trim: true },
  addressLine: { type: String, required: true, trim: true }, district: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true }, postalCode: { type: String, trim: true }
}, { _id: false });
const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true, index: true },
  idempotencyKey: { type: String, maxlength: 64 },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  items: { type: [orderItemSchema], validate: v => v.length > 0 }, shippingAddress: { type: addressSchema, required: true },
  subtotal: { type: Number, required: true, min: 0 }, shippingFee: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 }, total: { type: Number, required: true, min: 0 },
  couponCode: String, currency: { type: String, enum: ['BDT'], default: 'BDT' },
  paymentMethod: { type: String, enum: ['cod'], default: 'cod' }, paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  status: { type: String, enum: ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'placed', index: true }
}, { timestamps: true });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ user: 1, idempotencyKey: 1 }, { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } });
export default mongoose.model('Order', orderSchema);
