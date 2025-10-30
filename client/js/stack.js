let gameState = {
  score: 0,
  level: 1,
  currentQuestion: 1,
  totalQuestions: 15,
  stack: [],
  currentTask: null,
  finished: false
};

const gameTasks = [
  { task: 'push', items: ['A'], instruction: 'Drag item A to the stack' },
  { task: 'push', items: ['B'], instruction: 'Drag item B to the stack' },
  { task: 'pop', expected: 'B', instruction: 'Pop the top item (should be B)' },
  { task: 'push', items: ['C', 'D'], instruction: 'Push C and D to stack' },
  { task: 'pop', expected: 'D', instruction: 'Pop top item (should be D)' },
  { task: 'push', items: ['E'], instruction: 'Push E to stack' },
  { task: 'pop', expected: 'E', instruction: 'Pop top item (should be E)' },
  { task: 'pop', expected: 'C', instruction: 'Pop top item (should be C)' },
  { task: 'push', items: ['F', 'G', 'H'], instruction: 'Push F,G,H' },
  { task: 'pop', expected: 'H', instruction: 'Pop top item (should be H)' },
  { task: 'pop', expected: 'G', instruction: 'Pop top item (should be G)' },
  { task: 'push', items: ['I'], instruction: 'Push I' },
  { task: 'pop', expected: 'I', instruction: 'Pop top item (should be I)' },
  { task: 'pop', expected: 'F', instruction: 'Pop top item (should be F)' },
  { task: 'pop', expected: 'A', instruction: 'Pop final item (should be A)' }
];

function initGame() {
  generateQuestionNumbers();
  loadCurrentTask();
  setupEventListeners();
  updateDisplay();
}

function generateQuestionNumbers() {
  const grid = document.getElementById('question-grid');
  grid.innerHTML = '';
  for (let i = 1; i <= gameState.totalQuestions; i++) {
    const div = document.createElement('div');
    div.className = 'question-number question-unanswered';
    div.textContent = i;
    div.id = `question-${i}`;
    grid.appendChild(div);
  }
}

function loadCurrentTask() {
  if (gameState.currentQuestion <= gameTasks.length) {
    gameState.currentTask = gameTasks[gameState.currentQuestion - 1];
    document.getElementById('instruction-text').textContent = gameState.currentTask.instruction;
    if (gameState.currentTask.task === 'push') {
      generateItems();
    } else {
      document.getElementById('items-container').innerHTML = '';
    }
    document.getElementById('pop-btn').disabled =
      gameState.currentTask.task === 'push' || gameState.stack.length === 0;
    clearMessage();
  }
}

function generateItems() {
  const container = document.getElementById('items-container');
  container.innerHTML = '';
  gameState.currentTask.items.forEach(it => {
    const div = document.createElement('div');
    div.className = 'item';
    div.textContent = it;
    div.draggable = true;
    div.dataset.value = it;
    div.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', it);
      e.target.classList.add('dragging');
    });
    div.addEventListener('dragend', e => {
      e.target.classList.remove('dragging');
    });
    container.appendChild(div);
  });
}

function handleDrop(e) {
  e.preventDefault();
  const val = e.dataTransfer.getData('text/plain');
  addToStack(val);
  const dragged = document.querySelector(`[data-value="${val}"]`);
  if (dragged) dragged.remove();
}

function addToStack(val) {
  gameState.stack.push(val);
  renderStack();
  if (gameState.currentTask.task === 'push') {
    const all = gameState.currentTask.items.every(it =>
      gameState.stack.includes(it)
    );
    if (all) {
      showMessage('✅ Items added!', 'success');
      setTimeout(() => completeQuestion(true), 1200);
    }
  }
  document.getElementById('pop-btn').disabled = gameState.stack.length === 0;
}

function popFromStack() {
  if (gameState.stack.length === 0) {
    showMessage('Stack Underflow!', 'error');
    return;
  }
  const popped = gameState.stack.pop();
  renderStack();
  if (gameState.currentTask.task === 'pop') {
    if (popped === gameState.currentTask.expected) {
      showMessage(`Correct! Removed ${popped}`, 'success');
      setTimeout(() => completeQuestion(true), 1200);
    } else {
      showMessage(
        `Wrong! Expected ${gameState.currentTask.expected}, got ${popped}`,
        'error'
      );
      completeQuestion(false);
    }
  }
  document.getElementById('pop-btn').disabled = gameState.stack.length === 0;
}

function renderStack() {
  const container = document.getElementById('stack-container');
  const old = container.querySelectorAll('.stack-item');
  old.forEach(el => el.remove());
  gameState.stack.forEach((it, idx) => {
    const div = document.createElement('div');
    div.className = 'stack-item';
    div.textContent = it;
    if (idx === gameState.stack.length - 1) div.classList.add('highlight');
    container.appendChild(div);
  });
}

function completeQuestion(ok) {
  const el = document.getElementById(
    `question-${gameState.currentQuestion}`
  );
  if (ok) {
    el.className = 'question-number question-correct';
    gameState.score += 10;
  } else {
    el.className = 'question-number question-wrong';
  }
  gameState.currentQuestion++;
  if (gameState.currentQuestion <= gameState.totalQuestions) {
    setTimeout(() => {
      loadCurrentTask();
      updateDisplay();
    }, 1500);
  } else {
    finishTest(); // ✅ call finishTest automatically at the end
  }
  updateDisplay();
}

function showMessage(txt, type) {
  const area = document.getElementById('message-area');
  area.textContent = txt;
  area.className = `message-area message-${type}`;
}

function clearMessage() {
  const area = document.getElementById('message-area');
  area.className = 'message-area';
  area.textContent = '';
}

function updateDisplay() {
  document.getElementById('score').textContent = gameState.score;
  document.getElementById('level').textContent = gameState.level;
}

function resetStack() {
  gameState.stack = [];
  renderStack();
  document.getElementById('pop-btn').disabled = true;
  showMessage('Stack reset!', 'info');
}

function setupEventListeners() {
  const stack = document.getElementById('stack-container');
  stack.addEventListener('dragover', e => {
    e.preventDefault();
  });
  stack.addEventListener('drop', handleDrop);
  document.getElementById('pop-btn').addEventListener('click', popFromStack);
  document
    .getElementById('reset-stack-btn')
    .addEventListener('click', resetStack);

  // ✅ Submit button
  document
    .getElementById('submit-btn')
    .addEventListener('click', () => {
      if (gameState.finished) return;
      showMessage(`Submitted Q${gameState.currentQuestion}`, 'info');
    });

  // ✅ Check button
  document
    .getElementById('check-btn')
    .addEventListener('click', () => {
      if (gameState.finished) return;
      if (gameState.currentTask.task === 'pop') {
        showMessage(`Expected: ${gameState.currentTask.expected}`, 'info');
      } else if (gameState.currentTask.task === 'push') {
        showMessage(`You need to add: ${gameState.currentTask.items.join(', ')}`, 'info');
      }
    });

  // ✅ Finish button
  document
    .getElementById('finish-btn')
    .addEventListener('click', () => {
      finishTest();
    });
}

// ✅ Save progress (local + SQL)
async function saveProgressToServer(finalScore) {
  const username = sessionStorage.getItem("loggedInUser") || "guest";
  const subject = "Computer Science";
  const gameName = "Stack Game";

  // save to local storage
  localStorage.setItem("stackGameFinalScore", finalScore);

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
      showMessage(`📊 Progress saved: ${finalScore}% (Synced to server)`, "success");
    } else {
      showMessage(`⚠️ Progress saved locally. Server sync failed.`, "error");
    }
  } catch (err) {
    console.error("Error saving progress:", err);
    showMessage(`⚠️ Progress saved locally. Will sync when online.`, "error");
  }
}

// ✅ Finish test function (saves score + shows result + redirect)
function finishTest() {
  if (gameState.finished) return;
  gameState.finished = true;

  const finalScore = Math.round(
    (gameState.score / (gameState.totalQuestions * 10)) * 100
  );
  localStorage.setItem("stackGameFinalScore", finalScore);

  // ✅ Always get username from sessionStorage
  const username = sessionStorage.getItem("loggedInUser") || "guest";

  fetch("http://localhost:5001/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      subject: "Computer Science",
      gameName: "Stack Game",
      progressPercent: finalScore,
    }),
  })
    .then(res => res.json())
    .then(data => {
      console.log("Progress sync:", data);
    })
    .catch(err => {
      console.error("Error saving progress:", err);
    });

  showMessage(
    `🎯 Test Finished! Score: ${gameState.score}/${gameState.totalQuestions * 10} (${finalScore}%)`,
    "success"
  );
  document.getElementById("instruction-text").textContent =
    "You've completed the Stack Game!";

  setTimeout(() => {
    window.location.href = "cs.html";
  }, 2000);
}



window.onload = initGame;

function goBack() {
  window.location.href = "cs.html";
}
