/* Blood Match Arena
   - Click compatible donor droplets around the recipient.
   - Compatibility logic implemented for ABO + Rh:
     ABO: A <= {A,O}, B <= {B,O}, AB <= {A,B,AB,O}, O <= {O}
     Rh: recipient '+' accepts donor '+' or '-', recipient '-' accepts donor '-' only.
   - O- is universal donor.
   - Visual neon UI; rounds with timer; score/energy.
*/
 
// Utility / config
const ARENA = document.getElementById('arena');
const REC = document.getElementById('recipient');
const REC_TYPE_LABEL = document.getElementById('recipientType');
const SCORE_EL = document.getElementById('score');
const ENERGY_EL = document.getElementById('energy');
const ROUND_EL = document.getElementById('round');
const OVERLAY = document.getElementById('overlay');
const OVERLAY_TITLE = document.getElementById('overlayTitle');
const OVERLAY_TEXT = document.getElementById('overlayText');
const NEXT_BTN = document.getElementById('nextBtn');
 
const TIMER_ARC = document.getElementById('timerArc');
const TIME_NUM = document.getElementById('timeNum');
const START_BTN = document.getElementById('startBtn');
const AUTO_BTN = document.getElementById('autoBtn');
 
let score = 0;
let energy = 100;
let round = 1;
let roundTime = 12; // seconds per round
let timeLeft = roundTime;
let timerInterval = null;
let spawnInterval = null;
let autoSpawn = true;
 
const donorTypes = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];
 
// compatibility check
function compatible(recipient, donor){
  // recipient and donor strings like "A+" or "O-"
  const [rABO, rRh] = [recipient.slice(0,-1), recipient.slice(-1)];
  const [dABO, dRh] = [donor.slice(0,-1), donor.slice(-1)];
 
  // Rh rule
  if(rRh === '-' && dRh === '+') return false; // Rh- cannot accept + donor
  // ABO rule
  if(rABO === 'O') return dABO === 'O';
  if(rABO === 'A') return (dABO === 'A' || dABO === 'O');
  if(rABO === 'B') return (dABO === 'B' || dABO === 'O');
  if(rABO === 'AB') return (dABO === 'A' || dABO === 'B' || dABO === 'AB' || dABO === 'O');
  return false;
}
              
// random recipient each round
function randomRecipient(){
  return donorTypes[Math.floor(Math.random()*donorTypes.length)];
}
 
// spawn donor droplets around the recipient at random ring positions
function spawnDonors(count=6){
  // remove existing droplets
  document.querySelectorAll('.droplet').forEach(d=>d.remove());
  const rect = ARENA.getBoundingClientRect();
  const cx = rect.left + rect.width/2;
  const cy = rect.top + rect.height/2;
 
  for(let i=0;i<count;i++){
    const type = donorTypes[Math.floor(Math.random()*donorTypes.length)];
    const el = document.createElement('div');
    el.className = 'droplet d-' + type.replace('+','pos').replace('-','neg').replace('pos','pos').replace('neg','neg');
    // set inner label
    const lbl = document.createElement('div'); lbl.className='label'; lbl.textContent = type;
    el.appendChild(lbl);
 
    // random angle and radius
    const angle = Math.random()*Math.PI*2;
    const radius = 140 + Math.random()*140;
    // position relative to arena
    const left = rect.width/2 + Math.cos(angle)*radius - 32; // 32 = half droplet size
    const top  = rect.height/2 + Math.sin(angle)*radius - 32;
 
    el.style.left = `${left}px`;
    el.style.top  = `${top}px`;
 
    // add click handler
    el.addEventListener('click', ()=> onDonorClick(el, type));
 
    ARENA.appendChild(el);
 
    // small random float animation
    floatAnimation(el);
    // auto-remove after round end handled elsewhere
  }
}
 
// floating animation helper (CSS-less)
function floatAnimation(el){
  const amp = 6 + Math.random()*10;
  const period = 2500 + Math.random()*3000;
  const start = performance.now()*(Math.random()*0.001);
  function frame(t){
    const y = Math.sin((t*0.001 + start) * (2*Math.PI/period)) * amp;
    el.style.transform = `translateY(${y}px)`;
    el._floatRAF = requestAnimationFrame(frame);
  }
  el._floatRAF = requestAnimationFrame(frame);
}
 
// clear floating RAFs
function clearFloats(){
  document.querySelectorAll('.droplet').forEach(d=>{
    if(d._floatRAF) cancelAnimationFrame(d._floatRAF);
  });
}
 
// when user clicks donor
function onDonorClick(el, type){
  // avoid double click after round end
  if(!timerInterval) return;
 
  const recType = REC_TYPE_LABEL.textContent;
  if(compatible(recType, type)){
    // correct
    score += 10;
    energy = Math.min(100, energy + 6); // small energy restore
    REC.classList.add('glow');
    setTimeout(()=>REC.classList.remove('glow'), 400);
    // quick visual pop
    popEffect(el, true);
  } else {
    score = Math.max(0, score - 6);
    energy = Math.max(0, energy - 16);
    // red flash
    el.style.boxShadow = '0 12px 40px rgba(255,80,80,0.25)';
    popEffect(el, false);
  }
  SCORE_EL.textContent = score;
  ENERGY_EL.textContent = energy;
  // remove clicked droplet
  el.remove();
 
  if(energy <= 0) {
    endGame('Energy depleted — Game Over');
  }
}
 
// pop effect
function popEffect(el, good){
  const p = document.createElement('div');
  p.style.position='absolute'; p.style.left=el.style.left; p.style.top=el.style.top;
  p.style.width='64px'; p.style.height='64px'; p.style.borderRadius='50%';
  p.style.pointerEvents='none';
  p.style.zIndex=80;
  p.style.boxShadow = good ? '0 0 40px rgba(174,255,214,0.35)' : '0 0 40px rgba(255,110,110,0.3)';
  ARENA.appendChild(p);
  p.animate([
    { transform:'scale(0.8)', opacity:1},
    { transform:'scale(1.6)', opacity:0}
  ], { duration:380 }).onfinish = ()=>p.remove();
}
 
// timer & round control
function startRound(){
  // reset UI
  timeLeft = roundTime;
  TIME_NUM.textContent = timeLeft;
  updateTimerArc();
 
  // choose recipient and spawn donors
  const r = randomRecipient();
  REC_TYPE_LABEL.textContent = r;
  round = Math.max(1, round);
  ROUND_EL.textContent = round;
  // spawn donors
  spawnDonors(8);
 
  // start timer
  if(timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(()=>{
    timeLeft--;
    if(timeLeft<=0){
      clearInterval(timerInterval);
      timerInterval = null;
      // show overlay results
      showRoundResults();
      clearFloats();
      // stop spawning
      if(spawnInterval) { clearInterval(spawnInterval); spawnInterval=null; }
    }
    TIME_NUM.textContent = timeLeft;
    updateTimerArc();
  },1000);
 
  // auto spawn additional donors if enabled
  if(autoSpawn){
    if(spawnInterval) clearInterval(spawnInterval);
    spawnInterval = setInterval(()=> spawnDonors( Math.floor(3 + Math.random()*4) ), 3500);
  }
}
 
// update SVG arc based on timeLeft / roundTime
function updateTimerArc(){
  const total = 2*Math.PI*52; // circumference
  const frac = Math.max(0, timeLeft / roundTime);
  const dash = total * frac;
  TIMER_ARC.style.strokeDashoffset = (total - dash).toFixed(1);
}
 
// show overlay after round end
function showRoundResults(){
  OVERLAY.classList.add('show');
  OVERLAY_TITLE.textContent = `Round ${round} Results`;
  OVERLAY_TEXT.textContent = `Score: ${score} · Energy: ${energy}`;
  NEXT_BTN.focus();
}
 
// proceed to next round
NEXT_BTN.addEventListener('click', ()=> {
  OVERLAY.classList.remove('show');
  // cleanup donors
  document.querySelectorAll('.droplet').forEach(d=>d.remove());
  // increment round
  round++;
  round = Math.max(1, round);
  ROUND_EL.textContent = round;
  // start next
  startRound();
});
 
// start button / toggles
START_BTN.addEventListener('click', ()=> {
  // reset some values if starting fresh
  score = 0; energy = 100; round = 1;
  SCORE_EL.textContent = score; ENERGY_EL.textContent = energy; ROUND_EL.textContent = round;
  document.querySelectorAll('.droplet').forEach(d=>d.remove());
  startRound();
});
 
AUTO_BTN.addEventListener('click', ()=> {
  autoSpawn = !autoSpawn;
  AUTO_BTN.textContent = `Auto Spawn: ${autoSpawn ? 'ON' : 'OFF'}`;
  if(!autoSpawn && spawnInterval) { clearInterval(spawnInterval); spawnInterval = null; }
});
 
// end game when energy depleted
function endGame(reason){
  if(timerInterval){ clearInterval(timerInterval); timerInterval=null; }
  if(spawnInterval){ clearInterval(spawnInterval); spawnInterval=null; }
  document.querySelectorAll('.droplet').forEach(d=>d.remove());
  OVERLAY.classList.add('show');
  OVERLAY_TITLE.textContent = 'GAME OVER';
  OVERLAY_TEXT.textContent = `${reason} · Final Score: ${score}`;
  NEXT_BTN.textContent = 'Play Again';
  NEXT_BTN.focus();
}
 
// responsive: reposition droplets if arena resizes (simple)
window.addEventListener('resize', ()=>{
  // remove and respawn to avoid layout issues
  document.querySelectorAll('.droplet').forEach(d=>d.remove());
  // if round active, spawn again
  if(timerInterval) spawnDonors(8);
});
 
// show rules on clicking recipient
REC.addEventListener('click', ()=>{
  const r = REC_TYPE_LABEL.textContent;
  const rules = explainCompatibility(r);
  alert(`Recipient ${r} accepts donors: ${rules.join(', ')}`);
});
 
// helper to list compatible donors for info
function explainCompatibility(rec){
  return donorTypes.filter(d => compatible(rec, d));
}
 
// initial UI setup
updateTimerArc();
TIME_NUM.textContent = roundTime;
SCORE_EL.textContent = score;
ENERGY_EL.textContent = energy;
ROUND_EL.textContent = round;
 
// small demo start: spawn a handful but wait for user to press Start Round
spawnDonors(6);

// === Finish Button Logic ===
document.getElementById("finishBtn").addEventListener("click", finishGame);

function finishGame() {
  const username = sessionStorage.getItem("loggedInUser");
  const subject = "Biology";
  const gameName = "Blood Arena";

  // progress = % rounds survived, capped at 100
  const progressPercent = Math.min(100, round * 10);

  // Save locally
  localStorage.setItem(`progress_${username}_${subject}_${gameName}`, progressPercent);
  localStorage.setItem(`score_${username}_${subject}_${gameName}`, score);

  // Upload to server
  fetch("http://localhost:5001/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      subject,
      gameName,
      progressPercent,
      score
    })
  })
    .then(res => {
      if (!res.ok) throw new Error("Upload failed");
      alert(`✅ Game finished!\nProgress: ${progressPercent}%\nScore: ${score}`);
    })
    .catch(err => {
      console.error("❌ Upload failed:", err);
      alert("⚠️ Upload failed, but progress is saved locally.");
    });
}
function goBack() {
  window.location.href = "bio.html";
}