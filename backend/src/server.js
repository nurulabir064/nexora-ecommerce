import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/db.js';
const port = Number(process.env.PORT) || 5000;
if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET, 'utf8') < 32) throw new Error('JWT_SECRET must be at least 32 bytes.');
if (!process.env.CSRF_SECRET || Buffer.byteLength(process.env.CSRF_SECRET, 'utf8') < 32) throw new Error('CSRF_SECRET must be at least 32 bytes.');
if (process.env.NODE_ENV === 'production' && !process.env.APP_ORIGIN) throw new Error('APP_ORIGIN must be set to the public application origin.');
if (process.env.APP_ORIGIN) {
  let appOrigin;
  try { appOrigin = new URL(process.env.APP_ORIGIN); } catch { throw new Error('APP_ORIGIN must be a valid absolute URL.'); }
  if (!['http:', 'https:'].includes(appOrigin.protocol) || appOrigin.origin !== process.env.APP_ORIGIN) throw new Error('APP_ORIGIN must contain only the canonical origin (scheme, host and optional port), without a path or trailing slash.');
  if (process.env.NODE_ENV === 'production' && appOrigin.protocol !== 'https:') throw new Error('APP_ORIGIN must use HTTPS in production.');
}
if (process.env.COOKIE_SAME_SITE && !['strict', 'lax', 'none'].includes(process.env.COOKIE_SAME_SITE)) throw new Error('COOKIE_SAME_SITE must be strict, lax or none.');
if (process.env.COOKIE_SAME_SITE === 'none' && process.env.NODE_ENV !== 'production') throw new Error('COOKIE_SAME_SITE=none requires production HTTPS.');
await connectDatabase(process.env.MONGODB_URI);
app.listen(port, () => console.info(`NEXORA API listening on port ${port}`));
