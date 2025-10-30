const rounds = [
  {a:3,b:4,c:5}, {a:5,b:12,c:13}, {a:8,b:15,c:17},
  {a:7,b:24,c:25}, {a:9,b:40,c:41}, {a:20,b:21,c:29},
  {a:12,b:35,c:37}, {a:11,b:60,c:61}, {a:16,b:63,c:65},
  {a:36,b:77,c:85}
];
const total = rounds.length;
let currentIndex=0, status=Array(total).fill('unattempted'), placedAnswer=null;
let score=0, combo=0, revealed=Array(total).fill(false);

const qListDiv = document.getElementById('qList');

function renderQuestionButtons(){
  qListDiv.innerHTML='';
  for(let i=0;i<total;i++){
    const btn=document.createElement('div');
    btn.className='qbtn '+status[i];
    btn.innerText=i+1;
    btn.onclick=(()=>()=>{ loadRound(i); })();
    qListDiv.appendChild(btn);
  }
}

function generateCalculator(){
  const calcDiv = document.getElementById('calcButtons');
  calcDiv.innerHTML='';
  [1,2,3,4,5,6,7,8,9,10,12,13,15,16,20,21,24,25,29,35,36,37,40,41,60,61,63,65,77,85].forEach(n=>{
    const btn = document.createElement('button');
    btn.innerText=n+'²';
    btn.onclick=()=> alert(n+'² = '+(n*n));
    calcDiv.appendChild(btn);
  });
}

function loadRound(index){
  if(index!==undefined) currentIndex=index;
  const round=rounds[currentIndex];
  placedAnswer=null;
  document.getElementById('dropAnswer').innerText='Drop answer here';
  document.getElementById('dropAnswer').classList.remove('filled');
  document.getElementById('round').innerText=currentIndex+1;
  document.getElementById('currentQ').innerText=`Current: ${currentIndex+1} / ${total}`;

  const sides=['a','b','c'];
  const missing = sides[Math.floor(Math.random()*3)];
  let exprText='';
  if(missing==='c') exprText=`c² = ${round.a}² + ${round.b}²`;
  else if(missing==='a') exprText=`a² = ${round.c}² - ${round.b}²`;
  else exprText=`b² = ${round.c}² - ${round.a}²`;
  document.getElementById('questionExpression').innerText=`Q${currentIndex+1}: ${exprText}`;
  document.getElementById('questionText').innerText=`Q${currentIndex+1}: ${exprText}`;

  document.getElementById('labelA').innerText='a = '+(missing==='a'?'?':round.a);
  document.getElementById('labelB').innerText='b = '+(missing==='b'?'?':round.b);
  document.getElementById('labelC').innerText='c = '+(missing==='c'?'?':round.c);

  generateCalculator();

  const options=[];
  let correct=Math.round(Math.sqrt(missing==='a'?Math.pow(round.c,2)-Math.pow(round.b,2):
                         missing==='b'?Math.pow(round.c,2)-Math.pow(round.a,2):
                         Math.pow(round.a,2)+Math.pow(round.b,2)));
  options.push(correct);
  while(options.length<3){
    const fake = correct+Math.floor(Math.random()*5+1);
    if(!options.includes(fake)) options.push(fake);
  }
  options.sort(()=>Math.random()-0.5);
  const container=document.getElementById('sides-container');
  container.innerHTML='';
  options.forEach(opt=>{
    const div=document.createElement('div');
    div.className='side';
    div.draggable=true;
    div.innerText=missing+' = '+opt;
    container.appendChild(div);
    div.addEventListener('dragstart', e=>{
      e.dataTransfer.setData('answer',opt);
      e.dataTransfer.setData('side',missing);
    });
  });

  document.querySelector('#dropAnswer').ondrop=e=>{
    e.preventDefault();
    const val=e.dataTransfer.getData('answer');
    placedAnswer=parseInt(val);
    document.getElementById('dropAnswer').innerText=missing+' = '+val;
    document.getElementById('dropAnswer').classList.add('filled');
  };
  document.querySelector('#dropAnswer').ondragover=e=>e.preventDefault();
  renderQuestionButtons();
}

function checkAnswer(){
  const round=rounds[currentIndex];
  const drop=document.getElementById('dropAnswer');
  if(!placedAnswer){ alert('Drag an answer first!'); return; }
  const missing=drop.innerText.split('=')[0].trim();
  let correct=Math.round(Math.sqrt(missing==='a'?Math.pow(round.c,2)-Math.pow(round.b,2):
                         missing==='b'?Math.pow(round.c,2)-Math.pow(round.a,2):
                         Math.pow(round.a,2)+Math.pow(round.b,2)));
  if(placedAnswer===correct){
    drop.style.background='#2ecc71'; status[currentIndex]='correct'; score++; combo++;
    document.getElementById('result').innerText='✅ Correct!';
  } else {
    drop.style.background='#e74c3c'; status[currentIndex]='wrong'; combo=0;
    document.getElementById('result').innerText='❌ Wrong! Click Check to reveal answer';
  }
  if(!revealed[currentIndex]){
    revealed[currentIndex]=true;
    if(status[currentIndex]==='wrong'){
      drop.style.background='#3498db';
      drop.innerText=missing+' = '+correct;
      status[currentIndex]='revealed';
    }
  }
  renderQuestionButtons();
  refreshHUD();
}

function nextQuestion(){
  if(currentIndex<total-1){ currentIndex++; loadRound(currentIndex); }
  else alert('This is the last question.');
}

async function finishTest() {
  const done = status.filter(s => s !== 'unattempted').length;
  const percent = Math.round((done / total) * 100);

  document.getElementById('finalReport').innerHTML =
    `<div>Test finished — Score: <strong>${score}/${total}</strong></div>
     <div>Attempted: ${done}/${total} (${percent}%)</div>
     <small>Green=Correct, Red=Wrong, Blue=Revealed</small>`;

  const subject = "Mathematics";
  const gameName = "Pythagoras Triangle Quiz";
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

function refreshHUD(){
  document.getElementById('score').innerText=score;
  document.getElementById('combo').innerText=combo;
  const done=status.filter(s=>s!=='unattempted').length;
  const percent=((done/total)*100).toFixed(1);
  document.getElementById('progressPercent').innerText=`Progress: ${percent}%`;
}

document.getElementById('checkBtn').addEventListener('click',checkAnswer);
document.getElementById('nextBtn').addEventListener('click',nextQuestion);
document.getElementById('finishBtn').addEventListener('click',finishTest);
document.getElementById('finishBtnRight').addEventListener('click',finishTest);

// Init
loadRound(0);
function goBack() {
  window.location.href = "math.html";
}
