import { Server } from 'socket.io';
import { verifyToken } from '../utils/jwt.js';
import { db } from '../db/index.js';
import { polls } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export function attachSocket(httpServer, { clientOrigin }) {
  const io = new Server(httpServer, {
    cors: {
      origin: clientOrigin,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    socket.on('join_poll', async ({ pollId, asCreator } = {}, ack) => {
      try {
        if (!pollId || typeof pollId !== 'string') {
          return ack?.({ ok: false, error: 'pollId required' });
        }

        if (asCreator) {
          const token = socket.handshake.auth?.token;
          const payload = token ? verifyToken(token) : null;
          if (!payload) return ack?.({ ok: false, error: 'auth required' });
          const [poll] = await db.select().from(polls).where(eq(polls.id, pollId)).limit(1);
          if (!poll || poll.creatorId !== payload.userId) {
            return ack?.({ ok: false, error: 'forbidden' });
          }
        }

        socket.join(`poll:${pollId}`);
        ack?.({ ok: true });
      } catch (err) {
        console.error('[socket] join_poll error', err);
        ack?.({ ok: false, error: 'internal' });
      }
    });

    socket.on('leave_poll', ({ pollId } = {}) => {
      if (pollId) socket.leave(`poll:${pollId}`);
    });
  });

  return io;
}
