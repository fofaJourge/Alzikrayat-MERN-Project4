// socket.js: creates a Socket.io connection to the server.
// io() with no URL connects to the same origin; the Vite proxy forwards /socket.io to Express.

import { io } from 'socket.io-client'

export const createSocket = () => io()
