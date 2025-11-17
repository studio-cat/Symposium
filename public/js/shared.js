// public/js/shared.js

// How many slide images you have: slide0.png ... slideN.png
// Change this number to match your deck.
const SLIDE_COUNT = 10;

const ACTIVITIES = {
  NONE: "none",
  SUPERVISED: "supervised",
};

function getSlideSrc(index) {
  return `slides/slide${index}.png`;
}

// Global socket.io connection
const socket = io();