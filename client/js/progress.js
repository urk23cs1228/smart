// progress.js

/* ---------------- Global Variables ---------------- */
let allStudentUsernames = [];

// subjects → topics mapping
const SUBJECT_TOPICS = {
  Biology: ["Mitochondria", "Blood Arena"],
  Physics: ["Eddy Current", "Circuit Connection", "Ohm's Law"],
  Math: ["Integrals", "Pythagoras Theorem"],
  Chemistry: ["Balance the Chemical Reaction", "Periodic Table"],
  CS: ["Sorting", "Searching", "Shuffle"]
};

/* ---------------- Load Class Progress ---------------- */
async function loadClassProgress() {
  const studentList = document.getElementById("studentList");
  studentList.innerHTML = "<li>Loading...</li>";

  try {
    const res = await fetch("http://localhost:5001/progress");
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const records = await res.json();

    studentList.innerHTML = "";
    if (!records?.length) {
      studentList.innerHTML = "<li>No progress records found.</li>";
      return;
    }

    // filter invalid usernames
    const validRecords = records.filter(r => r.username);
    const grouped = {};
    validRecords.forEach(r => {
      if (!grouped[r.username]) grouped[r.username] = [];
      grouped[r.username].push(r);
    });

    // collect usernames
    allStudentUsernames = Object.keys(grouped);

    // render sidebar list
    allStudentUsernames.forEach((username, index) => {
      const overall = calculateOverall(grouped[username]);
      const li = document.createElement("li");
      li.innerHTML = `${index + 1}. ${username} ${getStatusBadge(overall)}`;
      li.onclick = () => showDetails(username, grouped[username], overall);
      studentList.appendChild(li);
    });

    // also update modal student list
    populateStudentMultiSelect();

  } catch (err) {
    console.error("Error loading class progress:", err);
    studentList.innerHTML = "<li>Cannot fetch progress. Check server or CORS.</li>";
  }
}

/* ---------------- Helpers ---------------- */
function populateStudentMultiSelect() {
  const sel = document.getElementById("studentMultiSelect");
  if (!sel) return;
  sel.innerHTML = "";

  if (!allStudentUsernames.length) {
    sel.innerHTML = "<option value=''>No students found</option>";
    return;
  }

  allStudentUsernames.forEach(u => {
    const op = document.createElement("option");
    op.value = u;
    op.textContent = u;
    sel.appendChild(op);
  });
}

function calculateOverall(progressArr) {
  if (!progressArr.length) return "poor";
  const avg = progressArr.reduce((sum, p) => sum + (p.progressPercent || 0), 0) / progressArr.length;
  if (avg >= 70) return "excellent";
  if (avg >= 40) return "good";
  return "poor";
}

function getStatusBadge(status) {
  if (status === "excellent") return `<span class="progress-badge excellent">Excellent</span>`;
  if (status === "good") return `<span class="progress-badge good">Good</span>`;
  return `<span class="progress-badge poor">Poor</span>`;
}

function showDetails(username, progressArr, overall) {
  const detailsContent = document.querySelector(".details-content");
  let html = `<h2>${username}'s Progress</h2>`;

  if (!progressArr.length) {
    html += "<p>No progress records for this student.</p>";
  } else {
    progressArr.forEach(p => {
      html += `
        <div class="progress-card">
          <p><b>Subject:</b> ${p.subject || "N/A"}</p>
          <p><b>Game:</b> ${p.gameName || "N/A"}</p>
          <p><b>Progress:</b> ${p.progressPercent != null ? p.progressPercent + "%" : "0%"}</p>
          <p><b>Last Updated:</b> ${p.updatedAt || "Not updated yet"}</p>
          <p><b>Overall Status:</b> ${getStatusBadge(overall)}</p>
        </div>
        <hr/>
      `;
    });
  }
  detailsContent.innerHTML = html;
}

/* ---------------- Notifications Helper ---------------- */
function pushNotification(message, student = null) {
  try {
    const raw = localStorage.getItem("notifications");
    const arr = raw ? JSON.parse(raw) : [];
    arr.unshift({
      message,
      user: student, // null = global/teacher-level, else student username
      timestamp: new Date().toISOString()
    });
    localStorage.setItem("notifications", JSON.stringify(arr.slice(0, 100)));
    window.dispatchEvent(new Event("notification-updated"));
  } catch (err) {
    console.error("Failed to push notifications to localStorage", err);
  }
}

/* ---------------- Modal Handling ---------------- */
const assignBtn = document.getElementById("assignBtn");
const assignModal = document.getElementById("assignModal");
const closeModal = document.getElementById("closeModal");
const confirmAssign = document.getElementById("confirmAssign");

assignBtn.onclick = () => {
  assignModal.classList.add("show");
  populateStudentMultiSelect();
};

closeModal.onclick = () => {
  assignModal.classList.remove("show");
  clearAssignModal();
};

document.getElementById("assignType").onchange = e => {
  document.getElementById("studentSelectDiv").style.display =
    e.target.value === "specific" ? "block" : "none";
};

document.getElementById("subjectSelect").onchange = e => {
  const subject = e.target.value;
  const container = document.getElementById("topicsList");
  container.innerHTML = "";

  if (!subject) {
    container.innerHTML = "<small>Select subject to see topics</small>";
    return;
  }

  const topics = SUBJECT_TOPICS[subject] || [];
  if (!topics.length) {
    container.innerHTML = "<small>No topics configured for this subject.</small>";
    return;
  }

  topics.forEach((t, idx) => {
    const id = `topic_${subject}_${idx}`;
    const wrapper = document.createElement("div");
    wrapper.style.margin = "6px 0";

    wrapper.innerHTML = `
      <input type="checkbox" id="${id}" value="${t}" name="topicCheckbox">
      <label for="${id}" style="margin-left:8px;">${t}</label>
    `;
    container.appendChild(wrapper);
  });
};

function getSelectedTopics() {
  return Array.from(document.querySelectorAll('input[name="topicCheckbox"]:checked'))
    .map(c => c.value);
}

/* ---------------- Confirm Assignment ---------------- */
confirmAssign.onclick = () => {
  const subject = document.getElementById("subjectSelect").value;
  const selectedTopics = getSelectedTopics();
  const type = document.getElementById("assignType").value;

  if (!subject) return alert("Please select a subject.");
  if (!selectedTopics.length) return alert("Please select at least one topic/game.");

  const topicListStr = selectedTopics.join(", ");

  if (type === "all") {
    pushNotification(`${subject}, ${topicListStr} is assigned for all students`, null);
    allStudentUsernames.forEach(student => {
      pushNotification(`Hi ${student}, ${subject}, ${topicListStr} is assigned for you`, student);
    });
    alert("✅ Assigned to all students.");
  } else {
    const sel = document.getElementById("studentMultiSelect");
    const chosen = Array.from(sel.selectedOptions).map(o => o.value).filter(Boolean);
    if (!chosen.length) return alert("Please pick one or more students.");

    pushNotification(`${subject}, ${topicListStr} is assigned for ${chosen.length} student(s)`, null);

    chosen.forEach(student => {
      pushNotification(`Hi ${student}, ${subject}, ${topicListStr} is assigned for you`, student);
    });
    alert(`✅ Assigned to ${chosen.length} student(s).`);
  }

  assignModal.classList.remove("show");
  clearAssignModal();
};

function clearAssignModal() {
  document.getElementById("subjectSelect").value = "";
  document.getElementById("topicsList").innerHTML = "<small>Select subject to see topics</small>";
  document.getElementById("assignType").value = "all";
  document.getElementById("studentSelectDiv").style.display = "none";
  const sel = document.getElementById("studentMultiSelect");
  if (sel) sel.selectedIndex = -1;
}

/* ---------------- Init ---------------- */
window.addEventListener("DOMContentLoaded", loadClassProgress);
