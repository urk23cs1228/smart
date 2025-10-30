window.addEventListener("DOMContentLoaded", () => {
  const username = sessionStorage.getItem("loggedInUser");
  const subject = "Biology";

 const games = [
  { name: "Mitochondria", displayEl: document.getElementById("bioScoreDisplay") },
  { name: "Virus Mutation Chase", displayEl: document.getElementById("virusScoreDisplay") },
  { name: "Mitochondria1", displayEl: document.getElementById("bio1ScoreDisplay") },
  { name: "Blood Arena", displayEl: document.getElementById("bloodScoreDisplay") } // ✅ new
];



  // ✅ Function to show from localStorage
  function showFromLocal(game) {
    const progress = parseInt(localStorage.getItem(`progress_${username}_${subject}_${game.name}`)) || 0;
    const score = parseInt(localStorage.getItem(`score_${username}_${subject}_${game.name}`)) || 0;
    game.displayEl.textContent = `Learning Progress: ${progress}%, Last Score: ${score}`;
  }

  // ✅ Function to fetch from server
  async function fetchFromServer(game) {
  try {
    const res = await fetch(`http://localhost:5001/progress/user/${username}`);
    if (!res.ok) return;

    const data = await res.json();
    const record = data.find(
      (r) => r.subject === subject && r.gameName === game.name
    );

    if (record && record.progressPercent != null) {
      game.displayEl.textContent = `Learning Progress: ${record.progressPercent}%, Last Score: ${localStorage.getItem(`score_${username}_${subject}_${game.name}`) || 0}`;
      localStorage.setItem(`progress_${username}_${subject}_${game.name}`, record.progressPercent);
    }
  } catch (err) {
    console.warn(`⚠️ Could not fetch ${game.name} progress from server`);
  }
}


  // ✅ Function to upload progress manually (for Virus or others)
  async function uploadProgress(gameName) {
    const progress = parseInt(localStorage.getItem(`progress_${username}_${subject}_${gameName}`)) || 0;
    const score = parseInt(localStorage.getItem(`score_${username}_${subject}_${gameName}`)) || 0;

    if (!progress && !score) {
      alert("⚠️ No progress found to upload!");
      return;
    }

    try {
      const res = await fetch("http://localhost:5001/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          subject,
          gameName,
          progressPercent: progress,
          score: score
        })
      });

      if (!res.ok) throw new Error("Upload failed");
      alert("✅ Progress uploaded successfully!");
    } catch (err) {
      alert("⚠️ Upload failed, you might be offline.");
      console.error(err);
    }
  }

  // ✅ Show local progress immediately
  games.forEach(showFromLocal);

  // ✅ Fetch from server (latest data if online)
  games.forEach(fetchFromServer);

  // ✅ Attach click to Upload button for Virus
  const uploadBtn = document.getElementById("uploadVirusBtn");
  if (uploadBtn) {
    uploadBtn.addEventListener("click", () => uploadProgress("Virus"));
  }
});

// ✅ Navigation
function goToGames(classId) {
  console.log("Go to class:", classId);
}
 function goBack() {
    window.location.href = "games.html";
  }
