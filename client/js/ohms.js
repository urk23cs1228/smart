// ohms.js - Physics Ohm's Law Lab

let connections = [];
let svg = document.getElementById("wires");
let draggingWire = null;
let startComp = null;

const username = sessionStorage.getItem("loggedInUser") || "guest";
const subject = "Physics";
const gameName = "Ohm's Law";

// ------------------- Wire Drag & Drop -------------------
document.querySelectorAll('.component').forEach(comp => {
  comp.addEventListener("mousedown", e => {
    startComp = comp.id;
    let c = comp.getBoundingClientRect();
    let container = document.querySelector(".lab-container").getBoundingClientRect();
    let x = c.left + c.width / 2 - container.left;
    let y = c.top + c.height / 2 - container.top;

    draggingWire = document.createElementNS("http://www.w3.org/2000/svg", "path");
    draggingWire.setAttribute("d", `M${x},${y} Q${x},${y} ${x},${y}`);
    svg.appendChild(draggingWire);

    function onMouseMove(ev) {
      let x2 = ev.clientX - container.left;
      let y2 = ev.clientY - container.top;
      let cx = (x + x2) / 2;
      let cy = (y + y2) / 2 - 80;
      draggingWire.setAttribute("d", `M${x},${y} Q${cx},${cy} ${x2},${y2}`);
    }

    function onMouseUp(ev) {
      let target = document.elementFromPoint(ev.clientX, ev.clientY);
      if (target && target.classList.contains("component") && target.id !== startComp) {
        connections.push([startComp, target.id]);
        let c2 = target.getBoundingClientRect();
        let x2 = c2.left + c2.width / 2 - container.left;
        let y2 = c2.top + c2.height / 2 - container.top;
        let cx = (x + x2) / 2;
        let cy = (y + y2) / 2 - 80;
        draggingWire.setAttribute("d", `M${x},${y} Q${cx},${cy} ${x2},${y2}`);
      } else {
        svg.removeChild(draggingWire);
      }
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      draggingWire = null;
      startComp = null;
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });
});

// ------------------- UI Updates -------------------
function updateLabels() {
  document.getElementById("voltageLabel").innerText = document.getElementById("voltageSlider").value + "V";
}

function rotateNeedle(needleId, value, maxValue) {
  let angle = -90 + (180 * value / maxValue); // -90° to +90°
  document.getElementById(needleId).style.transform = `rotate(${angle}deg)`;
}

// ------------------- Circuit Check -------------------
function checkCircuit() {
  const msg = document.getElementById("message");
  const bulb = document.getElementById("bulb");

  const hasBattery = connections.some(c => c.includes("battery"));
  const hasResistor = connections.some(c => c.includes("resistor"));
  const hasBulb = connections.some(c => c.includes("bulb"));

  let progress = 0;

  if (hasBattery && hasResistor) progress = 25;
  if (hasBattery && hasResistor && hasBulb) progress = 50;

  if (hasBattery && hasResistor && hasBulb) {
    const V = parseInt(document.getElementById("voltageSlider").value);
    const R = parseInt(document.getElementById("resistanceSelect").value);
    const I = (V / R).toFixed(2);

    msg.innerText = `✅ Circuit Complete! Current I = ${I} A`;
    msg.className = "message success";

    rotateNeedle("voltNeedle", V, 20);
    rotateNeedle("ampNeedle", I, 10);

    bulb.classList.add("glow");
    bulb.style.animation = `bulbPulse ${1 / Math.max(I, 0.2)}s infinite alternate`;

    let style = document.createElement("style");
    style.innerHTML = `@keyframes bulbPulse { from {opacity:0.5;} to {opacity:1;} }`;
    document.head.appendChild(style);

    progress = 100;
  } else {
    msg.innerText = "❌ Incomplete Circuit. Connect Battery, Resistor, and Bulb.";
    msg.className = "message error";

    rotateNeedle("voltNeedle", 0, 20);
    rotateNeedle("ampNeedle", 0, 10);
  }

  saveProgress(progress);
}

// ------------------- Reset -------------------
function resetCircuit() {
  connections = [];
  svg.innerHTML = "";
  document.getElementById("message").innerText = "";
  document.getElementById("bulb").classList.remove("glow");
  document.getElementById("bulb").style.animation = "";
  rotateNeedle("voltNeedle", 0, 20);
  rotateNeedle("ampNeedle", 0, 10);
  saveProgress(0);
}

// ------------------- Progress Handling -------------------
async function saveProgress(progress) {
  // Save locally
  localStorage.setItem(`progress_${username}_${subject}_${gameName}`, progress);

  // Upload to backend
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
    if (res.ok) console.log(`✅ ${gameName} progress uploaded: ${progress}%`);
    else console.warn("❌ Upload failed:", data.message);
  } catch (err) {
    console.error("❌ Failed to sync with DB", err);
    alert("⚠️ Progress saved locally. Will sync when internet is available.");
  }
}

// ------------------- Finish Button -------------------
document.getElementById("finishBtn")?.addEventListener("click", () => {
  const savedProgress = parseInt(localStorage.getItem(`progress_${username}_${subject}_${gameName}`)) || 0;
  if (!confirm(`Finish ${gameName} with ${savedProgress}% progress?`)) return;
  saveProgress(savedProgress);
  alert(`Progress of ${savedProgress}% uploaded!`);
});

// ------------------- Go Back -------------------
function goBack() {
  window.location.href = "phy.html";
}
