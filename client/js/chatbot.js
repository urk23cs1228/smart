const messagesDiv = document.getElementById("chatbot-messages");
const inputField = document.getElementById("chatbot-text");
const closeBtn = document.getElementById("closeChatBtn");

// Close chatbot
closeBtn.addEventListener("click", () => {
  document.getElementById("chatbot-container").style.display = "none";
});

async function sendMessage() {
  const message = inputField.value.trim();
  if (!message) return;

  // Show user message
  const userBubble = document.createElement("div");
  userBubble.classList.add("message", "user");
  userBubble.innerText = message;
  messagesDiv.appendChild(userBubble);

  inputField.value = "";

  try {
    const response = await fetch("http://localhost:5001/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });
    const data = await response.json();

    const botBubble = document.createElement("div");
    botBubble.classList.add("message", "bot");
    botBubble.innerText = data.reply;
    messagesDiv.appendChild(botBubble);
  } catch (err) {
    const errorBubble = document.createElement("div");
    errorBubble.classList.add("message", "bot");
    errorBubble.style.backgroundColor = "red";
    errorBubble.innerText = "Error connecting to server";
    messagesDiv.appendChild(errorBubble);
  }

  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
