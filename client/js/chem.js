window.addEventListener("DOMContentLoaded", () => {
  const score = localStorage.getItem("chemistryFinalScore");
  if (score) {
    document.getElementById("chemScoreDisplay").textContent = `Your Best Score: ${score}%`;
  }
});
window.addEventListener("DOMContentLoaded", () => {
  const score = localStorage.getItem("periodicGameFinalScore");
  if (score) {
    document.getElementById("periodicScoreDisplay").textContent =
      `Your Best Score: ${score}%`;
  }
});
  function goBack() {
    window.location.href = "games.html";
  }
