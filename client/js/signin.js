const API_BASE = "http://localhost:5001"; // backend URL

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const errorMsg = document.getElementById("error-msg");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // prevent default form submission

    errorMsg.textContent = "";
    errorMsg.style.color = "red";

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
      errorMsg.textContent = "Enter both username and password";
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // ✅ Successful login → save info in localStorage
        localStorage.setItem("loggedInUser", data.username);
        localStorage.setItem("className", data.className || "");
        localStorage.setItem("schoolName", data.schoolName || "");
        localStorage.setItem("role", data.role || "student");

        // Optional: also keep in sessionStorage if needed
        sessionStorage.setItem("loggedInUser", data.username);

        // Redirect to index/dashboard
        window.location.href = "index.html"; 
      } else {
        errorMsg.textContent = data.message || "Invalid username or password";
      }
    } catch (err) {
      console.error(err);
      errorMsg.textContent = "Server error. Is backend running?";
    }
  });
});
