let gameState = {
    mode: 'linear',
    currentRound: 1,
    maxRounds: 10,
    moves: 0,
    found: 0,
    targetNumber: 5,
    numbers: [],
    revealedCards: new Set(),
    currentPosition: 0,
    binarySearchState: {
        low: 0,
        high: 15,
        mid: 7
    },
    roundResults: []
};

let isDragging = false;
let magnifier = document.getElementById('magnifier');

function initGame() {
    generateNumbers();
    generateQuestionGrid();
    setNewTarget();
    resetRound();
}

function generateNumbers() {
    gameState.numbers = [];
    for (let i = 1; i <= 16; i++) {
        gameState.numbers.push(i);
    }

    // Shuffle array
    for (let i = gameState.numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gameState.numbers[i], gameState.numbers[j]] = [gameState.numbers[j], gameState.numbers[i]];
    }

    renderGrid();
}

function renderGrid() {
    const grid = document.getElementById('grid');
    grid.innerHTML = '';

    gameState.numbers.forEach((number, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.index = index;
        card.textContent = number;

        if (gameState.revealedCards.has(index)) {
            card.classList.add('revealed');
        }

        if (gameState.mode === 'binary' && index === gameState.binarySearchState.mid) {
            card.classList.add('highlighted');
        }

        grid.appendChild(card);
    });
}

function generateQuestionGrid() {
    const questionGrid = document.getElementById('questionGrid');
    questionGrid.innerHTML = '';

    for (let i = 1; i <= gameState.maxRounds; i++) {
        const questionNumber = document.createElement('div');
        questionNumber.className = 'question-number unanswered';
        questionNumber.textContent = i;
        questionNumber.onclick = () => goToRound(i);

        if (i === gameState.currentRound) {
            questionNumber.classList.add('current');
        }

        if (gameState.roundResults[i - 1] !== undefined) {
            questionNumber.classList.remove('unanswered', 'current');
            questionNumber.classList.add(gameState.roundResults[i - 1] ? 'correct' : 'wrong');
        }

        questionGrid.appendChild(questionNumber);
    }
}

function setMode(mode) {
    gameState.mode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    document.getElementById('currentMode').textContent = mode === 'linear' ? 'Linear' : 'Binary';
    resetRound();
}

function setNewTarget() {
    gameState.targetNumber = Math.floor(Math.random() * 16) + 1;
    document.getElementById('target').textContent = gameState.targetNumber;
}

function resetRound() {
    gameState.moves = 0;
    gameState.revealedCards.clear();
    gameState.currentPosition = 0;
    gameState.binarySearchState = {
        low: 0,
        high: 15,
        mid: 7
    };

    document.getElementById('moves').textContent = gameState.moves;
    document.getElementById('hint').textContent = '';

    renderGrid();
    updateDisplay();
}

function updateDisplay() {
    document.getElementById('currentRound').textContent = gameState.currentRound;
    document.getElementById('found').textContent = gameState.found;
}

// Drag and drop functionality
magnifier.addEventListener('mousedown', startDrag);
document.addEventListener('mousemove', drag);
document.addEventListener('mouseup', stopDrag);

function startDrag(e) {
    isDragging = true;
    magnifier.style.cursor = 'grabbing';
}

function drag(e) {
    if (!isDragging) return;

    const rect = document.querySelector('.game-area').getBoundingClientRect();
    let x = e.clientX - rect.left - 30;
    let y = e.clientY - rect.top - 30;

    // Keep magnifier within bounds
    x = Math.max(0, Math.min(x, rect.width - 60));
    y = Math.max(0, Math.min(y, rect.height - 60));

    magnifier.style.left = x + 'px';
    magnifier.style.top = y + 'px';

    checkCardOverlap(e.clientX, e.clientY);
}

function stopDrag(e) {
    if (!isDragging) return;
    isDragging = false;
    magnifier.style.cursor = 'grab';
}

function checkCardOverlap(mouseX, mouseY) {
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const distance = Math.sqrt(
            Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2)
        );

        if (distance < 50) { // Close enough to reveal
            revealCard(index);
        }
    });
}

function revealCard(index) {
    if (gameState.revealedCards.has(index)) return;

    if (gameState.mode === 'linear') {
        // Linear search: must go in order
        if (index !== gameState.currentPosition) {
            document.getElementById('hint').textContent = 'Linear search: Check cards in order from left to right, top to bottom!';
            return;
        }
        gameState.currentPosition++;
    } else {
        // Binary search: must check highlighted card first
        if (index !== gameState.binarySearchState.mid && gameState.revealedCards.size === 0) {
            document.getElementById('hint').textContent = 'Binary search: Check the highlighted card first!';
            return;
        }
    }

    gameState.revealedCards.add(index);
    gameState.moves++;

    const card = document.querySelector(`[data-index="${index}"]`);
    card.classList.add('revealed');

    const revealedNumber = gameState.numbers[index];

    if (revealedNumber === gameState.targetNumber) {
        card.classList.add('found');
        document.getElementById('hint').textContent = `Found ${gameState.targetNumber}! 🎉`;
        setTimeout(() => {
            nextRound(true);
        }, 1500);
    } else if (gameState.mode === 'binary') {
        handleBinarySearchFeedback(index, revealedNumber);
    }

    document.getElementById('moves').textContent = gameState.moves;
    renderGrid();
}

function handleBinarySearchFeedback(index, revealedNumber) {
    const { low, high, mid } = gameState.binarySearchState;

    if (revealedNumber < gameState.targetNumber) {
        gameState.binarySearchState.low = mid + 1;
        document.getElementById('hint').textContent = 'Target is HIGHER! Check the new highlighted card.';
    } else {
        gameState.binarySearchState.high = mid - 1;
        document.getElementById('hint').textContent = 'Target is LOWER! Check the new highlighted card.';
    }

    if (gameState.binarySearchState.low <= gameState.binarySearchState.high) {
        gameState.binarySearchState.mid = Math.floor(
            (gameState.binarySearchState.low + gameState.binarySearchState.high) / 2
        );
    }
}

function nextRound(found) {
    gameState.roundResults[gameState.currentRound - 1] = found;

    if (found) {
        gameState.found++;
    }

    generateQuestionGrid();

    if (gameState.currentRound < gameState.maxRounds) {
        gameState.currentRound++;
        generateNumbers();
        setNewTarget();
        resetRound();
    } else {
        finishTest();
    }
}

function goToRound(roundNumber) {
    if (roundNumber <= gameState.currentRound) {
        gameState.currentRound = roundNumber;
        generateNumbers();
        setNewTarget();
        resetRound();
        generateQuestionGrid();
    }
}

function submitAnswer() {
    // For this game, submit happens automatically when target is found
    document.getElementById('hint').textContent = 'Keep searching for the target number!';
}

function checkAnswer() {
    const hint = document.getElementById('hint');
    if (gameState.revealedCards.size === 0) {
        hint.textContent = 'Start by dragging the magnifier over cards to reveal them!';
    } else {
        hint.textContent = `Target: ${gameState.targetNumber}, Moves: ${gameState.moves}`;
    }
}

function finishTest() {
    const correctAnswers = gameState.roundResults.filter(result => result).length;

    // Calculate score in percentage (out of 100)
    const finalScore = Math.round((correctAnswers / gameState.maxRounds) * 100);

    // Save score in localStorage
    localStorage.setItem("searchGameFinalScore", finalScore);

    // ✅ Get username from session (fallback = guest)
    const username = sessionStorage.getItem("loggedInUser") || "guest";
    const subject = "Computer Science";
    const gameName = "Search Game";

    // ✅ Send to backend (same API as stack/sorting)
    fetch("http://localhost:5001/progress", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username,
            subject,
            gameName,
            progressPercent: finalScore
        })
    })
    .then(response => {
        if (!response.ok) throw new Error("Failed to save progress");
        return response.json();
    })
    .then(data => {
        console.log("📊 Search progress saved:", data);
    })
    .catch(err => {
        console.error("⚠️ Error saving search progress:", err);
    });

    alert(`🎯 Game Complete!\nFound: ${correctAnswers}/${gameState.maxRounds}\nFinal Score: ${finalScore}%`);

    // Reset game
    gameState.currentRound = 1;
    gameState.found = 0;
    gameState.moves = 0;
    gameState.roundResults = [];
    initGame();
}




// Initialize game when page loads
initGame();

  function goBack() {
    window.location.href = "cs.html";
  }
