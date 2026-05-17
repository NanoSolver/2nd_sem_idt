const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Config
const PORT = process.env.PORT || 3000;
const USERS = {
  nurse: { password: 'nurse123', role: 'nurse' },
  doctor: { password: 'doctor123', role: 'doctor' },
};

// In-memory store. Use a database before handling real patient data.
let latestPatient = null; // most recent transmission from nurse
let doctorNotes = ''; // doctor's response notes

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.redirect('/login.html');
});

app.get('/login', (req, res) => res.redirect('/login.html'));
app.get('/nurse', (req, res) => res.sendFile(path.join(__dirname, 'public', 'nurse.html')));
app.get('/doctor', (req, res) => res.sendFile(path.join(__dirname, 'public', 'doctor.html')));

app.get('/health', (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// REST: Login
app.post('/api/login', (req, res) => {
  const { username, password, role } = req.body;
  const user = USERS[username?.toLowerCase()];
  if (!user || user.password !== password || user.role !== role) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  res.json({ ok: true, role: user.role, username: username.toLowerCase() });
});

// REST: Get latest patient (doctor can fetch on page load)
app.get('/api/patient', (req, res) => {
  res.json(latestPatient || null);
});

app.get('/api/state', (req, res) => {
  res.json({ patient: latestPatient, doctorNotes });
});

function emitOnlineCounts() {
  const doctors = io.sockets.adapter.rooms.get('doctors')?.size || 0;
  const nurses = io.sockets.adapter.rooms.get('nurses')?.size || 0;
  io.emit('online_counts', { doctors, nurses });
}

// Socket.io
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join', (role) => {
    if (!['doctor', 'nurse'].includes(role)) return;

    socket.data.role = role;
    socket.join(role === 'doctor' ? 'doctors' : 'nurses');
    console.log(`${role} joined [${socket.id}]`);

    if (role === 'doctor' && latestPatient) {
      socket.emit('patient_update', latestPatient);
    }
    if (role === 'doctor' && doctorNotes) {
      socket.emit('notes_saved', doctorNotes);
    }

    emitOnlineCounts();
  });

  // Nurse transmits patient data
  socket.on('transmit_patient', (payload) => {
    if (socket.data.role !== 'nurse') {
      return socket.emit('error_message', 'Only nurse clients can transmit patient data.');
    }

    console.log('Patient data received from nurse:', payload.patient?.name);
    latestPatient = payload;
    io.to('doctors').emit('patient_update', payload);
    socket.emit('patient_transmitted', { ok: true, sentAt: payload.sentAt });
  });

  // Doctor sends alert back to nurse
  socket.on('doctor_alert', (payload) => {
    if (socket.data.role !== 'doctor') {
      return socket.emit('error_message', 'Only doctor clients can send alerts.');
    }

    console.log('Doctor alert sent:', payload.message);
    io.to('nurses').emit('doctor_alert', payload);
  });

  // Doctor saves notes
  socket.on('save_notes', (notes) => {
    if (socket.data.role !== 'doctor') {
      return socket.emit('error_message', 'Only doctor clients can save notes.');
    }

    doctorNotes = notes;
    console.log('Doctor notes saved');
    socket.emit('notes_saved', doctorNotes);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    emitOnlineCounts();
  });
});

// Start
server.listen(PORT, () => {
  console.log(`\n  MediLink server running`);
  console.log(`  Open: http://localhost:${PORT}\n`);
});
