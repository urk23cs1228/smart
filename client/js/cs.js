window.addEventListener("DOMContentLoaded", () => {
  // Stack Game score
  const stackScore = localStorage.getItem("stackGameFinalScore");
  if (stackScore) {
    document.getElementById("csScoreDisplay").textContent =
      `Your Best Score: ${stackScore}%`;
  } else {
    document.getElementById("csScoreDisplay").textContent =
      "No score yet. Play the game!";
  }

  // Search Game score
  const searchScore = localStorage.getItem("searchGameFinalScore");
  if (searchScore) {
    document.getElementById("searchScoreDisplay").textContent =
      `Your Best Score: ${searchScore}%`;
  } else {
    document.getElementById("searchScoreDisplay").textContent =
      "No score yet. Play the game!";
  }

   const sortingScore = localStorage.getItem("sortingGameFinalScore");
  if (sortingScore) {
    document.getElementById("sortingScoreDisplay").textContent =
      `Your Best Score: ${sortingScore}%`;
  } else {
    document.getElementById("sortingScoreDisplay").textContent =
      "No score yet. Play the game!";
  }

});
  function goBack() {
    window.location.href = "games.html";
  }

