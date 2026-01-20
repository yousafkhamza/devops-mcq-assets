const QUESTIONS_URL =
  "https://cdn.jsdelivr.net/gh/yousafkhamza/devops-mcq-assets@main/questions.json?v=2026-01-07";

const QUESTION_TIME = 120;
const NEGATIVE_MARK = 0.25;
const MAX_ATTEMPTS = 3;

let selectedQuestionCount = 0;
let questions = [];
let currentIndex = 0;
let score = 0;
let timer = null;
let timeLeft = QUESTION_TIME;

let userAnswers = [];
let selectedAnswer = null;
let isTimedOut = false;
let warningPlayed = false;

/* Setup */
function showRules(count) {
  selectedQuestionCount = count;
  hideAll();
  document.getElementById("rules").style.display = "block";
}

/* Rate limit */
function checkRateLimit() {
  const today = new Date().toDateString();
  let data = JSON.parse(localStorage.getItem("attempts")) || { date: today, count: 0 };

  if (data.date !== today) data = { date: today, count: 0 };
  if (data.count >= MAX_ATTEMPTS) {
    alert("Daily attempt limit reached.");
    return false;
  }

  data.count++;
  localStorage.setItem("attempts", JSON.stringify(data));
  return true;
}

/* Start */
function startQuiz() {
  if (!checkRateLimit()) return;

  enableExamMode();
  antiCheat();

  hideAll();
  document.getElementById("quiz").style.display = "block";

  fetch(QUESTIONS_URL)
    .then(r => r.json())
    .then(data => {
      questions = shuffle(data)
        .slice(0, selectedQuestionCount)
        .map(q => shuffleOptions(q));

      currentIndex = 0;
      score = 0;
      userAnswers = [];

      loadQuestion();
      startTimer();
    });
}

/* Load */
function loadQuestion() {
  resetTimer();
  selectedAnswer = null;
  isTimedOut = false;
  warningPlayed = false;

  document.getElementById("timeoutMessage").style.display = "none";

  const q = questions[currentIndex];
  document.getElementById("question").innerText = q.question;
  document.getElementById("counter").innerText =
    `${currentIndex + 1} / ${questions.length}`;

  const options = document.getElementById("options");
  options.innerHTML = "";

  q.options.forEach((opt, i) => {
    const b = document.createElement("button");
    b.innerText = opt;
    b.onclick = () => selectOption(i, b);
    options.appendChild(b);
  });

  enableNext(true);
}

function selectOption(i, btn) {
  if (isTimedOut) return;
  selectedAnswer = i;
  document.querySelectorAll("#options button").forEach(b => b.classList.remove("selected"));
  btn.classList.add("selected");
}

/* Navigation */
function nextQuestion() {
  if (isTimedOut) return;
  recordAnswer();
  moveForward();
}

function skipQuestion() {
  userAnswers.push(null);
  moveForward();
}

function recordAnswer() {
  if (selectedAnswer === null) {
    userAnswers.push(null);
    return;
  }
  userAnswers.push(selectedAnswer);
  score += selectedAnswer === questions[currentIndex].answer ? 1 : -NEGATIVE_MARK;
}

function moveForward() {
  currentIndex++;
  currentIndex < questions.length ? loadQuestion() : finishQuiz();
}

/* Exit */
function exitQuiz() {
  clearInterval(timer);
  disableExamMode();
  hideAll();
  document.getElementById("thankyou").style.display = "block";
}

/* Timer */
function startTimer() {
  timer = setInterval(() => {
    if (timeLeft <= 0) {
      clearInterval(timer);
      timeLeft = 0;
      document.getElementById("timer").innerText = "0:00";
      handleTimeout();
      return;
    }

    timeLeft--;
    const t = document.getElementById("timer");
    t.innerText = formatTime(timeLeft);
    t.classList.remove("warning", "danger");

    if (timeLeft === 10 && !warningPlayed) {
      playWarning();
      warningPlayed = true;
    }

    if (timeLeft <= 10) t.classList.add("danger");
    else if (timeLeft <= 30) t.classList.add("warning");
  }, 1000);
}

function handleTimeout() {
  isTimedOut = true;
  document.getElementById("timeoutMessage").style.display = "block";
  document.querySelectorAll("#options button").forEach(b => b.classList.add("disabled"));
  enableNext(false);
}

function resetTimer() {
  clearInterval(timer);
  timeLeft = QUESTION_TIME;
  document.getElementById("timer").innerText = formatTime(timeLeft);
  startTimer();
}

/* Result */
function finishQuiz() {
  clearInterval(timer);
  disableExamMode();
  hideAll();

  const percent = Math.max(0, (score / questions.length) * 100).toFixed(2);
  let html = `<h2>Final Result</h2><h1>${percent}%</h1><hr>`;

  questions.forEach((q, i) => {
    html += `<p><b>Q${i + 1}. ${q.question}</b></p><ul>`;
    q.options.forEach((o, j) => {
      let c = j === q.answer ? "correct" :
              userAnswers[i] === j ? "wrong" :
              userAnswers[i] === null ? "skipped" : "";
      html += `<li class="${c}">${o}</li>`;
    });
    html += "</ul><hr>";
  });

  document.getElementById("result").innerHTML = html;
  document.getElementById("result").style.display = "block";
}

/* Audio */
function playWarning() {
  const a = document.getElementById("warningSound");
  if (a) { a.currentTime = 0; a.play().catch(() => {}); }
}

/* Zoom lock */
function enableExamMode() {
  document.addEventListener("keydown", preventZoomKeys, { passive: false });
  document.addEventListener("wheel", preventZoomWheel, { passive: false });
}
function disableExamMode() {
  document.removeEventListener("keydown", preventZoomKeys);
  document.removeEventListener("wheel", preventZoomWheel);
}
function preventZoomKeys(e) {
  if ((e.ctrlKey || e.metaKey) && ["+", "-", "0", "="].includes(e.key)) e.preventDefault();
}
function preventZoomWheel(e) {
  if (e.ctrlKey) e.preventDefault();
}

/* Anti-cheat */
function antiCheat() {
  document.addEventListener("contextmenu", e => e.preventDefault());
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) exitQuiz();
  });
}

/* Helpers */
function hideAll() {
  ["setup","rules","quiz","result","thankyou"].forEach(id => {
    const e = document.getElementById(id);
    if (e) e.style.display = "none";
  });
}

function shuffle(a) { return a.sort(() => Math.random() - 0.5); }

function shuffleOptions(q) {
  const c = q.options[q.answer];
  q.options = shuffle([...q.options]);
  q.answer = q.options.indexOf(c);
  return q;
}

function formatTime(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function enableNext(v) {
  document.querySelector(".quiz-actions button").disabled = !v;
}
