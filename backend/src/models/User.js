import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['customer','admin'], default: 'customer', immutable: true },
  isActive: { type: Boolean, default: true },
  sessionVersion: { type: Number, default: 0, min: 0, select: false }
}, { timestamps: true });
export default mongoose.model('User', userSchema);
