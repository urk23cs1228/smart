function goToGames(classNumber) {
    localStorage.setItem("selectedClass", classNumber);
    window.location.href = "progress.html";
}
