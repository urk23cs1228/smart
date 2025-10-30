let numbers = [1, 2, 3, 4, 5, 6];
let cardsContainer = document.getElementById("cards");
let dragged = null;

// 🔀 Shuffle utility
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// 🎴 Render draggable cards
function renderCards(arr) {
  cardsContainer.innerHTML = "";
  arr.forEach(num => {
    let card = document.createElement("div");
    card.classList.add("card");
    card.setAttribute("draggable", "true");
    card.innerText = num;

    card.addEventListener("dragstart", () => {
      dragged = card;
      card.classList.add("dragging");
    });
    card.addEventListener("dragend", () => {
      dragged = null;
      card.classList.remove("dragging");
    });

    card.addEventListener("dragover", e => e.preventDefault());
    card.addEventListener("drop", () => {
      if (dragged) {
        let all = [...cardsContainer.children];
        let draggedIndex = all.indexOf(dragged);
        let droppedIndex = all.indexOf(card);
        if (draggedIndex < droppedIndex) {
          cardsContainer.insertBefore(dragged, card.nextSibling);
        } else {
          cardsContainer.insertBefore(dragged, card);
        }
      }
    });

    cardsContainer.appendChild(card);
  });
}

// 🔀 Shuffle cards at start
function shuffleCards() {
  shuffle(numbers);
  renderCards(numbers);
  document.getElementById("message").innerHTML = "";
  document.getElementById("bubbleSteps").innerHTML = "";
}

// ✅ Submit → check if sorted
function checkOrder() {
  let arr = [...cardsContainer.children].map(c => parseInt(c.innerText));
  let isSorted = arr.every((val, i, a) => i === 0 || a[i - 1] <= val);

  if (isSorted) {
    localStorage.setItem("sortingDone", "true");
    document.getElementById("message").innerText = "✅ Correct order submitted!";
  } else {
    document.getElementById("message").innerText = "❌ Not sorted yet!";
  }

  updateSortingProgress();
}

// 📊 Bubble Sort visualization + progress
function showBubbleSort() {
  let arr = [...cardsContainer.children].map(c => parseInt(c.innerText));
  let steps = document.getElementById("bubbleSteps");
  steps.innerHTML =
    "<h3 style='color:#ff00ff; text-shadow:0 0 8px #ff00ff;'>Bubble Sort Steps:</h3>";

  let n = arr.length;
  let stepCount = 1;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
      let div = document.createElement("div");
      div.classList.add("step");
      div.innerText = `Step ${stepCount++}: [${arr.join(", ")}]`;
      steps.appendChild(div);
    }
  }

  // ✅ Mark bubble milestone done
  localStorage.setItem("bubbleDone", "true");
  updateSortingProgress();
}

// ✅ Save progress (local + server)
async function saveProgressToServer(finalScore) {
  const username = sessionStorage.getItem("loggedInUser") || "guest";
  const subject = "Computer Science";
  const gameName = "Sorting Game";

  // Save locally too
  localStorage.setItem("sortingGameFinalScore", finalScore);

  try {
    const res = await fetch("http://localhost:5001/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        subject,
        gameName,
        progressPercent: finalScore,
      }),
    });

    if (res.ok) {
      console.log(`📊 Progress synced: ${finalScore}%`);
    } else {
      console.warn("⚠️ Server sync failed, progress saved locally.");
    }
  } catch (err) {
    console.error("Error saving progress:", err);
  }
}

// ✅ Calculate progress
function updateSortingProgress() {
  const sortingDone = localStorage.getItem("sortingDone") === "true";
  const bubbleDone = localStorage.getItem("bubbleDone") === "true";

  let finalScore = 0;
  if (sortingDone && bubbleDone) {
    finalScore = 100;
  } else if (sortingDone || bubbleDone) {
    finalScore = 50;
  }

  finishSortingGame(finalScore);
}

// ✅ Finish game
function finishSortingGame(finalScore) {
  saveProgressToServer(finalScore);

  setTimeout(() => {
    document.getElementById("message").innerText += ` | Score: ${finalScore}%`;
  }, 500);
}

// 🚀 Init
shuffleCards();

// 🔙 Back navigation
function goBack() {
  window.location.href = "cs.html";
}
