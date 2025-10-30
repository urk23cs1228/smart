/* ===========================
   reaction.js — Difficulty + Quiz
   =========================== */

/* --------------------------
   Question Bank (10 each)
---------------------------*/
const questionBank = {
  easy: [
    { lhs: "H2 + O2", rhs: "H2O", coeffs: [2, 1, 2] },
    { lhs: "C + O2", rhs: "CO2", coeffs: [1, 1, 1] },
    { lhs: "N2 + H2", rhs: "NH3", coeffs: [1, 3, 2] },
    { lhs: "Mg + O2", rhs: "MgO", coeffs: [2, 1, 2] },
    { lhs: "Na + Cl2", rhs: "NaCl", coeffs: [2, 1, 2] },
    { lhs: "Ca + O2", rhs: "CaO", coeffs: [2, 1, 2] },
    { lhs: "Fe + S", rhs: "FeS", coeffs: [1, 1, 1] },
    { lhs: "Zn + O2", rhs: "ZnO", coeffs: [2, 1, 2] },
    { lhs: "H2 + Cl2", rhs: "HCl", coeffs: [1, 1, 2] },
    { lhs: "Al + Cl2", rhs: "AlCl3", coeffs: [2, 3, 2] }
  ],
  medium: [
    { lhs: "Fe + O2", rhs: "Fe2O3", coeffs: [4, 3, 2] },
    { lhs: "C2H6 + O2", rhs: "CO2 + H2O", coeffs: [2, 7, 4, 6] },
    { lhs: "KClO3", rhs: "KCl + O2", coeffs: [2, 2, 3] },
    { lhs: "H2O2", rhs: "H2O + O2", coeffs: [2, 2, 1] },
    { lhs: "NH3 + O2", rhs: "NO + H2O", coeffs: [4, 3, 4, 6] },
    { lhs: "CaCO3", rhs: "CaO + CO2", coeffs: [1, 1, 1] },
    { lhs: "Al + O2", rhs: "Al2O3", coeffs: [4, 3, 2] },
    { lhs: "CH4 + O2", rhs: "CO2 + H2O", coeffs: [1, 2, 1, 2] },
    { lhs: "SO2 + O2", rhs: "SO3", coeffs: [2, 1, 2] },
    { lhs: "P4 + O2", rhs: "P2O5", coeffs: [4, 5, 2] }
  ],
  hard: [
    { lhs: "C3H8 + O2", rhs: "CO2 + H2O", coeffs: [1, 5, 3, 4] },
    { lhs: "C4H10 + O2", rhs: "CO2 + H2O", coeffs: [2, 13, 8, 10] },
    { lhs: "FeS2 + O2", rhs: "Fe2O3 + SO2", coeffs: [4, 11, 2, 8] },
    { lhs: "Na2CO3 + HCl", rhs: "NaCl + H2O + CO2", coeffs: [1, 2, 2, 1, 1] },
    { lhs: "K2Cr2O7 + HCl", rhs: "KCl + CrCl3 + H2O + Cl2", coeffs: [1, 14, 2, 2, 7, 3] },
    { lhs: "C6H12O6 + O2", rhs: "CO2 + H2O", coeffs: [1, 6, 6, 6] },
    { lhs: "Pb(NO3)2", rhs: "PbO + NO2 + O2", coeffs: [2, 2, 4, 1] },
    { lhs: "KMnO4 + HCl", rhs: "KCl + MnCl2 + H2O + Cl2", coeffs: [2, 16, 2, 2, 8, 5] },
    { lhs: "Fe2O3 + CO", rhs: "Fe + CO2", coeffs: [1, 3, 2, 3] },
    { lhs: "Na + H2O", rhs: "NaOH + H2", coeffs: [2, 2, 2, 1] }
  ]
};

/* --------------------------
   Quiz state
---------------------------*/
let reactions = [];        // active set (10 questions)
let currentIndex = 0;
let score = 0;
let questionStatus = [];   // null | 'correct' | 'wrong' | 'checked'

/* --------------------------
   Element → Color map
---------------------------*/
const elementColors = {
  H: "grey", O: "blue", C: "black", N: "green", P: "red", S: "yellow",
  K: "purple", Na: "orange", Mg: "brown", Al: "gray", Ca: "pink",
  Fe: "maroon", Cl: "lightgreen", Br: "darkred", Li: "cyan",
  Rb: "violet", Cs: "gold", B: "teal", Si: "darkblue"
};

/* --------------------------
   Utils: parse formulas, render molecules
---------------------------*/
function splitCompounds(maybeStringOrArray) {
  if (Array.isArray(maybeStringOrArray)) return maybeStringOrArray;
  return String(maybeStringOrArray)
    .split("+")
    .map(s => s.trim())
    .filter(Boolean);
}

function parseFormula(formula) {
  function expand(formula) {
    const regex = /([A-Z][a-z]?)(\d*)|(\()|(\))(\d*)/g;
    let stack = [[]];
    let match;
    while ((match = regex.exec(formula)) !== null) {
      if (match[1]) {
        const element = match[1];
        const count = match[2] ? parseInt(match[2]) : 1;
        for (let i = 0; i < count; i++) stack[stack.length - 1].push(element);
      } else if (match[3]) {
        stack.push([]);
      } else if (match[4]) {
        let group = stack.pop();
        let multiplier = match[5] ? parseInt(match[5]) : 1;
        for (let i = 0; i < multiplier; i++) {
          stack[stack.length - 1].push(...group);
        }
      }
    }
    return stack[0];
  }
  return expand(formula);
}

function createSingleMoleculeHTML(formula) {
  const atoms = parseFormula(formula);
  let html = `<div class="molecule">`;
  atoms.forEach(el => {
    const color = elementColors[el] || "gray";
    html += `<div class="atom" title="${el}" style="background:${color}"></div>`;
  });
  html += `</div>`;
  return html;
}

function drawMolecules(containerEl, formula, coeff) {
  containerEl.innerHTML = "";
  const n = Math.max(0, parseInt(coeff || "0", 10));
  for (let i = 0; i < n; i++) {
    containerEl.insertAdjacentHTML("beforeend", createSingleMoleculeHTML(formula));
  }
}

/* --------------------------
   Render one question
---------------------------*/
function showQuestion(index) {
  currentIndex = index;
  const q = reactions[index];

  // guard
  if (!q) return;

  const lhsCompounds = splitCompounds(q.lhs);
  const rhsCompounds = splitCompounds(q.rhs);

  const lhsHTML = lhsCompounds
    .map((formula, i) => compoundBoxHTML("lhs", i, formula, `coeff-lhs-${i}`, `mol-lhs-${i}`, `Reactant: ${formula}`))
    .join(`<span style="align-self:center;font-weight:bold;"> + </span>`);

  const rhsHTML = rhsCompounds
    .map((formula, i) => compoundBoxHTML("rhs", i, formula, `coeff-rhs-${i}`, `mol-rhs-${i}`, `Product: ${formula}`))
    .join(`<span style="align-self:center;font-weight:bold;"> + </span>`);

  const container = document.getElementById("question-container");
  container.innerHTML = `
    <div class="reaction-row">
      <div class="side side-lhs">${lhsHTML}</div>
      <span style="font-size:20px; font-weight:bold; align-self:center;">→</span>
      <div class="side side-rhs">${rhsHTML}</div>
    </div>
  `;

  // draw initial molecules with coeff = 1
  lhsCompounds.forEach((f, i) => {
    drawMolecules(document.getElementById(`mol-lhs-${i}`), f, 1);
  });
  rhsCompounds.forEach((f, i) => {
    drawMolecules(document.getElementById(`mol-rhs-${i}`), f, 1);
  });

  initCoeffControls();

  // restore previous input values if user answered earlier
  restoreUserInputs(index);

  document.getElementById("feedback").textContent = "";
}

/* create molecule input boxes */
function compoundBoxHTML(side, idx, formula, coeffId, molId, labelText) {
  return `
    <div class="molecule-box" data-side="${side}" data-index="${idx}" data-formula="${formula}">
      <div class="coeff-controls" style="display:flex; gap:6px; align-items:center; margin-bottom:6px;">
        <button type="button" class="dec-btn">−</button>
        <input type="number" id="${coeffId}" class="coefficient" min="0" value="1" />
        <button type="button" class="inc-btn">+</button>
      </div>
      <div class="molecules" id="${molId}"></div>
      <div class="label">${labelText}</div>
    </div>
  `;
}

/* wire up +/- and input so molecule drawings update */
function initCoeffControls() {
  document.querySelectorAll(".molecule-box .coefficient").forEach(input => {
    input.addEventListener("input", () => {
      const box = input.closest(".molecule-box");
      const formula = box.getAttribute("data-formula");
      const molContainer = box.querySelector(".molecules");
      drawMolecules(molContainer, formula, parseInt(input.value || "0", 10));
      // keep user input stored
      saveUserInput(currentIndex);
    });
  });

  document.querySelectorAll(".molecule-box .inc-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const input = btn.parentElement.querySelector(".coefficient");
      input.value = Math.max(0, parseInt(input.value || "0", 10)) + 1;
      input.dispatchEvent(new Event("input"));
    });
  });

  document.querySelectorAll(".molecule-box .dec-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const input = btn.parentElement.querySelector(".coefficient");
      input.value = Math.max(0, parseInt(input.value || "0", 10) - 1);
      input.dispatchEvent(new Event("input"));
    });
  });
}

/* --------------------------
   User answers persistence (keeps inputs when navigating)
---------------------------*/
const userAnswers = {}; // key: questionIndex -> array of coeffs

function saveUserInput(qIndex) {
  const inputs = document.querySelectorAll(".coefficient");
  if (!inputs || inputs.length === 0) return;
  userAnswers[qIndex] = Array.from(inputs).map(i => parseInt(i.value || "0", 10));
}

function restoreUserInputs(qIndex) {
  const saved = userAnswers[qIndex];
  if (!saved) return;
  const inputs = document.querySelectorAll(".coefficient");
  inputs.forEach((inp, i) => {
    if (typeof saved[i] !== "undefined") {
      inp.value = saved[i];
      inp.dispatchEvent(new Event("input"));
    }
  });
}

/* --------------------------
   Get user coefficients in order
---------------------------*/
function getUserCoeffsInOrder() {
  const q = reactions[currentIndex];
  const lhs = splitCompounds(q.lhs);
  const rhs = splitCompounds(q.rhs);
  const lhsVals = lhs.map((_, i) => parseInt(document.getElementById(`coeff-lhs-${i}`).value || "0", 10));
  const rhsVals = rhs.map((_, i) => parseInt(document.getElementById(`coeff-rhs-${i}`).value || "0", 10));
  return [...lhsVals, ...rhsVals];
}

/* --------------------------
   Submit / Check / Scoring
---------------------------*/
function submitAnswer() {
  const q = reactions[currentIndex];
  const userCoeffs = getUserCoeffsInOrder();
  const correct = JSON.stringify(userCoeffs) === JSON.stringify(q.coeffs);
  const feedback = document.getElementById("feedback");

  if (questionStatus[currentIndex] === null) {
    if (correct) {
      score += 2;
      questionStatus[currentIndex] = "correct";
      feedback.textContent = "✅ Correct! (+2)";
    } else {
      score -= 1;
      questionStatus[currentIndex] = "wrong";
      feedback.textContent = "❌ Incorrect. (-1)";
    }
  } else if (questionStatus[currentIndex] === "wrong") {
    if (correct) {
      questionStatus[currentIndex] = "correct";
      feedback.textContent = "✅ Correct!";
    } else {
      feedback.textContent = "❌ Incorrect.";
    }
  } else {
    feedback.textContent = correct ? "✅ Still correct." : "❌ Incorrect.";
  }

  updateScore();
  renderQuestionList(); // update colors on right side
  saveUserInput(currentIndex);
}

function checkAnswer() {
  const q = reactions[currentIndex];
  const ans = q.coeffs.join(", ");
  document.getElementById("feedback").textContent = `Answer: ${ans}`;
  questionStatus[currentIndex] = "checked";
  renderQuestionList();
}

function updateScore() {
  document.getElementById("score").textContent = `Score: ${score}`;
}

/* --------------------------
   Finish test
---------------------------*/
function finishTest() {
  const correctCount = questionStatus.filter(status => status === "correct").length;
  const totalQuestions = reactions.length;
  const percentScore = Math.round((correctCount / totalQuestions) * 100);

  const finalScoreDiv = document.getElementById("finalScore");
  finalScoreDiv.innerHTML = `🎉 Final Score: ${correctCount} / ${totalQuestions} (${percentScore}%)`;

  localStorage.setItem("chemistryFinalScore", percentScore);

  if (!document.getElementById("backBtn")) {
    const backBtn = document.createElement("button");
    backBtn.id = "backBtn";
    backBtn.textContent = "⬅ Back to Chemistry Page";
    backBtn.style.marginTop = "10px";
    backBtn.onclick = () => {
      window.location.href = "chem.html";
    };
    finalScoreDiv.appendChild(document.createElement("br"));
    finalScoreDiv.appendChild(backBtn);
  }
}

/* --------------------------
   Right-side question numbers
---------------------------*/
function renderQuestionList() {
  const list = document.getElementById("question-list");
  list.innerHTML = "";
  reactions.forEach((_, i) => {
    const btn = document.createElement("div");
    btn.textContent = i + 1;
    btn.className = "question-number";
    if (questionStatus[i] === "correct") btn.classList.add("correct");
    if (questionStatus[i] === "wrong") btn.classList.add("wrong");
    if (questionStatus[i] === "checked") btn.classList.add("checked");
    btn.addEventListener("click", () => {
      // save current inputs before switching
      saveUserInput(currentIndex);
      showQuestion(i);
    });
    list.appendChild(btn);
  });
  // make sure question-list visible
  const qlist = document.getElementById("question-list");
  if (qlist) qlist.style.display = "block";
}

/* --------------------------
   Difficulty selector
---------------------------*/
function selectDifficulty(level) {
  if (!questionBank[level]) return;
  // copy the array (so original bank remains intact)
  reactions = questionBank[level].slice(0, 10);
  questionStatus = Array(reactions.length).fill(null);
  score = 0;
  currentIndex = 0;
  // hide difficulty UI, show quiz UI and question list
  const diff = document.getElementById("difficulty-container");
  const quiz = document.getElementById("quiz-container");
  const qlist = document.getElementById("question-list");
  if (diff) diff.style.display = "none";
  if (quiz) quiz.style.display = "block";
  if (qlist) qlist.style.display = "block";

  renderQuestionList();
  showQuestion(0);
  updateScore();
}

/* --------------------------
   Init: wire buttons
---------------------------*/
window.addEventListener("DOMContentLoaded", () => {
  // Difficulty buttons
  document.querySelectorAll(".difficulty-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const level = btn.dataset.level;
      selectDifficulty(level);
    });
  });

  // Quiz buttons (they exist but quiz hidden until difficulty picked)
  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) submitBtn.addEventListener("click", submitAnswer);

  const checkBtn = document.getElementById("checkBtn");
  if (checkBtn) checkBtn.addEventListener("click", checkAnswer);

  const finishBtn = document.getElementById("finishBtn");
  if (finishBtn) finishBtn.addEventListener("click", finishTest);

  // ensure initial UI: show difficulty, hide quiz/question list
  const diff = document.getElementById("difficulty-container");
  const quiz = document.getElementById("quiz-container");
  const qlist = document.getElementById("question-list");
  if (diff) diff.style.display = "block";
  if (quiz) quiz.style.display = "none";
  if (qlist) qlist.style.display = "none";
});
  function goBack() {
    window.location.href = "chem.html";
  }