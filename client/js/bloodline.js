// ABO + Rh inheritance logic
const ABO_COMBOS = {
  'A': { 'A': ['A','O'], 'B': ['A','B','AB','O'], 'AB':['A','B','AB','O'], 'O':['A','O'] },
  'B': { 'A': ['A','B','AB','O'], 'B': ['B','O'], 'AB':['A','B','AB','O'], 'O':['B','O'] },
  'AB':{ 'A': ['A','AB'], 'B':['B','AB'], 'AB':['A','B','AB'], 'O':['A','B'] },
  'O': { 'A':['A','O'], 'B':['B','O'], 'AB':['A','B'], 'O':['O'] }
};

const BLOOD_GROUPS = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];

let score = 0, correctAnswers = [];
let currentRound = 0;
const totalRounds = 10;

function randomGroup(){ 
  return BLOOD_GROUPS[Math.floor(Math.random()*BLOOD_GROUPS.length)]; 
}

function predictChild(f,m){
  const [fABO,fRh] = [f.slice(0,-1), f.slice(-1)];
  const [mABO,mRh] = [m.slice(0,-1), m.slice(-1)];
  let abos = new Set(ABO_COMBOS[fABO][mABO].concat(ABO_COMBOS[mABO][fABO]));
  let rhs = [];
  if(fRh==='+'||mRh==='+'){ rhs=['+','-']; } else { rhs=['-']; }
  let child=[];
  abos.forEach(a=>rhs.forEach(r=>child.push(a+r)));
  return child;
}

function startGame(){
  score = 0;
  currentRound = 0;
  document.getElementById('score').innerText = `Score: ${score}`;
  document.getElementById('startBtn').style.display="none";
  document.getElementById('nextBtn').style.display="inline-block";
  nextRound();
}

function nextRound(){
  if(currentRound >= totalRounds){
    finishGame();
    return;
  }

  currentRound++;

  const f = randomGroup(), m = randomGroup();
  document.getElementById('parents').innerText=`Round ${currentRound}/${totalRounds} | Father: ${f} | Mother: ${m}`;
  correctAnswers = predictChild(f,m);

  let options = new Set(correctAnswers);
  while(options.size < correctAnswers.length + 3){
    options.add(randomGroup());
  }
  options = [...options].sort(()=>Math.random()-0.5);

  const choiceBox = document.getElementById('choices');
  choiceBox.innerHTML = "";
  options.forEach(opt=>{
    const div=document.createElement('div');
    div.className="choice";
    div.textContent=opt;
    div.onclick=()=>checkAnswer(div,opt);
    choiceBox.appendChild(div);
  });
}

function checkAnswer(div,opt){
  if(correctAnswers.includes(opt)){
    div.classList.add("correct");
    score += 10;
  } else {
    div.classList.add("wrong");
    score -= 5;
  }
  document.getElementById('score').innerText=`Score: ${score}`;
}

function finishGame(){
  document.getElementById('parents').innerText = "🎉 Game Over!";
  document.getElementById('choices').innerHTML = "";
  document.getElementById('nextBtn').style.display = "none";
  document.getElementById('startBtn').style.display = "inline-block";
  document.getElementById('score').innerText = `Final Score: ${score}`;
}
function goBack() {
  window.location.href = "bio.html";
}