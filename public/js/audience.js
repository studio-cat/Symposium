// public/js/audience.js

let currentSlide = 0;
let currentActivity = ACTIVITIES.NONE;

// DOM
const slideImg = document.getElementById("slide-img");
const activityContainer = document.getElementById("activity-container");

function renderSlide() {
  slideImg.src = getSlideSrc(currentSlide);
}

// Listen for slide changes from presenter
socket.on("slide-change", (data) => {
  if (typeof data.slide === "number") {
    currentSlide = data.slide;
    renderSlide();
  }
});

// Listen for activity selection from presenter
socket.on("activity-change", (data) => {
  currentActivity = data.activity || ACTIVITIES.NONE;
  if (currentActivity === ACTIVITIES.SUPERVISED) {
    setupSupervisedUI();
  } else {
    activityContainer.innerHTML = "";
  }
});

// Optionally get initial state from server
socket.on("slide-state", (data) => {
  if (typeof data.slide === "number") {
    currentSlide = data.slide;
    renderSlide();
  }
  currentActivity = data.activity || ACTIVITIES.NONE;
  if (currentActivity === ACTIVITIES.SUPERVISED) {
    setupSupervisedUI();
  } else {
    activityContainer.innerHTML = "";
  }
});

/* ---------- SUPERVISED LEARNING ACTIVITY ---------- */

// Data model for supervised activity
const supervisedState = {
  training: [], // { x, y, label: "red"|"blue" }
  test: [],     // { x, y }
  currentIndex: 0,
};

function setupSupervisedUI() {
  // Inject UI
  activityContainer.innerHTML = `
    <h2>Supervised Learning: Classify the point</h2>
    <p>We trained on two clusters (red vs blue). Now classify the new point!</p>
    <canvas id="supervisedCanvas" width="600" height="400"></canvas>
    <div id="supervisedControls">
      <span id="supervisedStatus"></span>
      <div>
        <button id="btnRed">Cluster A (red)</button>
        <button id="btnBlue">Cluster B (blue)</button>
      </div>
    </div>
  `;

  generateSupervisedData();
  drawSupervisedCanvas();
  updateSupervisedStatus();

  const btnRed = document.getElementById("btnRed");
  const btnBlue = document.getElementById("btnBlue");

  btnRed.addEventListener("click", () => handleSupervisedAnswer("red"));
  btnBlue.addEventListener("click", () => handleSupervisedAnswer("blue"));
}

function generateSupervisedData() {
  supervisedState.training = [];
  supervisedState.test = [];
  supervisedState.currentIndex = 0;

  // 25 training points in two clusters:
  // Red cluster above x=y (e.g. near (0.3, 0.7))
  for (let i = 0; i < 12; i++) {
    supervisedState.training.push({
      x: 0.3 + (Math.random() - 0.5) * 0.15,
      y: 0.7 + (Math.random() - 0.5) * 0.15,
      label: "red",
    });
  }

  // Blue cluster below x=y (e.g. near (0.7, 0.3))
  for (let i = 0; i < 13; i++) {
    supervisedState.training.push({
      x: 0.7 + (Math.random() - 0.5) * 0.15,
      y: 0.3 + (Math.random() - 0.5) * 0.15,
      label: "blue",
    });
  }

  // 10 test points sprinkled around the diagonal x≈y
  for (let i = 0; i < 10; i++) {
    const base = 0.2 + 0.06 * i; // spreads along diagonal
    supervisedState.test.push({
      x: base + (Math.random() - 0.5) * 0.05,
      y: base + (Math.random() - 0.5) * 0.05,
    });
  }
}

function drawSupervisedCanvas() {
  const canvas = document.getElementById("supervisedCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const w = canvas.width;
  const h = canvas.height;

  // Clear
  ctx.clearRect(0, 0, w, h);

  // Draw background & axes
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "#cccccc";
  ctx.lineWidth = 1;

  // Axes border
  ctx.strokeRect(40, 20, w - 60, h - 60);

  // Diagonal x = y
  ctx.beginPath();
  const x0 = 40;
  const y0 = h - 40;
  const x1 = w - 20;
  const y1 = 20;
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.strokeStyle = "#999999";
  ctx.setLineDash([5, 4]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Helper to map [0,1] → canvas coords
  function toCanvasX(x) {
    return 40 + x * (w - 60);
  }
  function toCanvasY(y) {
    // y increases downward in canvas
    return h - 40 - y * (h - 60);
  }

  // Draw training points
  supervisedState.training.forEach((p) => {
    ctx.beginPath();
    ctx.arc(toCanvasX(p.x), toCanvasY(p.y), 5, 0, Math.PI * 2);
    ctx.fillStyle = p.label === "red" ? "#d32f2f" : "#1565c0";
    ctx.fill();
  });

  // Draw current test point
  if (supervisedState.currentIndex < supervisedState.test.length) {
    const tp = supervisedState.test[supervisedState.currentIndex];
    ctx.beginPath();
    ctx.arc(toCanvasX(tp.x), toCanvasY(tp.y), 7, 0, Math.PI * 2);
    ctx.fillStyle = "#000000";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#000000";
    ctx.stroke();
  }
}

function updateSupervisedStatus() {
  const status = document.getElementById("supervisedStatus");
  if (!status) return;

  const idx = supervisedState.currentIndex;
  const total = supervisedState.test.length;

  if (idx >= total) {
    status.textContent = "All 10 points classified – thank you!";
  } else {
    status.textContent = `Point ${idx + 1} of ${total}: choose a cluster.`;
  }
}

function handleSupervisedAnswer(label) {
  const idx = supervisedState.currentIndex;
  const total = supervisedState.test.length;
  if (idx >= total) return;

  // Send answer to server for aggregation
  socket.emit("supervised-answer", {
    pointIndex: idx,
    label, // "red" or "blue"
  });

  supervisedState.currentIndex += 1;
  updateSupervisedStatus();
  drawSupervisedCanvas();
}

// Initial slide
renderSlide();