import { verifyToken } from '../utils/jwt.js';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export async function optionalAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return next();

    const payload = verifyToken(token);
    if (!payload) return next();

    const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
    if (user) {
      req.user = { id: user.id, name: user.name, email: user.email };
    }
    next();
  } catch (err) {
    next(err);
  }
}
