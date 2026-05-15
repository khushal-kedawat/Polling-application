import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = '7d';

if (!SECRET) {
  throw new Error('JWT_SECRET is not set');
}

export const signToken = (userId) => jwt.sign({ userId }, SECRET, { expiresIn: EXPIRES_IN });

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
};
