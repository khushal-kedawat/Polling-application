import { useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket';

export function usePollSocket(pollId, { asCreator = false } = {}) {
  const [analytics, setAnalytics] = useState(null);
  const [published, setPublished] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!pollId) return;
    const socket = getSocket();

    const handleConnect = () => {
      setConnected(true);
      socket.emit('join_poll', { pollId, asCreator }, (ack) => {
        if (!ack?.ok) console.warn('[socket] join_poll failed:', ack?.error);
      });
    };
    const handleDisconnect = () => setConnected(false);
    const handleAnalytics = (payload) => {
      if (payload?.pollId === pollId) setAnalytics(payload);
    };
    const handlePublished = (payload) => {
      if (payload?.pollId === pollId) setPublished(true);
    };

    if (socket.connected) handleConnect();
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('poll:analytics', handleAnalytics);
    socket.on('poll:published', handlePublished);

    return () => {
      socket.emit('leave_poll', { pollId });
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('poll:analytics', handleAnalytics);
      socket.off('poll:published', handlePublished);
    };
  }, [pollId, asCreator]);

  return { analytics, published, connected };
}
