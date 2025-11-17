// public/js/presenter.js
const socket = io();

socket.emit('joinRole', 'presenter');

const slideImg = document.getElementById('slide');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const slideNumber = document.getElementById('slide-number');
const startActivityBtn = document.getElementById('start-activity');
const runPythonBtn = document.getElementById('run-python');
const summaryDiv = document.getElementById('summary');
const pythonDiv = document.getElementById('python-output');

let currentSlide = 0;

function updateSlideDisplay() {
  slideImg.src = `/slides/slide${currentSlide}.png`;
  slideNumber.textContent = `Slide ${currentSlide}`;
}

// sync from server
socket.on('slideChanged', (idx) => {
  currentSlide = idx;
  updateSlideDisplay();
});

// simple local next/prev controls
prevBtn.addEventListener('click', () => {
  if (currentSlide > 0) {
    currentSlide -= 1;
    socket.emit('changeSlide', currentSlide);
  }
});

nextBtn.addEventListener('click', () => {
  currentSlide += 1;
  socket.emit('changeSlide', currentSlide);
});

// keyboard navigation (optional)
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') {
    currentSlide += 1;
    socket.emit('changeSlide', currentSlide);
  }
  if (e.key === 'ArrowLeft' && currentSlide > 0) {
    currentSlide -= 1;
    socket.emit('changeSlide', currentSlide);
  }
});

// start an activity on current slide
startActivityBtn.addEventListener('click', () => {
  socket.emit('startActivity');
});

// live summary only visible to presenter
socket.on('activitySummary', (summary) => {
  summaryDiv.textContent = JSON.stringify(summary, null, 2);
});

// run python on responses
runPythonBtn.addEventListener('click', () => {
  socket.emit('runPython');
});

socket.on('pythonResult', (output) => {
  pythonDiv.textContent = output;
});