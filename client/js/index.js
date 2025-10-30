// === Navigation functions ===
function classes() {
  window.location.href = "classes.html";
}

function progress() {
  window.location.href = "progress/psign.html";
}

// === Google Translate ===
function googleTranslateElementInit() {
  new google.translate.TranslateElement(
    {
      pageLanguage: "en",
      includedLanguages: "en,or", // English & Odia
      layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
    },
    "google_translate_element"
  );
}

// === DOMContentLoaded Events ===
document.addEventListener("DOMContentLoaded", () => {
  // Toggle Google Translate
  const btn = document.getElementById("translate-btn");
  const el = document.getElementById("google_translate_element");

  btn.addEventListener("click", () => {
    el.style.display =
      el.style.display === "none" || el.style.display === ""
        ? "block"
        : "none";
  });

  // Notifications
  const notifyBtn = document.getElementById("notifyBtn");
  const dropdown = document.getElementById("notifyDropdown");
  const badge = document.querySelector(".notify-btn .badge");

  // === Username Display ===
  const userDisplay = document.getElementById("usernameDisplay");
  const currentUser = localStorage.getItem("loggedInUser"); // FIXED

  if (currentUser) {
    userDisplay.textContent = currentUser;
  } else {
    userDisplay.textContent = "Guest";
    // (optional) redirect to login if not logged in:
    // window.location.href = "signin.html";
  }

  // === Render Notifications ===
  function renderNotifications() {
    dropdown.innerHTML = ""; // clear dropdown
    const raw = localStorage.getItem("notifications");
    const arr = raw ? JSON.parse(raw) : [];

    let filtered;

    if (localStorage.getItem("role") === "teacher") {
      // teacher sees everything
      filtered = arr;
    } else {
      // students see only global (null) + their own
      filtered = arr.filter(
        (n) => n.user === null || n.user === currentUser
      );
    }

    // update badge
    badge.textContent = filtered.length;

    if (!filtered.length) {
      const p = document.createElement("p");
      p.textContent = "No notifications";
      dropdown.appendChild(p);
      return;
    }

    filtered.slice(0, 20).forEach((n) => {
      const p = document.createElement("p");
      const d = new Date(n.timestamp || Date.now());
      p.innerHTML = `<small>${d.toLocaleString()}</small><br/>${n.message}`;
      dropdown.appendChild(p);
    });
  }

  // toggle dropdown
  notifyBtn.addEventListener("click", () => {
    dropdown.style.display =
      dropdown.style.display === "block" ? "none" : "block";
    if (dropdown.style.display === "block") {
      badge.textContent = 0; // reset badge when opened
    }
  });

  // initial render
  renderNotifications();

  // refresh on custom event
  window.addEventListener("notification-updated", () => {
    renderNotifications();
  });

  // also refresh when localStorage changes
  window.addEventListener("storage", (e) => {
    if (e.key === "notifications") renderNotifications();
  });
});
