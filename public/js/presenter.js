// public/js/presenter.js

let summaryPollInterval = null;

function updateSummaryUI(data) {
  const summaryText = document.getElementById("summaryText");
  const summaryChip = document.getElementById("summaryChip");
  const summaryColor = document.getElementById("summaryColor");

  if (!data || !data.current_test) {
    summaryText.textContent = "No active test point.";
    if (summaryChip) summaryChip.style.display = "none";
    return;
  }

  const idx = data.current_test.index;
  const votes = data.votes || { above: 0, below: 0, score: 0 };
  const total = votes.above + votes.below;

  summaryText.textContent =
    `Test point ${idx + 1} of ${data.test_count} — ` +
    (total === 0
      ? "no votes yet."
      : `${votes.above} above, ${votes.below} below (${total} votes).`);

  if (summaryChip && summaryColor) {
    summaryChip.style.display = "inline-flex";
    const c = Shared.scoreToColor(votes.score || 0);
    summaryColor.style.backgroundColor = c;
  }
}

async function pollSummary() {
  try {
    const res = await fetch("/api/supervised/summary");
    const data = await res.json();
    updateSummaryUI(data);
  } catch (e) {
    console.error(e);
  }
}

async function initSupervisedActivityPresenter() {
  await fetch("/api/supervised/init");
  await pollSummary();

  if (summaryPollInterval) clearInterval(summaryPollInterval);
  summaryPollInterval = setInterval(pollSummary, 1500);

  const nextPointBtn = document.getElementById("btnNextPoint");
  nextPointBtn.onclick = async () => {
    await fetch("/api/supervised/advance", { method: "POST" });
    await pollSummary();
  };
}

document.addEventListener("DOMContentLoaded", () => {
  Shared.setupSlideControls("presenterSlide");

  const activityArea = document.getElementById("activityArea");
  const supervisedBtn = document.getElementById("btnSupervised");

  supervisedBtn.addEventListener("click", () => {
    activityArea.style.display = "block";
    initSupervisedActivityPresenter();
  });
});