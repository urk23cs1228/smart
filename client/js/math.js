window.addEventListener("DOMContentLoaded", () => {
  const username = localStorage.getItem("username") || "guest";

  // ---------- INTEGRAL PROGRESS ----------
  const integralProgress = localStorage.getItem("integralProgress");
  const integralScore = localStorage.getItem("integralFinalScore");

  if (integralProgress && integralScore) {
    document.getElementById("integralScoreDisplay").textContent =
      `Progress: ${integralProgress}% | Best Score: ${integralScore}%`;
  } else {
    document.getElementById("integralScoreDisplay").textContent = "Not started yet";
  }

  fetch(`/api/getProgress?username=${username}&gameName=Integral Curve Catcher`)
    .then(res => res.json())
    .then(data => {
      if (data && data.progressPercent !== undefined) {
        document.getElementById("integralScoreDisplay").textContent =
          `Progress: ${data.progressPercent}% | Best Score: ${data.finalScore}%`;
        localStorage.setItem("integralProgress", data.progressPercent);
        localStorage.setItem("integralFinalScore", data.finalScore);
      }
    })
    .catch(err => console.log("Offline, using localStorage for integrals:", err));

  // ---------- TRIANGLE PROGRESS ----------
  const triangleProgress = localStorage.getItem("triangleProgress");
  const triangleScore = localStorage.getItem("triangleFinalScore");

  if (triangleProgress && triangleScore) {
    document.getElementById("triangleScoreDisplay").textContent =
      `Progress: ${triangleProgress}% | Best Score: ${triangleScore}%`;
  } else {
    document.getElementById("triangleScoreDisplay").textContent = "Not started yet";
  }

  fetch(`/api/getTriangleProgress?username=${username}`)
    .then(res => res.json())
    .then(data => {
      if (data && data.progressPercent !== undefined) {
        document.getElementById("triangleScoreDisplay").textContent =
          `Progress: ${data.progressPercent}% | Best Score: ${data.finalScore}%`;
        localStorage.setItem("triangleProgress", data.progressPercent);
        localStorage.setItem("triangleFinalScore", data.finalScore);
      }
    })
    .catch(err => console.log("Offline, using localStorage for triangle:", err));

  // ---------- TRIGONOMETRY PROGRESS ----------
  const trigProgress = localStorage.getItem("trigProgress");
  const trigScore = localStorage.getItem("trigFinalScore");

  if (trigProgress && trigScore) {
    document.getElementById("trigScoreDisplay").textContent =
      `Progress: ${trigProgress}% | Best Score: ${trigScore}%`;
  } else {
    document.getElementById("trigScoreDisplay").textContent = "Not started yet";
  }

  fetch(`/api/getProgress?username=${username}&gameName=Trigonometry Angle Blaster`)
    .then(res => res.json())
    .then(data => {
      if (data && data.progressPercent !== undefined) {
        document.getElementById("trigScoreDisplay").textContent =
          `Progress: ${data.progressPercent}% | Best Score: ${data.finalScore}%`;
        localStorage.setItem("trigProgress", data.progressPercent);
        localStorage.setItem("trigFinalScore", data.finalScore);
      }
    })
    .catch(err => console.log("Offline, using localStorage for trigonometry:", err));
});

// Back button for all games
function goBack() {
  window.location.href = "games.html";
}
