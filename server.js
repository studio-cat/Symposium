// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { spawn } = require("child_process");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));
app.use("/slides", express.static(path.join(__dirname, "slides")));

const PORT = process.env.PORT || 3000;

/**
 * In-memory state for activities.
 * You can extend this to all 6 activities later.
 */
const ACTIVITIES = {
  supervised: {
    // predefine your 20 points here
    points: Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random(), // [0,1] normalized; map to canvas later
      y: Math.random()
    })),
    // responses: { socketId: { pointId: label } }
    responses: {}
  },
  // unsupervised: { ... },
  // reinforcement: { ... },
  // tokenization: { ... },
  // embeddings: { ... },
  // attention: { ... }
};

let currentSlide = 1;

// Helper: run Python script for supervised summary
function computeSupervisedSummary(callback) {
  const activity = ACTIVITIES.supervised;
  const py = spawn("python", [path.join(__dirname, "activities", "supervised.py")]);

  const input = JSON.stringify({
    points: activity.points,
    responses: activity.responses
  });

  let output = "";
  let errorOutput = "";

  py.stdout.on("data", (chunk) => {
    output += chunk.toString();
  });

  py.stderr.on("data", (chunk) => {
    errorOutput += chunk.toString();
  });

  py.on("close", (code) => {
    if (code !== 0) {
      console.error("Python exited with code", code, errorOutput);
      return callback(new Error("Python error"));
    }
    try {
      const summary = JSON.parse(output);
      callback(null, summary);
    } catch (err) {
      console.error("Failed to parse Python output:", err);
      callback(err);
    }
  });

  py.stdin.write(input);
  py.stdin.end();
}

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Tell new client which slide we're on
  socket.emit("slideChanged", { slide: currentSlide });

  // 1) Slide navigation from presenter
  socket.on("goToSlide", ({ slide }) => {
    currentSlide = slide;
    io.emit("slideChanged", { slide });
  });

  /**
   * 2) Start an activity (from presenter)
   * e.g. when presenter arrives at slide 7, call:
   * socket.emit("startActivity", { activityId: "supervised" })
   */
  socket.on("startActivity", ({ activityId }) => {
    if (!ACTIVITIES[activityId]) return;

    if (activityId === "supervised") {
      // reset previous responses if you want
      ACTIVITIES.supervised.responses = {};

      io.emit("activityStarted", {
        activityId,
        points: ACTIVITIES.supervised.points
      });
    }

    // Later: add other activity initializations here
  });

  /**
   * 3) Audience submits classification for a single point
   * payload: { activityId: "supervised", pointId, label }
   */
  socket.on("submitClassification", ({ activityId, pointId, label }) => {
    if (activityId !== "supervised") return;

    const activity = ACTIVITIES.supervised;

    if (!activity.responses[socket.id]) {
      activity.responses[socket.id] = {};
    }
    activity.responses[socket.id][pointId] = label;

    // After each submission, compute summary and send to presenter
    computeSupervisedSummary((err, summary) => {
      if (err) {
        console.error("Error computing summary:", err);
        return;
      }
      // Only presenters need detailed summary;
      // for simplicity we broadcast & let clients decide what to do.
      io.emit("activitySummary", {
        activityId: "supervised",
        summary
      });
    });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    // Optionally remove their responses
    Object.values(ACTIVITIES).forEach((activity) => {
      if (activity.responses && activity.responses[socket.id]) {
        delete activity.responses[socket.id];
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});