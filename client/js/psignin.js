document.getElementById("loginForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorMsg = document.getElementById("error-msg");

  // For demo: hardcoded login (replace with server check later)
  const validUsername = "teacher";
  const validPassword = "1234";

  if (username === validUsername && password === validPassword) {
    // Save session info (so user stays logged in)
    localStorage.setItem("isTeacherLoggedIn", "true");

    // Redirect to classes page
    window.location.href = "pclasses.html";
  } else {
    errorMsg.textContent = "Invalid username or password!";
  }
});
