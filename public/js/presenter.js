// public/js/presenter.js

let currentSlide = 0;
let currentActivity = ACTIVITIES.NONE;

// DOM elements
const slideImg = document.getElementById("slide-img");
const slideLabel = document.getElementById("slideLabel");
const activityTitle = document.getElementById("activity-title");
const supervisedSummary = document.getElementById("supervised-summary");

// Slide controls (presenter only)
const prevBtn = document.getElementById("prevSlide");
const nextBtn = document.getElementById("nextSlide");

// Activity buttons (presenter only)
const btnSupervised = document.getElementById("btnSupervised");

function renderSlide() {
  slideImg.src = getSlideSrc(currentSlide);
  slideLabel.textContent = `Slide ${currentSlide + 1} / ${SLIDE_COUNT}`;

  // Broadcast to audience
  socket.emit("slide-change", { slide: currentSlide });
}

function setActivity(activity) {
  currentActivity = activity;
  if (activity === ACTIVITIES.SUPERVISED) {
    activityTitle.textContent = "Supervised Learning – Audience Results";
  } else {
    activityTitle.textContent = "No activity selected";
  }

  // Clear / reset summary area
  supervisedSummary.innerHTML = "";

  // Let all clients know which activity is active
  socket.emit("activity-change", { activity: currentActivity });
}

function clampSlide(idx) {
  if (idx < 0) return 0;
  if (idx >= SLIDE_COUNT) return SLIDE_COUNT - 1;
  return idx;
}

// Button handlers
prevBtn.addEventListener("click", () => {
  currentSlide = clampSlide(currentSlide - 1);
  renderSlide();
});

nextBtn.addEventListener("click", () => {
  currentSlide = clampSlide(currentSlide + 1);
  renderSlide();
});

btnSupervised.addEventListener("click", () => {
  if (currentActivity === ACTIVITIES.SUPERVISED) {
    setActivity(ACTIVITIES.NONE);
  } else {
    setActivity(ACTIVITIES.SUPERVISED);
  }
});

// Receive slide state from server (optional; useful if you broadcast initial state)
socket.on("slide-state", (data) => {
  if (typeof data.slide === "number") {
    currentSlide = clampSlide(data.slide);
    renderSlide();
  }
  if (data.activity) {
    currentActivity = data.activity;
    if (currentActivity === ACTIVITIES.SUPERVISED) {
      activityTitle.textContent = "Supervised Learning – Audience Results";
    } else {
      activityTitle.textContent = "No activity selected";
    }
  }
});

// Receive aggregated summary for supervised activity
// Expected payload format:
// {
//   points: [
//     { index: 0, red: 5, blue: 3 },
//     { index: 1, red: 1, blue: 7 },
//     ...
//   ]
// }
socket.on("supervised-summary", (summary) => {
  if (currentActivity !== ACTIVITIES.SUPERVISED) return;
  if (!summary || !Array.isArray(summary.points)) return;

  supervisedSummary.innerHTML = "";

  summary.points.forEach((p) => {
    const total = (p.red || 0) + (p.blue || 0);
    const redRatio = total > 0 ? p.red / total : 0.5; // default purple if no answers

    const color = ratioToRedPurpleBlue(redRatio);

    const row = document.createElement("div");
    row.className = "summary-row";

    const labelSpan = document.createElement("span");
    labelSpan.textContent = `Point ${p.index + 1}: `;

    const box = document.createElement("span");
    box.className = "summary-color-box";
    box.style.backgroundColor = color;

    const counts = document.createElement("span");
    counts.className = "summary-counts";
    counts.textContent = `  red: ${p.red || 0}, blue: ${p.blue || 0}`;

    row.appendChild(labelSpan);
    row.appendChild(box);
    row.appendChild(counts);

    supervisedSummary.appendChild(row);
  });
});

// Map redRatio ∈ [0,1] to deep blue → purple → deep red
// 0   => blue  (0, 0, 255)
// 0.5 => purple (127, 0, 127)
// 1   => red (255, 0, 0)
function ratioToRedPurpleBlue(redRatio) {
  const r = Math.round(255 * redRatio);
  const b = Math.round(255 * (1 - redRatio));
  return `rgb(${r}, 0, ${b})`;
}

// Initial render and broadcast initial state
renderSlide();
setActivity(ACTIVITIES.NONE);