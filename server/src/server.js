import 'dotenv/config';
import http from 'node:http';
import { createApp } from './app.js';
import { attachSocket } from './sockets/index.js';
import { runMigrations } from './db/migrate.js';

const PORT = Number(process.env.PORT) || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const AUTO_MIGRATE = process.env.AUTO_MIGRATE !== 'false' && process.env.NODE_ENV === 'production';

if (AUTO_MIGRATE) {
  console.log('Running migrations…');
  try {
    await runMigrations();
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

// Express app is the request handler for the HTTP server. Socket.io is then
// attached to the same server and intercepts /socket.io/* internally.
// `io` is exposed to controllers via `app.set('io', io)` (read in app.js).
const app = createApp({ clientOrigin: CLIENT_ORIGIN });
const httpServer = http.createServer(app);
const io = attachSocket(httpServer, { clientOrigin: CLIENT_ORIGIN });
app.set('io', io);

httpServer.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

const shutdown = (signal) => {
  console.log(`\n${signal} received, shutting down`);
  httpServer.close(() => process.exit(0));
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
