import { verifyToken } from '../utils/jwt.js';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { HttpError } from '../utils/httpError.js';

export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new HttpError(401, 'Authentication required');

    const payload = verifyToken(token);
    if (!payload) throw new HttpError(401, 'Invalid or expired token');

    const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
    if (!user) throw new HttpError(401, 'User not found');

    req.user = { id: user.id, name: user.name, email: user.email };
    next();
  } catch (err) {
    next(err);
  }
}
