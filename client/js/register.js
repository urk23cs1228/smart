// client/js/register.js
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("regUsername").value.trim();
  const password = document.getElementById("regPassword").value.trim();
  const confirmPassword = document.getElementById("regConfirmPassword").value.trim();
  const className = document.getElementById("regClass").value;
  const schoolName = document.getElementById("regSchool").value.trim();
  const role = document.getElementById("regRole").value; // "student"

  const msg = document.getElementById("reg-msg");
  msg.textContent = "";

  // Basic validation
  if (!username || !password || !className || !schoolName) {
    msg.textContent = "⚠️ Please fill all fields.";
    msg.style.color = "red";
    return;
  }

  if (password !== confirmPassword) {
    msg.textContent = "⚠️ Passwords do not match.";
    msg.style.color = "red";
    return;
  }

  try {
    const res = await fetch("http://localhost:5001/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, className, schoolName, role })
    });

    const data = await res.json();

    if (res.ok) {
      msg.textContent = "✅ Registration successful!";
      msg.style.color = "green";
      document.getElementById("registerForm").reset();
    } else {
      msg.textContent = data.message || "Registration failed";
      msg.style.color = "red";
    }
  } catch (err) {
    msg.textContent = "🚨 Server error. Is the backend running?";
    msg.style.color = "red";
  }
});
