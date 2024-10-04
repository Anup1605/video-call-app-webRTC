import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';


const app = express();
const server = createServer(app);
const io = new Server(server);
const allUsers = {};

// System paths
const __dirname = dirname(fileURLToPath(import.meta.url));

// Serving static files
app.use(express.static('public'));

// Main Route
app.get('/', (req, res) => {
  res.sendFile(join(__dirname + '/app/index.html'));
});

// Handle socket connections
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  socket.on('join-user', (username) => {
    allUsers[username] = { username, id: socket.id };
    io.emit('joined', allUsers);
  });

  socket.on('offer', ({ from, to, offer }) => {
    io.to(allUsers[to].id).emit('offer', { from, to, offer });
  });

  socket.on('answer', ({ from, to, answer }) => {
    io.to(allUsers[from].id).emit('answer', { from, to, answer });
  });

  socket.on('end-call', ({ from, to }) => {
    io.to(allUsers[to].id).emit('end-call', { from, to });
  });

  socket.on('call-ended', (caller) => {
    const [from, to] = caller;
    io.to(allUsers[from].id).emit('call-ended', caller);
    io.to(allUsers[to].id).emit('call-ended', caller);
  });

  socket.on('icecandidate', (candidate) => {
    socket.broadcast.emit('icecandidate', candidate);
  });
});

const PORT = process.env.PORT || 7000;

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
