
  let connections = [];
  let svg = document.getElementById("wires");
  let draggingWire = null;
  let startComp = null;

  const username = sessionStorage.getItem("loggedInUser") || "guest";
const subject = "Physics";
const gameName = "Circuit Builder";
 
  document.querySelectorAll('.component').forEach(comp=>{
    comp.addEventListener("mousedown", e=>{
      startComp = comp.id;
      let c=comp.getBoundingClientRect();
      let container=document.querySelector(".game-container").getBoundingClientRect();
      let x=c.left+c.width/2 - container.left;
      let y=c.top+c.height/2 - container.top;
 
      draggingWire=document.createElementNS("http://www.w3.org/2000/svg","path");
      draggingWire.setAttribute("d",`M${x},${y} Q${x},${y} ${x},${y}`);
      svg.appendChild(draggingWire);
 
      function onMouseMove(ev){
        let x2=ev.clientX - container.left;
        let y2=ev.clientY - container.top;
        let cx=(x+x2)/2;
        let cy=(y+y2)/2 - 80;
        draggingWire.setAttribute("d",`M${x},${y} Q${cx},${cy} ${x2},${y2}`);
      }
 
      function onMouseUp(ev){
        let target=document.elementFromPoint(ev.clientX, ev.clientY);
        if(target && target.classList.contains("component") && target.id!==startComp){
          if(startComp==="battery" && target.id==="battery"){
            svg.removeChild(draggingWire);
            shortCircuitEffect(ev.clientX, ev.clientY);
          } else {
            connections.push([startComp,target.id]);
            let c2=target.getBoundingClientRect();
            let container=document.querySelector(".game-container").getBoundingClientRect();
            let x2=c2.left+c2.width/2 - container.left;
            let y2=c2.top+c2.height/2 - container.top;
            let cx=(x+x2)/2;
            let cy=(y+y2)/2 - 80;
            draggingWire.setAttribute("d",`M${x},${y} Q${cx},${cy} ${x2},${y2}`);
          }
        } else {
          svg.removeChild(draggingWire);
        }
        document.removeEventListener("mousemove",onMouseMove);
        document.removeEventListener("mouseup",onMouseUp);
        draggingWire=null;
        startComp=null;
      }
 
      document.addEventListener("mousemove",onMouseMove);
      document.addEventListener("mouseup",onMouseUp);
    });
  });
 
  function shortCircuitEffect(x,y){
    let container=document.getElementById("container");
    container.classList.add("flash");
    document.getElementById("errorSound").play();
 
    for(let i=0;i<20;i++){
      let spark=document.createElement("div");
      spark.className="spark";
      spark.style.left=(x-container.getBoundingClientRect().left)+"px";
      spark.style.top=(y-container.getBoundingClientRect().top)+"px";
      spark.style.setProperty("--dx",(Math.random()*200-100)+"px");
      spark.style.setProperty("--dy",(Math.random()*200-100)+"px");
      container.appendChild(spark);
      setTimeout(()=>spark.remove(),800);
    }
 
    setTimeout(()=>container.classList.remove("flash"),1000);
  }
 
  function checkCircuit(){
    let msg=document.getElementById("message");
    let bulb=document.getElementById("bulb");
    let fan=document.getElementById("fan");
 
    let hasBulb = connections.some(c=>c.includes("bulb"));
    let hasFan = connections.some(c=>c.includes("fan"));
    let hasBattery = connections.some(c=>c.includes("battery"));
    let hasSwitch = connections.some(c=>c.includes("switch"));
 
    if(hasBattery && hasSwitch && (hasBulb || hasFan)){
      msg.innerText="✅ Current flows! The circuit is complete.";
      msg.className="message success";
      if(hasBulb) bulb.classList.add("glow");
      if(hasFan) fan.classList.add("spin");

       localStorage.setItem("circuitGameProgress", 100);

    } else {
      msg.innerText="❌ No current flows. Open/short circuit.";
      msg.className="message error";

       localStorage.setItem("circuitGameProgress", 0);
    }
  }
 
  function resetCircuit(){
    connections=[];
    svg.innerHTML="";
    document.getElementById("message").innerText="";
    document.getElementById("bulb").classList.remove("glow");
    document.getElementById("fan").classList.remove("spin");
  }
  async function submitCircuitProgress() {
  let msg = document.getElementById("submitMessage");

  let hasBattery = connections.some(c => c.includes("battery"));
  let hasSwitch = connections.some(c => c.includes("switch"));
  let hasBulb = connections.some(c => c.includes("bulb"));
  let hasFan = connections.some(c => c.includes("fan"));

  let progress = 0;
  if (hasBattery) progress = 25;
  if (hasBattery && hasSwitch) progress = 50;
  if (hasBattery && hasSwitch && (hasBulb || hasFan)) progress = 75;

  let circuitMsg = document.getElementById("message").innerText;
  if (circuitMsg.includes("Current flows")) {
    progress = 100;
  }

  // Save locally
  localStorage.setItem("circuitGameProgress", progress);

  // Upload to backend
  try {
    const res = await fetch("http://localhost:5001/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, subject, gameName, progressPercent: progress })
    });

    const data = await res.json();
    if (res.ok) {
      msg.innerText = `📊 Progress saved: ${progress}% (Synced to server)`;
      msg.style.color = "green";
      console.log("Uploaded:", data);
    } else {
      msg.innerText = "❌ Upload failed: " + data.message;
      msg.style.color = "red";
    }
  } catch (err) {
    console.error("Upload failed:", err);
    msg.innerText = `📊 Progress saved locally: ${progress}% (No internet)`;
    msg.style.color = "orange";
  }
}

// ------------------- Go Back -------------------
function goBack() {
  window.location.href = "phy.html";
}