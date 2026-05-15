import { io as ioClient } from 'socket.io-client';
import { getToken } from './api';

const url = import.meta.env.VITE_SOCKET_URL || window.location.origin;

let singleton = null;

export function getSocket() {
  if (singleton) return singleton;
  singleton = ioClient(url, {
    autoConnect: true,
    auth: (cb) => cb({ token: getToken() }),
  });
  return singleton;
}

export function refreshSocketAuth() {
  if (!singleton) return;
  singleton.auth = { token: getToken() };
  singleton.disconnect();
  singleton.connect();
}
