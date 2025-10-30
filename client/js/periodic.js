// ===============================
// Periodic Table Quiz Game
// ===============================

const questions = [
  { text: "Which is a non-metal and noble gas?", answer: "He" },
  { text: "Which element has the symbol 'Na'?", answer: "Na" },
  { text: "Which element is used in pencils (Graphite)?", answer: "C" },
  { text: "Which is a liquid metal at room temperature?", answer: "Hg" },
  { text: "Which element is essential for respiration?", answer: "O" },
  { text: "Which is the lightest element?", answer: "H" },
  { text: "Which element has symbol 'Fe'?", answer: "Fe" },
  { text: "Which gas is used in balloons?", answer: "Ne" },
  { text: "Which element is called 'King of Chemicals'?", answer: "S" }, 
  { text: "Which element has symbol 'Au'?", answer: "Au" }
];

let currentQuestion = 0;
let score = 0;
let answers = {};
let checked = {}; // track if question was checked

const questionList = document.getElementById("question-list");
const scoreDisplay = document.getElementById("score");
const feedback = document.getElementById("feedback");
const finalScore = document.getElementById("finalScore");

// Build question list
questions.forEach((q, index) => {
  const btn = document.createElement("button");
  btn.textContent = index + 1;
  btn.className = "q-number";
  btn.addEventListener("click", () => loadQuestion(index));
  questionList.appendChild(btn);
});

function loadQuestion(index) {
  currentQuestion = index;
  feedback.textContent = `Q${index + 1}: ${questions[index].text}`;
}

// Set color
function setColor(index, color) {
  const btns = document.querySelectorAll(".q-number");
  btns[index].style.background = color;
  btns[index].style.color = "white";
}

// Handle table clicks
document.querySelectorAll(".table button").forEach(button => {
  button.addEventListener("click", () => {
    if (currentQuestion < questions.length) {
      const selected = button.textContent.trim();
      const correct = questions[currentQuestion].answer;

      answers[currentQuestion] = selected;

      if (selected === correct) {
        if (checked[currentQuestion]) {
          // If already checked → mark blue
          setColor(currentQuestion, "blue");
        } else {
          // Correct normally → green
          setColor(currentQuestion, "green");
          score++;
          updateScore();
        }
        feedback.textContent = `✅ Correct: ${selected}`;
      } else {
        // Wrong answer → red
        setColor(currentQuestion, "red");
        feedback.textContent = `❌ Wrong: ${selected}`;
      }
    }
  });
});

// Check Answer
document.getElementById("checkBtn").addEventListener("click", () => {
  const correct = questions[currentQuestion].answer;
  feedback.textContent = `ℹ️ Correct Answer: ${correct}`;
  checked[currentQuestion] = true; // mark question as "checked"
});

// Finish Test
document.getElementById("finishBtn").addEventListener("click", () => {
  finalScore.textContent = `🎉 Final Score: ${score} / ${questions.length}`;
  localStorage.setItem(
    "periodicGameFinalScore",
    ((score / questions.length) * 100).toFixed(0)
  );
});

function updateScore() {
  scoreDisplay.textContent = `Score: ${score}`;
}

// Load first question
loadQuestion(0);
  function goBack() {
    window.location.href = "chem.html";
  }