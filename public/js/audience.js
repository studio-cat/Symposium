// public/js/audience.js
const socket = io();

// Tell server this client is audience
socket.emit("joinRole", "audience");

const slideImg = document.getElementById("slide");
const activityDiv = document.getElementById("activity");
const form = document.getElementById("activity-form");
const answerInput = document.getElementById("answer");
const thanks = document.getElementById("thanks");

// ----------------------------
// Receive slide sync
// ----------------------------
socket.on("slideChanged", (idx) => {
  slideImg.src = `/slides/slide${idx}.png`;
  activityDiv.style.display = "none";
  thanks.style.display = "none";
  answerInput.value = "";
});

// ----------------------------
// Show activity when presenter starts it
// ----------------------------
socket.on("activityStarted", () => {
  activityDiv.style.display = "block";
  thanks.style.display = "none";
  answerInput.value = "";
});

// ----------------------------
// Submit answer
// ----------------------------
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const answer = answerInput.value.trim();
  if (!answer) return;

  socket.emit("submitResponse", { answer });
  thanks.style.display = "block";
});