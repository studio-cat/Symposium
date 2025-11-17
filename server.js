// SETUP
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { spawn } = require('child_process');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

//  --------------------------------

let currentSlide = 0;
let activityActive = false;
let activityResponses = []; // array of { answer: '...' }

// helper: aggregate responses
function buildSummary(responses) {
  const counts = {};
  for (const r of responses) {
    const key = r.answer || 'blank';
    counts[key] = (counts[key] || 0) + 1;
  }
  return {
    total: responses.length,
    counts,
  };
}

io.on('connection', (socket) => {
  console.log('connected:', socket.id);

  // default: send current slide on join
  socket.emit('slideChanged', currentSlide);

  // audience vs presenter
  socket.on('joinRole', (role) => {
    if (role === 'presenter') {
      socket.join('presenters');
      console.log('presenter joined:', socket.id);
      // send current summary if an activity is running
      if (activityActive) {
        socket.emit('activitySummary', buildSummary(activityResponses));
      }
    } else {
      socket.join('audience');
      console.log('audience joined:', socket.id);
    }
  });

  // slide navigation (presenter)
  socket.on('changeSlide', (newIndex) => {
    currentSlide = newIndex;
    // reset activity state when slide changes
    activityActive = false;
    activityResponses = [];
    io.emit('slideChanged', currentSlide);
  });

  // start activity (presenter)
  socket.on('startActivity', () => {
    activityActive = true;
    activityResponses = [];
    io.to('audience').emit('activityStarted');  // show UI to audience
    io.to('presenters').emit('activitySummary', buildSummary(activityResponses));
  });

  // audience submits
  socket.on('submitResponse', (payload) => {
    if (!activityActive) return;
    activityResponses.push(payload);
    const summary = buildSummary(activityResponses);
    io.to('presenters').emit('activitySummary', summary);
  });

  // optional: run python on current responses
  socket.on('runPython', () => {
    const py = spawn('python3', ['python/analysis.py']);

    py.stdin.write(JSON.stringify(activityResponses));
    py.stdin.end();

    let output = '';
    py.stdout.on('data', (chunk) => {
      output += chunk.toString();
    });

    py.on('close', (code) => {
      io.to('presenters').emit('pythonResult', output);
    });
  });

  socket.on('disconnect', () => {
    console.log('disconnected:', socket.id);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`listening on http://localhost:${PORT}`);
});