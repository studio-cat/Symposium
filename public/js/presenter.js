const socket = io();

let currentSlide = 1;
let supervisedPoints = [];

document.getElementById("prev-slide").addEventListener("click", () => {
  currentSlide = Math.max(1, currentSlide - 1);
  socket.emit("goToSlide", { slide: currentSlide });
});

document.getElementById("next-slide").addEventListener("click", () => {
  currentSlide += 1;
  socket.emit("goToSlide", { slide: currentSlide });
});

document.getElementById("start-supervised").addEventListener("click", () => {
  // Optionally force slide 7
  currentSlide = 7;
  socket.emit("goToSlide", { slide: currentSlide });

  socket.emit("startActivity", { activityId: "supervised" });
});

socket.on("slideChanged", ({ slide }) => {
  currentSlide = slide;
  document.getElementById("slide-label").textContent = `Slide ${slide}`;
});

// Initial points for supervised activity
socket.on("activityStarted", ({ activityId, points }) => {
  if (activityId !== "supervised") return;
  supervisedPoints = points;
  drawPresenterPoints(points, null);
});

// Live summary from Python
socket.on("activitySummary", ({ activityId, summary }) => {
  if (activityId !== "supervised") return;
  drawPresenterPoints(summary.points, summary);
});

function drawPresenterPoints(points, summary) {
  const canvas = document.getElementById("canvas");
  canvas.innerHTML = "";

  const rect = canvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;

  const summaryById = {};
  if (summary && summary.points) {
    summary.points.forEach((p) => {
      summaryById[p.id] = p;
    });
  }

  points.forEach((p) => {
    // p may already have summary fields if calling with summary.points
    const basePoint = summaryById[p.id] || p;

    const div = document.createElement("div");
    div.className = "point";
    div.style.left = (basePoint.x * w) + "px";
    div.style.top = (basePoint.y * h) + "px";

    let color = "gray";
    if (basePoint.majority === "red") color = "red";
    if (basePoint.majority === "blue") color = "blue";
    if (basePoint.disagreement) color = "purple";

    div.style.background = color;

    // Tooltip-ish info
    div.title = basePoint.total
      ? `Total: ${basePoint.total}\n${JSON.stringify(basePoint.counts)}`
      : "No responses yet";

    canvas.appendChild(div);
  });
}