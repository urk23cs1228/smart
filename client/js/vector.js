// ---------- GLOBALS ----------
const rounds = [
  { type: "normal", question: "sin(30°)", correct: "1/2", options: ["√3/2", "1/2", "√2/2"] },
  { type: "normal", question: "cos(45°)", correct: "√2/2", options: ["√3/2", "√2/2", "1/2"] },
  { type: "normal", question: "tan(60°)", correct: "√3", options: ["√3/2", "1", "√3"] },
  { type: "speed", question: "Speed Round! Hit all correct values!", correct: ["1", "0"], options: ["sin(90°)=1", "cos(0°)=1", "tan(45°)=1", "sin(0°)=0", "cos(60°)=1/2", "tan(30°)=√3/3"] },
  { type: "normal", question: "sin(90°)", correct: "1", options: ["0", "1", "√2/2"] }
];

const totalRounds = rounds.length;
let currentIndex = 0;
let status = Array(totalRounds).fill('unattempted'); // correct, wrong, revealed
let score = 0;
let combo = 0;
let revealed = Array(totalRounds).fill(false);
let timerInterval;
let timeLeft = 45;

// ---------- HUD ----------
function refreshHUD() {
  document.getElementById('score').innerText = score;
  document.getElementById('combo').innerText = combo;
  const done = status.filter(s => s !== 'unattempted').length;
  const percent = ((done / totalRounds) * 100).toFixed(1);
  const progressElem = document.getElementById('progressPercent');
  if (progressElem) progressElem.innerText = `Progress: ${percent}%`;
}

// ---------- LOAD ROUND ----------
function loadRound() {
  if (currentIndex >= rounds.length) return finishGame();

  const r = rounds[currentIndex];
  document.getElementById("round").innerText = currentIndex + 1;
  document.getElementById("instructions").innerText = r.question;

  const gameArea = document.getElementById("game-area");
  gameArea.innerHTML = "";

  if (r.type === "normal") {
    const options = [...r.options].sort(() => Math.random() - 0.5);
    options.forEach(opt => {
      const div = document.createElement("div");
      div.className = "target";
      div.style.top = `${Math.random() * 400}px`;
      div.style.left = `${Math.random() * 700}px`;
      div.innerText = opt;
      div.addEventListener("click", () => checkAnswer(opt, r.correct));
      gameArea.appendChild(div);
    });
  } else if (r.type === "speed") {
    r.options.forEach(opt => {
      const div = document.createElement("div");
      div.className = "target";
      div.style.top = `${Math.random() * 400}px`;
      div.style.left = `${Math.random() * 700}px`;
      div.innerText = opt;
      div.addEventListener("click", () => {
        const val = opt.split("=")[1];
        if (r.correct.includes(val)) {
          score += 50;
          combo++;
          document.getElementById("result").innerHTML = "✅ <span class='neon-win'>Hit!</span>";
        } else {
          score -= 30;
          combo = 0;
          document.getElementById("result").innerHTML = "❌ <span class='misfire'>Miss!</span>";
        }
        status[currentIndex] = "completed";
        revealed[currentIndex] = true;
        refreshHUD();
      });
      gameArea.appendChild(div);
    });

    setTimeout(() => {
      currentIndex++;
      loadRound();
    }, 5000);
  }
}

// ---------- CHECK ANSWER ----------
function checkAnswer(selected, correct) {
  if (selected === correct) {
    score += 100;
    combo++;
    status[currentIndex] = 'correct';
    document.getElementById("result").innerHTML = "✅ <span class='neon-win'>Direct Hit!</span>";
  } else {
    score -= 50;
    combo = 0;
    status[currentIndex] = 'wrong';
    document.getElementById("result").innerHTML = "❌ <span class='misfire'>Laser Misfire!</span>";
  }
  revealed[currentIndex] = true;
  refreshHUD();
  currentIndex++;
  setTimeout(loadRound, 1500);
}

// ---------- TIMER ----------
function startTimer() {
  timerInterval = setInterval(() => {
    timeLeft--;
    const timerElem = document.getElementById("timer");
    if (timerElem) timerElem.innerText = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      finishGame();
    }
  }, 1000);
}

// ---------- FINISH GAME ----------
async function finishGame() {
  clearInterval(timerInterval);
  const done = status.filter(s => s !== 'unattempted').length;
  const percent = Math.round((done / totalRounds) * 100);

  document.getElementById("instructions").innerText = `🏁 Game Over! Final Score: ${score}`;

  const username = sessionStorage.getItem("loggedInUser") || "guest";
  const subject = "Mathematics";
  const gameName = "Trigonometry Angle Blaster";

  // ✅ Save locally (for math.html display)
  localStorage.setItem("trigProgress", percent);
  localStorage.setItem("trigFinalScore", score);

  // ✅ Upload progress to DB
  await uploadProgress(subject, gameName, percent);

  alert(`Game Finished!\nScore: ${score}\nProgress: ${percent}%`);
}

// ---------- UPLOAD PROGRESS ----------
async function uploadProgress(subject, gameName, progress) {
  const username = sessionStorage.getItem("loggedInUser");
  if (!username) {
    alert("⚠️ Please log in before uploading progress.");
    return;
  }

  try {
    const res = await fetch("http://localhost:5001/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, subject, gameName, progressPercent: progress })
    });
    if (res.ok) console.log("Progress uploaded:", progress);
  } catch (err) {
    console.error("Upload failed:", err);
  }
}

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", () => {
  refreshHUD();
  loadRound();
  startTimer();

  // ✅ Finish button at top-right
  const finishBtn = document.getElementById("finishBtn");
  if (finishBtn) {
    finishBtn.style.position = "absolute";
    finishBtn.style.top = "10px";
    finishBtn.style.right = "10px";
    finishBtn.addEventListener("click", finishGame);
  }
});

// ---------- NAVIGATION ----------
function goBack() {
  window.location.href = "math.html";
}
