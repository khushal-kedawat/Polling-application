import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import { HttpError } from '../utils/httpError.js';

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email });

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing) throw new HttpError(409, 'Email already registered', 'EMAIL_TAKEN');

    const passwordHash = await hashPassword(password);
    const [user] = await db
      .insert(users)
      .values({ name, email, passwordHash })
      .returning();

    const token = signToken(user.id);
    res.status(201).json({ user: publicUser(user), token });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) throw new HttpError(401, 'Invalid email or password');

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) throw new HttpError(401, 'Invalid email or password');

    const token = signToken(user.id);
    res.json({ user: publicUser(user), token });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res) {
  res.json({ user: req.user });
}
