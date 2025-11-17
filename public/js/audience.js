// public/js/audience.js

let trainPoints = [];
let currentTest = null;
let lastVotedIndex = null;
let statePollInterval = null;

function drawAudienceCanvas() {
  const canvas = document.getElementById("audienceCanvas");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  // Draw diagonal line x=y
  ctx.strokeStyle = "#9ca3af";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(w, 0);
  ctx.stroke();

  // Helper to map [0,1] -> canvas
  const fx = x => x * (w * 0.8) + w * 0.1;
  const fy = y => h - (y * (h * 0.8) + h * 0.1);

  // Draw training points
  for (const p of trainPoints) {
    ctx.beginPath();
    const cx = fx(p.x);
    const cy = fy(p.y);
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = p.label === "above" ? "#ef4444" : "#3b82f6";
    ctx.fill();
  }

  // Draw current test point
  if (currentTest) {
    ctx.beginPath();
    const cx = fx(currentTest.x);
    const cy = fy(currentTest.y);
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fillStyle = "#111827";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#f59e0b";
    ctx.stroke();
  }
}

async function loadSupervisedState() {
  const res = await fetch("/api/supervised/state");
  const data = await res.json();
  trainPoints = data.train;
  currentTest = data.current_test;
  drawAudienceCanvas();
}

async function initSupervisedActivityAudience() {
  await fetch("/api/supervised/init"); // ensures state exists
  await loadSupervisedState();

  if (statePollInterval) clearInterval(statePollInterval);
  statePollInterval = setInterval(loadSupervisedState, 1500);

  const aboveBtn = document.getElementById("btnAbove");
  const belowBtn = document.getElementById("btnBelow");
  const status = document.getElementById("audienceStatus");

  function canVote() {
    return currentTest && lastVotedIndex !== currentTest.index;
  }

  async function vote(label) {
    if (!canVote()) return;
    try {
      const res = await fetch("/api/supervised/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label })
      });
      const data = await res.json();
      if (data.ok) {
        lastVotedIndex = data.current_index;
        status.textContent = `Thanks! Your vote for "${label}" has been recorded.`;
      }
    } catch (e) {
      console.error(e);
      status.textContent = "Error sending vote.";
    }
  }

  aboveBtn.onclick = () => vote("above");
  belowBtn.onclick = () => vote("below");
}

document.addEventListener("DOMContentLoaded", () => {
  Shared.setupSlideControls("audienceSlide");

  const activityArea = document.getElementById("activityArea");
  const supervisedBtn = document.getElementById("btnSupervised");

  supervisedBtn.addEventListener("click", () => {
    activityArea.style.display = "block";
    initSupervisedActivityAudience();
  });

  // Initialize canvas size once DOM is ready
  const canvas = document.getElementById("audienceCanvas");
  if (canvas) {
    canvas.width = 500;
    canvas.height = 350;
  }
});