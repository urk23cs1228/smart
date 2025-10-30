
        // Game State
        let gameState = {
            score: 0,
            health: 100,
            level: 1,
            itemsProcessed: 0,
            currentItem: null,
            isGameRunning: false,
            gameSpeed: 3000,
            questionNumbers: []
        };
 
        const items = [
            { type: 'glucose', symbol: '🟤', name: 'Glucose', points: 10 },
            { type: 'oxygen', symbol: '🔵', name: 'Oxygen', points: 15 },
            { type: 'toxin', symbol: '☠️', name: 'Toxin', points: -20, healthDamage: 15 }
        ];
 
        // Initialize the game
        function initGame() {
            generateQuestionNumbers();
            updateDisplay();
            startGame();
            setupInputHandlers();
        }
 
        // Generate question numbers grid
        function generateQuestionNumbers() {
            const grid = document.getElementById('question-grid');
            for (let i = 1; i <= 37; i++) {
                const numberElement = document.createElement('div');
                numberElement.className = 'question-number';
                numberElement.textContent = i;
                numberElement.id = `question-${i}`;
                grid.appendChild(numberElement);
                gameState.questionNumbers.push({ number: i, status: 'unanswered' });
            }
        }
 
        // Start the game
        function startGame() {
            gameState.isGameRunning = true;
            spawnNextItem();
        }
 
        // Spawn next falling item
        function spawnNextItem() {
            if (!gameState.isGameRunning) return;
 
            const randomItem = items[Math.floor(Math.random() * items.length)];
            gameState.currentItem = randomItem;
 
            document.getElementById('current-item').innerHTML = 
                `${randomItem.symbol} ${randomItem.name} is falling!`;
 
            // Auto-process after timeout if no action taken
            setTimeout(() => {
                if (gameState.currentItem === randomItem && gameState.isGameRunning) {
                    handleAction('skip');
                }
            }, gameState.gameSpeed);
        }
 
        // Handle player actions
        function handleAction(action) {
            if (!gameState.currentItem || !gameState.isGameRunning) return;
 
            const item = gameState.currentItem;
            gameState.itemsProcessed++;
 
            let correct = false;
            let message = '';
 
            if (action === 'catch') {
                if (item.type === 'glucose' || item.type === 'oxygen') {
                    gameState.score += item.points;
                    message = `+${item.points} ATP Energy!`;
                    correct = true;
                } else if (item.type === 'toxin') {
                    gameState.health -= item.healthDamage;
                    gameState.score += item.points; // Negative points
                    message = `-${item.healthDamage} Health! ${item.points} ATP!`;
                    correct = false;
                }
            } else if (action === 'skip') {
                if (item.type === 'toxin') {
                    message = 'Smart! Avoided toxin!';
                    correct = true;
                } else {
                    message = 'Missed opportunity for ATP!';
                    correct = false;
                }
            }
 
            // Update question number status
            updateQuestionStatus(gameState.itemsProcessed, correct);
 
            // Clear input
            document.getElementById('player-input').value = '';
 
            // Show result briefly
            document.getElementById('current-item').innerHTML = message;
 
            // Check game over conditions
            if (gameState.health <= 0) {
                endGame();
                return;
            }
 
            // Increase difficulty
            if (gameState.itemsProcessed % 5 === 0) {
                gameState.level++;
                gameState.gameSpeed = Math.max(1000, gameState.gameSpeed - 200);
            }
 
            gameState.currentItem = null;
            updateDisplay();
 
            // Spawn next item after a brief delay
            setTimeout(() => {
                if (gameState.isGameRunning) {
                    spawnNextItem();
                }
            }, 1500);
        }
 
        // Update question number status
        function updateQuestionStatus(questionNum, correct) {
            if (questionNum <= 37) {
                const element = document.getElementById(`question-${questionNum}`);
                if (element) {
                    element.className = `question-number ${correct ? 'correct' : 'wrong'}`;
                    gameState.questionNumbers[questionNum - 1].status = correct ? 'correct' : 'wrong';
                }
            }
        }
 
        // Update display elements
        function updateDisplay() {
            document.getElementById('score').textContent = gameState.score;
            document.getElementById('health').textContent = Math.max(0, gameState.health);
            document.getElementById('level').textContent = gameState.level;
            document.getElementById('items-processed').textContent = gameState.itemsProcessed;
        }
 
        // Setup input handlers
        function setupInputHandlers() {
            const input = document.getElementById('player-input');
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    const value = this.value.toLowerCase().trim();
                    if (value === 'catch' || value === 'skip') {
                        handleAction(value);
                    }
                }
            });
 
            // Focus input initially
            input.focus();
        }
 
        // End game
        // End game
function endGame() {
    gameState.isGameRunning = false;
    document.getElementById('final-score').textContent = gameState.score;
    document.getElementById('final-items').textContent = gameState.itemsProcessed;
    document.getElementById('game-over').style.display = 'block';

    // 🔥 Save best score to localStorage
    let previousBest = localStorage.getItem("bioFinalScore");
    previousBest = previousBest ? parseInt(previousBest) : 0;

    if (gameState.score > previousBest) {
        localStorage.setItem("bioFinalScore", gameState.score);
    }
}

 
        // Restart game
        function restartGame() {
            // Reset game state
            gameState = {
                score: 0,
                health: 100,
                level: 1,
                itemsProcessed: 0,
                currentItem: null,
                isGameRunning: false,
                gameSpeed: 3000,
                questionNumbers: []
            };
 
            // Reset UI
            document.getElementById('game-over').style.display = 'none';
            document.getElementById('current-item').innerHTML = 'Get Ready!';
 
            // Reset question numbers
            const questionNumbers = document.querySelectorAll('.question-number');
            questionNumbers.forEach(q => {
                q.className = 'question-number';
            });
 
            updateDisplay();
            startGame();
            document.getElementById('player-input').focus();
        }
 
        // Footer button functions
        function submitAnswer() {
            const input = document.getElementById('player-input');
            const value = input.value.toLowerCase().trim();
            if (value === 'catch' || value === 'skip') {
                handleAction(value);
            } else {
                alert('Please type "catch" or "skip"');
            }
        }
 
        function checkAnswer() {
            if (gameState.currentItem) {
                const item = gameState.currentItem;
                let hint = '';
                if (item.type === 'glucose' || item.type === 'oxygen') {
                    hint = 'This produces ATP energy - you should CATCH it!';
                } else {
                    hint = 'This is harmful - you should SKIP it!';
                }
                alert(hint);
            } else {
                alert('No item currently falling!');
            }
        }
 
      async function finishTest() {
    if (!confirm('Are you sure you want to finish the game?')) return;

    // End the game
    endGame();

    // Calculate progress
    let progress = 0;
    if (gameState.itemsProcessed >= 37) progress = 100;
    else if (gameState.itemsProcessed >= 28) progress = 75;
    else if (gameState.itemsProcessed >= 18) progress = 50;
    else if (gameState.itemsProcessed >= 9) progress = 25;

    const subject = "Biology";
    const gameName = "Mitochondria";

    // Save to localStorage
const username = sessionStorage.getItem("loggedInUser"); // or localStorage if you use that
localStorage.setItem(`progress_${username}_${subject}_${gameName}`, progress);
localStorage.setItem(`score_${username}_${subject}_${gameName}`, gameState.score);


    alert(`Game Finished! Progress: ${progress}%, Score: ${gameState.score}`);

    // 🔥 Immediately upload progress
    await uploadProgress(subject, gameName);
}




 
        // Initialize game when page loads
        window.onload = initGame;
  
  function goBack() {
    window.location.href = "bio.html";
  }
async function uploadProgress(subject, gameName) {
    const username = sessionStorage.getItem("loggedInUser");
    if (!username) {
        alert("⚠️ Please log in before uploading progress.");
        return;
    }

    const progressKey = `progress_${username}_${subject}_${gameName}`;
    const scoreKey = `score_${username}_${subject}_${gameName}`;

    const progress = parseInt(localStorage.getItem(progressKey)) || 0;
    const finalScore = parseInt(localStorage.getItem(scoreKey)) || 0;

    try {
        const res = await fetch("http://localhost:5001/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username,
                subject,
                gameName,
                progressPercent: progress
            })
        });

        const data = await res.json();
        if (res.ok) {
            alert(`✅ Progress uploaded!\nProgress: ${progress}%, Score: ${finalScore}`);
        } else {
            alert("❌ Upload failed: " + (data.message || "Unknown error"));
        }
    } catch (err) {
        console.error(err);
        alert("🚨 Server error. Please try again later.");
    }
}
