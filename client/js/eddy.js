let chosenPlate = null;
let ball = document.getElementById("ball");
let dropZone = document.getElementById("dropZone");
let msg = document.getElementById("message");

// ✅ Use sessionStorage for username (same as biology & ohms.js)
const username = sessionStorage.getItem("loggedInUser") || "guest";
const subject = "Physics";
const gameName = "Eddy Current Maze";

// ---------------- Helper: update progress ----------------
function updateProgress(value) {
  let prev = parseInt(localStorage.getItem(`progress_${username}_${subject}_${gameName}`) || "0");
  if (value > prev) {
    localStorage.setItem(`progress_${username}_${subject}_${gameName}`, value);
  }
}

// ---------------- Drag events ----------------
document.querySelectorAll(".plate").forEach(p => {
  p.addEventListener("dragstart", e => {
    chosenPlate = e.target.id;
    updateProgress(25); // started interacting
  });
});

dropZone.addEventListener("dragover", e => e.preventDefault());

dropZone.addEventListener("drop", e => {
  e.preventDefault();
  if (chosenPlate) {
    dropZone.innerText = chosenPlate === "solidPlate"
      ? "Solid Plate in Place"
      : "Slitted Plate in Place";
    msg.innerText = "✅ Plate positioned. Now drop the ball!";
    msg.className = "message success";
    updateProgress(50); // plate placed
  }
});

// ---------------- Progress Submit ----------------
async function submitProgress() {
  let progress = parseInt(localStorage.getItem(`progress_${username}_${subject}_${gameName}`) || "0");

  if (!chosenPlate) {
    document.getElementById("submitMessage").innerText = "❌ Place a plate before submitting.";
    document.getElementById("submitMessage").style.color = "red";
    return;
  }

  try {
    const res = await fetch("http://localhost:5001/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, subject, gameName, progressPercent: progress })
    });
    const data = await res.json();
    if (res.ok) {
      document.getElementById("submitMessage").innerText =
        `📊 Progress saved: ${progress}% (Synced to server)`;
      document.getElementById("submitMessage").style.color = "green";
      console.log("✅ Eddy progress uploaded:", data);
    } else {
      console.warn("❌ Upload failed:", data);
    }
  } catch (err) {
    console.error("❌ Failed to sync with DB", err);
    document.getElementById("submitMessage").innerText =
      `📊 Progress saved locally: ${progress}% (No internet)`;
    document.getElementById("submitMessage").style.color = "orange";
  }
}

// ---------------- Drop Ball ----------------
function dropBall() {
  ball.style.transition = "none";
  ball.style.top = "10px";
  setTimeout(() => {
    if (chosenPlate === "solidPlate") {
      ball.style.transition = "top 6s linear";
      ball.style.top = "450px";
      msg.innerText = "⚡ Eddy currents slow the ball in Solid Plate.";
      msg.className = "message success";
      updateProgress(100);
    } else if (chosenPlate === "slittedPlate") {
      ball.style.transition = "top 2s linear";
      ball.style.top = "450px";
      msg.innerText = "💨 Slitted Plate reduces eddy currents → ball falls faster.";
      msg.className = "message success";
      updateProgress(100);
    } else {
      ball.style.transition = "top 1.5s linear";
      ball.style.top = "450px";
      msg.innerText = "❌ No plate! Ball falls freely.";
      msg.className = "message error";
      updateProgress(75);
    }
  }, 100);
}

// ---------------- Go Back ----------------
function goBack() {
  window.location.href = "phy.html";
}
