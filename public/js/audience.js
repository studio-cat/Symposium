// public/audience.js
const socket = io();

const slides = Array.from(document.querySelectorAll(".slide"));
let currentSlide = 0;
let currentActivityId = null;

socket.emit("joinRole", "audience");

// sync with server state on first connect
socket.on("initialState", (state) => {
  currentSlide = state.currentSlide || 0;
  currentActivityId = state.currentActivityId || null;
  showSlide(currentSlide);
});

// update when presenter changes slides
socket.on("slideChanged", ({ slideIndex }) => {
  currentSlide = slideIndex;
  showSlide(currentSlide);
});

// update when presenter enables a specific activity
socket.on("activityChanged", ({ activityId }) => {
  currentActivityId = activityId || null;
});

// simple supervised labels
document.querySelectorAll(".label-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (!currentActivityId) return;
    const label = btn.dataset.label;
    const status = document.getElementById("status-supervised-1");
    socket.emit("submitActivityResponse", {
      activityId: currentActivityId,
      payload: { label }
    });
    status.textContent = `You chose: ${label}`;
  });
});

function showSlide(idx) {
  slides.forEach((s, i) => s.classList.toggle("active", i === idx));
}