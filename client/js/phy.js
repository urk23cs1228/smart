window.addEventListener("DOMContentLoaded", () => {
  // Ohm’s Law Progress
  const ohmsProgress = localStorage.getItem("ohmsLabProgress");
  if (ohmsProgress !== null) {
    document.getElementById("ohmsScoreDisplay").textContent =
      `Learning Progress: ${ohmsProgress}%`;
  } else {
    document.getElementById("ohmsScoreDisplay").textContent =
      `Learning Progress: 0%`;
  }

  // Circuit Builder Progress
  const circuitProgress = localStorage.getItem("circuitGameProgress");
  if (circuitProgress !== null) {
    document.getElementById("circuitScoreDisplay").textContent =
      `Learning Progress: ${circuitProgress}%`;
  } else {
    document.getElementById("circuitScoreDisplay").textContent =
      `Learning Progress: 0%`;
  }

  // Eddy Current Progress
  const eddyProgress = localStorage.getItem("eddyGameProgress");
  if (eddyProgress !== null) {
    document.getElementById("eddyScoreDisplay").textContent =
      `Learning Progress: ${eddyProgress}%`;
  } else {
    document.getElementById("eddyScoreDisplay").textContent =
      `Learning Progress: 0%`;
  }
});
  function goBack() {
    window.location.href = "games.html";
  }
