// public/js/shared.js

// Adjust to your actual slide count
const SLIDE_COUNT = 10;
let currentSlide = 0;

function updateSlideImage(imgId) {
  const img = document.getElementById(imgId);
  if (!img) return;
  img.src = `/slides/slide${currentSlide}.png`;
  const label = document.getElementById("slideLabel");
  if (label) {
    label.textContent = `Slide ${currentSlide}`;
  }
}

function setupSlideControls(imgId) {
  updateSlideImage(imgId);

  const prevBtn = document.getElementById("prevSlide");
  const nextBtn = document.getElementById("nextSlide");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      currentSlide = (currentSlide - 1 + SLIDE_COUNT) % SLIDE_COUNT;
      updateSlideImage(imgId);
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      currentSlide = (currentSlide + 1) % SLIDE_COUNT;
      updateSlideImage(imgId);
    });
  }
}

// Map score in [-1, 1] to a color between deep blue, purple, deep red.
function scoreToColor(score) {
  // clamp
  score = Math.max(-1, Math.min(1, score));
  // -1 => blue (70, 99, 235), 0 => purple (128, 90, 213), 1 => red (239, 68, 68)
  const blue = { r: 59, g: 130, b: 246 };
  const purple = { r: 129, g: 90, b: 213 };
  const red = { r: 239, g: 68, b: 68 };

  let c1, c2, t;
  if (score < 0) {
    // interpolate blue -> purple
    t = (score + 1) / 1; // [-1,0] -> [0,1]
    c1 = blue;
    c2 = purple;
  } else {
    // interpolate purple -> red
    t = score; // [0,1]
    c1 = purple;
    c2 = red;
  }

  const r = Math.round(c1.r + t * (c2.r - c1.r));
  const g = Math.round(c1.g + t * (c2.g - c1.g));
  const b = Math.round(c1.b + t * (c2.b - c1.b));
  return `rgb(${r}, ${g}, ${b})`;
}

window.Shared = {
  setupSlideControls,
  scoreToColor
};