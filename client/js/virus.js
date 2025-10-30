let virusDNA = "ATGC";
let score = 0;
const MAX_SCORE = 20; // 20 points = 100%

function mutateDNA(seq) {
  let bases = ["A", "T", "G", "C"];
  let pos = Math.floor(Math.random() * seq.length);
  let newBase;
  do {
    newBase = bases[Math.floor(Math.random() * bases.length)];
  } while (newBase === seq[pos]);
  return seq.slice(0, pos) + newBase + seq.slice(pos + 1);
}

function getComplement(seq) {
  return seq.replace(/./g, base => {
    switch (base) {
      case "A": return "T";
      case "T": return "A";
      case "G": return "C";
      case "C": return "G";
    }
  });
}

function submitAnswer() {
  let input = document.getElementById("playerInput").value.toUpperCase();
  let correct = getComplement(virusDNA);
  let msg = document.getElementById("message");

  if (input === correct) {
    msg.innerHTML = "✅ Caught! Immune system wins!";
    msg.className = "message success";
    score++;
    document.getElementById("score").innerText = score;

    // ✅ Auto-save progress on correct answer
    saveProgressToServer();
  } else {
    msg.innerHTML = `❌ Wrong! Virus mutates... Correct was ${correct}`;
    msg.className = "message error";
  }
}

function nextRound() {
  virusDNA = mutateDNA(virusDNA);
  document.getElementById("dnaSeq").innerText = virusDNA;
  document.getElementById("playerInput").value = "";
  document.getElementById("message").innerText = "";
}

// ✅ Centralized save function (local + server)
async function saveProgressToServer() {
  const username = sessionStorage.getItem("loggedInUser") || "guest";
  const subject = "Biology";
  const gameName = "Virus Mutation Chase";
  const progressPercent = Math.min(100, Math.round((score / MAX_SCORE) * 100));

  // Save locally (for offline support)
  localStorage.setItem(`progress_${username}_${subject}_${gameName}`, progressPercent);
  localStorage.setItem(`score_${username}_${subject}_${gameName}`, score);

  try {
    const res = await fetch("http://localhost:5001/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, subject, gameName, progressPercent })
    });

    if (res.ok) {
      console.log(`📊 Progress synced: ${progressPercent}%`);
    } else {
      console.warn("⚠️ Server sync failed, saved locally.");
    }
  } catch (err) {
    console.error("⚠️ Offline, progress kept locally:", err);
  }
}

// ✅ Finish game button
function finishGame() {
  const finalProgress = Math.min(100, Math.round((score / MAX_SCORE) * 100));
  alert(`Game Finished!\nProgress: ${finalProgress}%\nScore: ${score}`);

  // ✅ Save one last time at finish
  saveProgressToServer();
}
function goBack() {
  window.location.href = "bio.html";
}