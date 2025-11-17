// server.js
const path = require("path");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

let state = {
  currentSlide: 0,
  currentActivityId: null,
  // activityId -> array of responses
  responses: {}
};

io.on("connection", (socket) => {
  console.log("client connected", socket.id);

  socket.on("joinRole", (role) => {
    socket.role = role; // "presenter" or "audience"
    socket.join(role);
    // send current state so new client syncs immediately
    socket.emit("initialState", state);
  });

  socket.on("changeSlide", ({ slideIndex }) => {
    state.currentSlide = slideIndex;
    io.emit("slideChanged", { slideIndex });
  });

  socket.on("setActivity", ({ activityId }) => {
    state.currentActivityId = activityId || null;
    if (activityId && !state.responses[activityId]) {
      state.responses[activityId] = [];
    }
    io.emit("activityChanged", { activityId });
  });

  socket.on("submitActivityResponse", ({ activityId, payload }) => {
    if (!activityId) return;
    if (!state.responses[activityId]) {
      state.responses[activityId] = [];
    }
    state.responses[activityId].push(payload);

    // Very simple aggregate: just send all raw responses to presenter
    io.to("presenter").emit("activityAggregate", {
      activityId,
      responses: state.responses[activityId]
    });
  });

  socket.on("requestInitialState", () => {
    socket.emit("initialState", state);
  });

  socket.on("disconnect", () => {
    console.log("client disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("listening on http://localhost:" + PORT);
});