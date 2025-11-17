// public/presenter.js
const socket = io();

const slides = Array.from(document.querySelectorAll(".slide"));
const slideLabel = document.getElementById("slideLabel");
const prevBtn = document.getElementById("prevSlide");
const nextBtn = document.getElementById("nextSlide");
const resultsRaw = document.getElementById("resultsRaw");

let currentSlide = 0;

socket.emit("joinRole", "presenter");

socket.on("initialState", (state) => {
  currentSlide = state.currentSlide || 0;
  showSlide(currentSlide);
});

socket.on("slideChanged", ({ slideIndex }) => {
  currentSlide = slideIndex;
  showSlide(currentSlide);
});

socket.on("activityAggregate", ({ activityId, responses }) => {
  // Basic dump – you can replace with plots later
  resultsRaw.textContent =
    `Activity: ${activityId}\n` + JSON.stringify(responses, null, 2);

  // Optionally render in per-activity box
  const box = document.getElementById(`results-${activityId}`);
  if (box) {
    box.textContent = `Responses (${responses.length}):\n` +
                      JSON.stringify(responses, null, 2);
  }
});

prevBtn.addEventListener("click", () => changeSlide(-1));
nextBtn.addEventListener("click", () => changeSlide(1));

function changeSlide(delta) {
  const total = slides.length;
  currentSlide = (currentSlide + delta + total) % total;
  const slideEl = slides[currentSlide];
  const activityId = slideEl.dataset.activityId || null;

  showSlide(currentSlide);

  socket.emit("changeSlide", { slideIndex: currentSlide });
  socket.emit("setActivity", { activityId });
}

function showSlide(idx) {
  slides.forEach((s, i) => s.classList.toggle("active", i === idx));
  slideLabel.textContent = `Slide ${idx + 1} / ${slides.length}`;
}