import { io } from 'socket.io-client';

// Single shared socket instance
const socket = io(import.meta.env.VITE_SOCKET_URL, {
  autoConnect: true,
  reconnectionAttempts: 5,
});

export default socket;
