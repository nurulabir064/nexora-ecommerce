import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/db.js';
const port = Number(process.env.PORT) || 5000;
if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET, 'utf8') < 32) throw new Error('JWT_SECRET must be at least 32 bytes.');
if (process.env.COOKIE_SAME_SITE && !['strict', 'lax', 'none'].includes(process.env.COOKIE_SAME_SITE)) throw new Error('COOKIE_SAME_SITE must be strict, lax or none.');
if (process.env.COOKIE_SAME_SITE === 'none' && process.env.NODE_ENV !== 'production') throw new Error('COOKIE_SAME_SITE=none requires production HTTPS.');
await connectDatabase(process.env.MONGODB_URI);
app.listen(port, () => console.info(`NEXORA API listening on port ${port}`));
