
/* Torque Balancer — Neon eSports
   Features implemented:
   - 30s timer, rounds with Next Round button
   - random weights spawned each round (respawn)
   - drag & drop visual placement on beam (weights stick visually)
   - live torque display Στ = Σ(m_i * d_i) (distance in m units scaled)
   - balance tolerance -> award +10 score
   - beam glow on perfect balance; tilt otherwise
   - Game Over overlay shows final score
   - Reset Round button to reshuffle the current round
*/
 
const POOL = document.getElementById('pool');
const placedContainer = document.getElementById('placed-container');
const beam = document.getElementById('beam');
const torqueDisplay = document.getElementById('torqueDisplay');
const scoreEl = document.getElementById('score');
const timeEl = document.getElementById('time');
const roundEl = document.getElementById('round');
const nextRoundBtn = document.getElementById('nextRoundBtn');
const resetBtn = document.getElementById('resetBtn');
const overlay = document.getElementById('overlay');
const finalScore = document.getElementById('finalScore');
const playAgainBtn = document.getElementById('playAgainBtn');
 
let score = 0;
let timeLeft = 30;
let round = 1;
let timerInterval = null;
let gameActive = true;
 
// Beam geometry helpers
function beamRect() { return beam.getBoundingClientRect(); }
function pivotX() {
  const r = beamRect();
  return r.left + r.width/2;
}
 
// game data
let weightsOnBeam = []; // {mass, distance (signed), el}
let availableWeights = []; // pool entries (draggable)
let placedEls = []; // DOM nodes for placed weights
 
// configuration
const DIST_SCALE = 50; // px -> torque distance unit (same as earlier code scaled)
const BALANCE_TOL = 0.2; // tolerance for torque ~ zero
const MAX_TILT_ANGLE = 20; // degrees
const ROUND_TIME = 30; // seconds per whole game (not per round)
const SCORE_PER_BALANCE = 10;
 
// sound stubs: use simple beep via WebAudio for success
let audioCtx = null;
function tinyBeep(freq=800, len=120, vol=0.04) {
  if(!window.AudioContext && !window.webkitAudioContext) return;
  if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.connect(g); g.connect(audioCtx.destination);
  o.frequency.value = freq;
  g.gain.value = vol;
  o.start();
  setTimeout(()=> {
    o.stop();
    o.disconnect();
    g.disconnect();
  }, len);
}
 
// random spawn set for a round: choose 3 weights randomly from set
const POSSIBLE_MASSES = [2,3,5,7,10];
function makeRandomRound() {
  // pick 3 random masses (allow repeats)
  const m = [];
  for(let i=0;i<3;i++){
    m.push(POSSIBLE_MASSES[Math.floor(Math.random()*POSSIBLE_MASSES.length)]);
  }
  return m;
}
 
function sizeClassForMass(m){
  if(m>=10) return 'w-large';
  if(m>=5) return 'w-medium';
  return 'w-small';
}
function placedClassForMass(m){
  if(m>=10) return 'large';
  if(m>=5) return 'medium';
  return 'small';
}
 
// spawn weights into pool with random x positions inside pool
function spawnPoolForRound(masses){
  POOL.innerHTML = '';
  availableWeights = [];
  masses.forEach((mass, idx) => {
    const div = document.createElement('div');
    div.className = `weight ${sizeClassForMass(mass)}`;
    div.draggable = true;
    div.dataset.mass = mass;
    div.id = `pool-${Date.now()}-${idx}`;
    div.textContent = mass + ' kg';
    // small random margin offset for "spawn variety"
    div.style.transform = `translateY(${Math.floor(Math.random()*6)}px) translateX(${Math.floor(Math.random()*8 - 4)}px)`;
    POOL.appendChild(div);
    availableWeights.push(div);
    // drag listeners
    div.addEventListener('dragstart', (ev)=>{
      ev.dataTransfer.setData('text/plain', JSON.stringify({mass:mass, cls: div.className}));
      // slightly scale to indicate dragging
      requestAnimationFrame(()=> div.style.transform += ' scale(0.98)');
    });
    div.addEventListener('dragend', ()=>{ div.style.transform = ''; });
  });
}
 
// allow dropping on beam
beam.addEventListener('dragover', ev => ev.preventDefault());
beam.addEventListener('drop', ev => {
  ev.preventDefault();
  if(!gameActive) return;
  const d = ev.dataTransfer.getData('text/plain');
  if(!d) return;
  const payload = JSON.parse(d);
  const mass = Number(payload.mass);
  const dropX = ev.clientX;
  const dist = (dropX - pivotX()) / DIST_SCALE; // signed distance (px -> units)
  placeWeightOnBeam(mass, dist, dropX - beam.getBoundingClientRect().left);
  // remove the dragged pool element to avoid reuse
  // find element in pool with that mass and closest id/position: easiest remove any availableWeight with same mass
  const found = availableWeights.find(el=>Number(el.dataset.mass)===mass);
  if(found){ found.remove(); availableWeights = availableWeights.filter(x=>x!==found); }
  checkBalanceAndUpdate();
});
 
// place visually on beam
function placeWeightOnBeam(mass, distanceSigned, leftPxInsideBeam){
  const placed = document.createElement('div');
  placed.className = `placed ${placedClassForMass(mass)}`;
  placed.textContent = mass + ' kg';
  // center horizontally at leftPxInsideBeam
  // placedContainer is width 740 and left aligned with beam; top already set to beam top.
  // adjust left so width/2 centers
  const left = leftPxInsideBeam - (placedClassForMass(mass)==='large' ? 51 : placedClassForMass(mass)==='medium' ? 41 : 32);
  placed.style.left = `${clamp(left, 4, 740 - 4 - (placedClassForMass(mass)==='large' ? 102 : placedClassForMass(mass)==='medium' ? 82 : 64))}px`;
  // bounce animation class:
  placed.style.animation = `dropBounce ${mass>=10?0.8:mass>=5?0.7:0.6}s ease`;
  placedContainer.appendChild(placed);
  placedEls.push(placed);
  weightsOnBeam.push({mass: mass, distance: Number(distanceSigned), el: placed});
  // small sound based on mass
  if(mass>=10) tinyBeep(180, 220, 0.12);
  else if(mass>=5) tinyBeep(320, 160, 0.06);
  else tinyBeep(520, 120, 0.035);
}
 
// clamp helper
function clamp(v,a,b){ return Math.max(a, Math.min(b, v)) }
 
// compute torque
function computeTorque(){
  let torque = 0;
  let terms = [];
  weightsOnBeam.forEach(w=>{
    const t = w.mass * w.distance;
    torque += t;
    terms.push(`${w.mass}×${w.distance.toFixed(1)}`);
  });
  torqueDisplay.textContent = terms.length>0 ? `Στ = ${terms.join(" + ")} = ${torque.toFixed(2)}` : 'Στ = 0';
  return torque;
}
 
// check balance & update visuals
let roundBalanced = false;
function checkBalanceAndUpdate(){
  const torque = computeTorque();
  // beam tilt angle
  const angle = clamp(-torque * 2, -MAX_TILT_ANGLE, MAX_TILT_ANGLE);
  beam.style.transform = `translateX(-50%) rotate(${angle}deg)`;
  // visual feedback
  if(Math.abs(torque) <= BALANCE_TOL){
    // balanced
    beam.classList.add('glow');
    roundBalanced = true;
    nextRoundBtn.style.display = 'inline-block';
    // award score once per balance (if not already counted this round)
    if(!nextRoundBtn.dataset.awarded){
      score += SCORE_PER_BALANCE;
      scoreEl.textContent = score;
      nextRoundBtn.dataset.awarded = '1';
      tinyBeep(880, 240, 0.12);
      // small pulse animation by scaling beam quickly
      beam.animate([{transform:`translateX(-50%) rotate(${angle}deg) scale(1)`},{transform:`translateX(-50%) rotate(${angle}deg) scale(1.04)`},{transform:`translateX(-50%) rotate(${angle}deg) scale(1)`}],{duration:360});
    }
  } else {
    beam.classList.remove('glow');
    roundBalanced = false;
    // hide next button if it's currently shown and not yet awarded
    // if previously awarded, still require Next Round to progress.
    if(!nextRoundBtn.dataset.awarded) nextRoundBtn.style.display = 'none';
  }
  // if torque extreme, visually emphasize
  // (we keep snapping / cracking out — but user didn't ask now, keep dramatic tilt only)
}
 
// start a new round: clear placed weights, spawn new pool
function startRound(randomMasses){
  // clear placed
  weightsOnBeam = [];
  placedEls.forEach(el=>el.remove());
  placedEls = [];
  // reset beam
  beam.style.transform = 'translateX(-50%) rotate(0deg)';
  beam.classList.remove('glow');
  torqueDisplay.textContent = 'Στ = 0';
  nextRoundBtn.style.display = 'none';
  nextRoundBtn.dataset.awarded = '';
  roundBalanced = false;
 
  // spawn pool
  spawnPoolForRound(randomMasses);
  roundEl.textContent = round;
}
 
// Next Round click
nextRoundBtn.addEventListener('click', ()=>{
  if(!roundBalanced) return;
  round++;
  roundEl.textContent = round;
  // new random masses
  const masses = makeRandomRound();
  startRound(masses);
});
 
// Reset Round button: reshuffle same round count
resetBtn.addEventListener('click', ()=>{
  // start new round with fresh random set but same round number (no score change)
  const masses = makeRandomRound();
  startRound(masses);
});
 
// Timer
function startTimer(){
  timeLeft = ROUND_TIME;
  timeEl.textContent = timeLeft;
  timerInterval = setInterval(()=>{
    timeLeft--;
    timeEl.textContent = timeLeft;
    if(timeLeft <= 0){
      clearInterval(timerInterval);
      endGame();
    }
  }, 1000);
}
 
// end game overlay
function endGame(){
  gameActive = false;
  // show overlay
  finalScore.textContent = score;
  overlay.classList.add('show');
  overlay.style.display = 'flex';
}
 
// Play again
playAgainBtn.addEventListener('click', ()=>{
  overlay.classList.remove('show');
  // reset game state
  score = 0; round = 1; scoreEl.textContent = 0; roundEl.textContent = 1;
  gameActive = true;
  nextRoundBtn.dataset.awarded = '';
  const masses = makeRandomRound();
  startRound(masses);
  startTimer();
});
 
// initialize first round & start
function initGame(){
  score = 0; round = 1;
  const masses = makeRandomRound();
  startRound(masses);
  scoreEl.textContent = '0';
  timeEl.textContent = String(ROUND_TIME);
  roundEl.textContent = '1';
  // show the pool for the first round
  startTimer();
}
 
// makeRandomRound/spawnPool helpers from earlier
function makeRandomRound() {
  const m = [];
  for(let i=0;i<3;i++){
    m.push(POSSIBLE_MASSES[Math.floor(Math.random()*POSSIBLE_MASSES.length)]);
  }
  return m;
}
function spawnPoolForRound(masses){
  POOL.innerHTML = '';
  availableWeights = [];
  masses.forEach((mass, idx) => {
    const div = document.createElement('div');
    div.className = `weight ${sizeClassForMass(mass)}`;
    div.draggable = true;
    div.dataset.mass = mass;
    div.id = `pool-${Date.now()}-${idx}`;
    div.textContent = mass + ' kg';
    // tiny random offset
    div.style.marginLeft = (Math.random()*10 - 5) + 'px';
    POOL.appendChild(div);
    availableWeights.push(div);
    div.addEventListener('dragstart', (ev)=>{
      ev.dataTransfer.setData('text/plain', JSON.stringify({mass:mass}));
      // visual cue
      requestAnimationFrame(()=> div.style.transform = 'scale(.98)');
    });
    div.addEventListener('dragend', ()=>{ div.style.transform = '' });
  });
}
function sizeClassForMass(m){
  if(m>=10) return 'w-large';
  if(m>=5) return 'w-medium';
  return 'w-small';
}
function placedClassForMass(m){
  if(m>=10) return 'large';
  if(m>=5) return 'medium';
  return 'small';
}
 
initGame();
