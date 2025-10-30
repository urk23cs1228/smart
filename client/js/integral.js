
/* ----------------------------
   Questions: functions & limits
   ---------------------------- */
const questions = [
  { text: "Shade area under y = x from 0 to 1", limits: [0,1], func: x => x },
  { text: "Shade area under y = x² from 0 to 1", limits: [0,1], func: x => x*x },
  { text: "Shade area under y = sin(x) from 0 to π/2", limits: [0, Math.PI/2], func: x => Math.sin(x) },
  { text: "Shade area under y = cos(x) from 0 to π/2", limits: [0, Math.PI/2], func: x => Math.cos(x) },
  { text: "Shade area under y = e^x from 0 to 1", limits: [0,1], func: x => Math.exp(x) },
  { text: "Shade area under y = 1/x from 1 to 2", limits: [1,2], func: x => 1/x },
  { text: "Shade area under y = √x from 0 to 4", limits: [0,4], func: x => Math.sqrt(x) },
  { text: "Shade area under y = 2x+1 from -1 to 2", limits: [-1,2], func: x => 2*x+1 },
  { text: "Shade area under y = |x| from -2 to 2", limits: [-2,2], func: x => Math.abs(x) },
  { text: "Shade area under y = ln(x) from 1 to 3", limits: [1,3], func: x => Math.log(x) }
];

const total = questions.length;

/* ----------------------------
   UI & state
   ---------------------------- */
let currentIndex = 0;
let status = Array(total).fill('unattempted'); // 'unattempted'|'correct'|'wrong'|'revisited'
let userSelected = [ null, null ]; // [startX, endX] for current attempt
let shadedDatasetIndex = null; // index in chart.data.datasets for user's shaded polygon
let revealedCorrectDatasetIndex = null; // index for correct shading shown after checking
let firstCheckDone = Array(total).fill(false); // to determine revisited behavior
let score = 0;

/* ----------------------------
   Chart.js setup
   ---------------------------- */
// create chart with linear x-axis; we'll use {x,y} points
const ctx = document.getElementById('chart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'line',
  data: { datasets: [] },
  options: {
    responsive: true,
    animation: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { type: 'linear', title: {display:true, text:'x'} },
      y: { beginAtZero: false, title: {display:true, text:'y'} }
    },
    onClick(evt, elements) {
      // not used; we use canvas click handler to map pixel->value
    }
  }
});

/* Helpers: build points, fill polygon, map pixel->x */
function buildCurvePoints(q, padding = 0.2) {
  const a = q.limits[0], b = q.limits[1];
  const minX = a - (Math.abs(b-a) * padding) - 0.5;
  const maxX = b + (Math.abs(b-a) * padding) + 0.5;
  const step = (maxX - minX) / 300;
  const pts = [];
  for (let x = minX; x <= maxX + 1e-9; x += step) pts.push({x: +x, y: q.func(x)});
  return pts;
}
function buildShadedPolygon(q, start, end) {
  const a = Math.min(start, end), b = Math.max(start, end);
  const step = (b - a) / 250;
  const pts = [];
  for (let x=a; x<=b + 1e-9; x += step) pts.push({x:+x, y: q.func(x)});
  // close to x-axis along the interval
  pts.push({x:b, y:0}, {x:a, y:0});
  return pts;
}
function buildCorrectPolygon(q) {
  const [a,b] = q.limits;
  return buildShadedPolygon(q, a, b);
}

/* Build right-side question buttons */
const qListDiv = document.getElementById('qList');
function renderQuestionButtons(){
  qListDiv.innerHTML = '';
  for (let i=0;i<total;i++){
    const btn = document.createElement('div');
    btn.className = 'qbtn ' + status[i];
    btn.innerText = (i+1);
    btn.title = questions[i].text;
    btn.onclick = (() => { return () => { loadQuestion(i); }; })();
    qListDiv.appendChild(btn);
  }
}

/* Load question: draw curve, clear user state for this question */
function loadQuestion(index){
  if (index !== undefined) currentIndex = index;
  const q = questions[currentIndex];
  document.getElementById('questionText').innerText = `Q${currentIndex+1}: ${q.text}`;
  document.getElementById('currentQ').innerText = `Current: ${currentIndex+1} / ${total}`;

  // clear datasets
  chart.data.datasets = [];

  // curve dataset
  const pts = buildCurvePoints(q);
  chart.data.datasets.push({
    label:'curve',
    data: pts,
    borderColor:'#EEEEFF',
    borderWidth:2,
    fill:false,
    pointRadius:0,
    tension:0.2
  });

  // remove user selection/shading trackers
  userSelected = [null, null];
  if (shadedDatasetIndex !== null) shadedDatasetIndex = null;
  if (revealedCorrectDatasetIndex !== null) revealedCorrectDatasetIndex = null;

  // autoscale y based on curve values (a bit of padding)
  const ys = pts.map(p=>p.y);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  chart.options.scales.y.min = Math.min(0, yMin) - Math.abs(yMax - yMin)*0.2 - 0.2;
  chart.options.scales.y.max = yMax + Math.abs(yMax - yMin)*0.2 + 0.2;

  chart.update();
  renderQuestionButtons();
  refreshStatusUI();
}

/* UI: refresh score/progress/final */
function refreshStatusUI(){
  document.getElementById('scoreText').innerText = `Score: ${score}`;
  const done = status.filter(s => s !== 'unattempted').length;
  const percent = ((done/total)*100).toFixed(1);
  document.getElementById('progressPercent').innerText = `Progress: ${percent}%`;
}

/* Mapping canvas pixel to chart x-value */
function pixelToValue(evt){
  const canvasRect = chart.canvas.getBoundingClientRect();
  const px = evt.clientX - canvasRect.left;
  const py = evt.clientY - canvasRect.top;
  // chart.scales.x.getValueForPixel is available in Chart.js v3+
  const xScale = chart.scales.x;
  try {
    const xVal = xScale.getValueForPixel(px);
    return xVal;
  } catch (e){
    // fallback: approximate via dataset range
    const ds = chart.data.datasets[0];
    if (!ds || ds.data.length===0) return null;
    // approximate linear mapping from pixels to x domain
    const left = xScale.left, right = xScale.right;
    const minX = xScale.min, maxX = xScale.max;
    const t = (px - left) / (right - left);
    return minX + t*(maxX-minX);
  }
}

/* Click handling: choose start and end on chart */
chart.canvas.addEventListener('click', (evt) => {
  const xVal = pixelToValue(evt);
  if (xVal === null || isNaN(xVal)) return;
  if (userSelected[0] === null) {
    userSelected[0] = xVal;
    showMarker(xVal, 'start');
  } else if (userSelected[1] === null) {
    userSelected[1] = xVal;
    showMarker(xVal, 'end');
  } else {
    // both already selected -> overwrite start with this click and clear end
    userSelected = [xVal, null];
    removeMarkers();
    showMarker(xVal, 'start');
  }
});

/* Markers as tiny datasets */
function showMarker(x, which){
  // remove existing small point if same type exists
  chart.data.datasets = chart.data.datasets.filter(ds => !ds._marker || ds._marker !== which);
  const q = questions[currentIndex];
  const y = q.func(x);
  chart.data.datasets.push({
    label: 'marker-'+which,
    data: [{x:+x, y:+y}],
    pointRadius: 6,
    backgroundColor: which === 'start' ? '#ffd166' : '#06d6a0',
    borderColor: '#0b3d2e',
    showLine:false,
    _marker: which
  });
  chart.update();
}
function removeMarkers(){
  chart.data.datasets = chart.data.datasets.filter(ds => !ds._marker);
  chart.update();
}

/* Shade button: draw user's shaded polygon between selected points */
function shadeSelected(){
  const q = questions[currentIndex];
  if (userSelected[0] === null || userSelected[1] === null) {
    alert('Select START and END on the chart by clicking twice before shading.');
    return;
  }
  // remove existing user shaded dataset
  chart.data.datasets = chart.data.datasets.filter(ds => !ds._userShade);
  const poly = buildShadedPolygon(q, userSelected[0], userSelected[1]);
  chart.data.datasets.push({
    label: 'userShade',
    data: poly,
    backgroundColor: 'rgba(255,0,0,0.45)', // 🔴 red fill
    borderColor: '#ff0000',                 // 🔴 red border
    fill: true,
    pointRadius: 0,
    tension: 0,
    _userShade: true
  });
  shadedDatasetIndex = chart.data.datasets.length - 1;
  chart.update();
}

/* Undo: remove user shading (and markers) */
function undoShade(){
  chart.data.datasets = chart.data.datasets.filter(ds => !ds._userShade && !ds._marker);
  userSelected = [null, null];
  shadedDatasetIndex = null;
  chart.update();
}

/* Check Answer:
   - show the correct shaded polygon
   - compare user's selected interval to true interval using tolerance
   - set status color and update score/progress
   - if question was already checked before, mark as 'revisited' instead
*/
function checkAnswer(){
  const q = questions[currentIndex];
  const trueA = q.limits[0], trueB = q.limits[1];

  // reveal correct shading (remove existing revealed)
  chart.data.datasets = chart.data.datasets.filter(ds => !ds._correctShade);
  const correctPoly = buildCorrectPolygon(q);
  chart.data.datasets.push({
    label:'correctShade',
    data: correctPoly,
    backgroundColor: 'rgba(52,152,219,0.22)',
    borderColor: '#2b86c6',
    fill:true,
    pointRadius:0,
    tension:0,
    _correctShade: true
  });
  revealedCorrectDatasetIndex = chart.data.datasets.length - 1;

  // evaluate user's selection
  let result = false;
  if (userSelected[0] !== null && userSelected[1] !== null) {
    const uA = Math.min(userSelected[0], userSelected[1]);
    const uB = Math.max(userSelected[0], userSelected[1]);
    // tolerance relative to interval length
    const tol = Math.max(0.1, 0.08 * (Math.abs(trueB - trueA)));
    if (Math.abs(uA - trueA) <= tol && Math.abs(uB - trueB) <= tol) result = true;
  }

  // determine status update
  if (!firstCheckDone[currentIndex]) {
    // first time checking
    firstCheckDone[currentIndex] = true;
    if (result) {
      status[currentIndex] = 'correct';
      score += 1;
    } else {
      status[currentIndex] = 'wrong';
    }
  } else {
    // revisited (already checked before)
    status[currentIndex] = 'revisited';
    // if previously was correct and now incorrect, adjust score accordingly
    // For simplicity: if previously 'correct' and now not matching, decrement score
    // if previously not correct and now matching, increment score
    // find previous check state: we can't easily know earlier value now, so we'll adjust conservatively:
    // If user was previously 'correct' and status overwritten to 'revisited', keep score unchanged.
    // If revisited and result true and earlier wasn't correct, ensure score counts it (but we don't track earlier value now).
    // To keep logic simple and safe, don't adjust score on revisits here.
  }

  refreshStatusUI();
  renderQuestionButtons();
  chart.update();
}

/* Next question helper */
function nextQuestion(){
  if (currentIndex < total - 1) {
    currentIndex++;
    loadQuestion(currentIndex);
  } else {
    alert('This is the last question. Click Finish Test when ready.');
  }
}

/* Finish Test: show final summary */
/* Finish Test: show final summary */
/* Finish Test: show final summary */
async function finishTest() {
  const done = status.filter(s => s !== 'unattempted').length;
  const percent = Math.round((done / total) * 100);

  document.getElementById('finalReport').innerHTML =
    `<div>Test finished — Score: <strong>${score}/${total}</strong></div>
     <div>Attempted: ${done}/${total} (${percent}%)</div>
     <small>Green=Correct, Red=Wrong, Blue=Revealed</small>`;

  const subject = "Mathematics";
  const gameName = "Integral Curve Catcher";
  const username = sessionStorage.getItem("loggedInUser");

  // ✅ Save locally
  localStorage.setItem(`progress_${username}_${subject}_${gameName}`, percent);
  localStorage.setItem(`score_${username}_${subject}_${gameName}`, score);

  // ✅ Upload progress only (DB doesn’t store score)
  await uploadProgress(subject, gameName, percent);
}

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
      body: JSON.stringify({
        username,
        subject,
        gameName,
        progressPercent: progress
      })
    });

    const data = await res.json();
    if (res.ok) {
      alert(`✅ Progress uploaded!\nProgress: ${progress}%`);
    } else {
      alert("❌ Upload failed: " + (data.message || "Unknown error"));
    }
  } catch (err) {
    console.error(err);
    alert("🚨 Server error. Please try again later.");
  }
}


/* Hooks for UI buttons */
document.getElementById('shadeBtn').addEventListener('click', shadeSelected);
document.getElementById('undoBtn').addEventListener('click', undoShade);
document.getElementById('checkBtn').addEventListener('click', checkAnswer);
document.getElementById('nextBtn').addEventListener('click', nextQuestion);
document.getElementById('finishBtn').addEventListener('click', finishTest);
document.getElementById('finishBtnRight').addEventListener('click', finishTest);

/* Keyboard shortcuts */
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') { e.preventDefault(); shadeSelected(); }
  if (e.key.toLowerCase() === 'u') undoShade();
  if (e.code === 'Enter') checkAnswer();
  if (e.key === 'ArrowRight') nextQuestion();
});

/* Initial render */
renderQuestionButtons();
loadQuestion(0);
refreshStatusUI();

function goBack() {
  window.location.href = "math.html";
}