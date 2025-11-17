const socket = io();

let currentSlide = 1;
let currentLabel = "red";
let supervisedPoints = [];

// Label picker
document.getElementById("label-picker").addEventListener("click", (e) => {
  if (e.target.tagName === "BUTTON") {
    currentLabel = e.target.dataset.label;
    document.getElementById("chosen-label").textContent = currentLabel;
  }
});

socket.on("slideChanged", ({ slide }) => {
  currentSlide = slide;
  // If slide 7 is the supervised activity, we just wait
  // for "activityStarted" to actually draw the points.
});

// When presenter starts supervised activity
socket.on("activityStarted", ({ activityId, points }) => {
  if (activityId !== "supervised") return;

  supervisedPoints = points;
  drawSupervisedPoints(points);
});

function drawSupervisedPoints(points) {
  const canvas = document.getElementById("canvas");
  canvas.innerHTML = "";

  const rect = canvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;

  points.forEach((p) => {
    const div = document.createElement("div");
    div.className = "point";
    div.style.left = (p.x * w) + "px";
    div.style.top = (p.y * h) + "px";
    div.dataset.pointId = p.id;

    div.addEventListener("click", () => {
      socket.emit("submitClassification", {
        activityId: "supervised",
        pointId: p.id,
        label: currentLabel
      });
      // Optional: give local visual feedback
      div.style.background = currentLabel === "red" ? "red" : "blue";
    });

    canvas.appendChild(div);
  });
}