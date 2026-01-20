const QUESTIONS_URL =
  "https://cdn.jsdelivr.net/gh/yousafkhamza/devops-mcq-assets@main/public/questions.json?v=0.0.1";

const QUESTION_TIME = 120;
const NEGATIVE_MARK = 0.25;
const MAX_ATTEMPTS = 5;

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

/* ---------------- SETUP ---------------- */

function showRules(count) {
  selectedQuestionCount = count;
  hideAll();
  document.getElementById("rules").style.display = "block";
}

/* ---------------- RATE LIMIT ---------------- */

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

/* ---------------- START QUIZ ---------------- */

function startQuiz() {
  if (!checkRateLimit()) return;

  enableExamMode();
  antiCheat();

  hideAll();
  document.getElementById("quiz").style.display = "block";

  fetch(QUESTIONS_URL)
    .then(r => r.json())
    .then(data => {
      const totalAvailable = data.length;

      // Cap selection to available questions
      const finalCount = Math.min(selectedQuestionCount, totalAvailable);

      // Rotate + shuffle full pool so all questions circulate over time
      const pool = shuffle(rotatePool(data));

      // Take only requested count
      questions = pool
        .slice(0, finalCount)
        .map(q => shuffleOptions(q));

      currentIndex = 0;
      score = 0;
      userAnswers = [];

      loadQuestion();
      startTimer();
    });
}

/* ---------------- QUESTION LOADING ---------------- */

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

/* ---------------- NAVIGATION ---------------- */

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

/* ---------------- EXIT ---------------- */

function exitQuiz() {
  clearInterval(timer);
  disableExamMode();
  hideAll();
  document.getElementById("thankyou").style.display = "block";
}

/* ---------------- TIMER ---------------- */

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

/* ---------------- RESULT ---------------- */

function finishQuiz() {
  clearInterval(timer);
  disableExamMode();
  hideAll();

  const percent = Math.max(0, (score / questions.length) * 100).toFixed(2);
  let html = `<h2>Final Result</h2><h1>${percent}%</h1><hr>`;

  questions.forEach((q, i) => {
    html += `<p><b>Q${i + 1}. ${q.question}</b></p><ul>`;
    q.options.forEach((o, j) => {
      let c =
        j === q.answer ? "correct" :
        userAnswers[i] === j ? "wrong" :
        userAnswers[i] === null ? "skipped" : "";
      html += `<li class="${c}">${o}</li>`;
    });
    html += "</ul><hr>";
  });

  document.getElementById("result").innerHTML = html;
  document.getElementById("result").style.display = "block";
}

/* ---------------- AUDIO ---------------- */

function playWarning() {
  const a = document.getElementById("warningSound");
  if (a) { a.currentTime = 0; a.play().catch(() => {}); }
}

/* ---------------- EXAM MODE ---------------- */

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

/* ---------------- ANTI-CHEAT ---------------- */

function antiCheat() {
  document.addEventListener("contextmenu", e => e.preventDefault());
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) exitQuiz();
  });
}

/* ---------------- HELPERS ---------------- */

function hideAll() {
  ["setup", "rules", "quiz", "result", "thankyou"].forEach(id => {
    const e = document.getElementById(id);
    if (e) e.style.display = "none";
  });
}

/* TRUE SHUFFLE (Fisher–Yates) */
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ROTATE POOL ACROSS ATTEMPTS */
function rotatePool(data) {
  const key = "questionOffset";
  let offset = parseInt(localStorage.getItem(key) || "0", 10);

  const rotated = data.slice(offset).concat(data.slice(0, offset));

  offset = (offset + 10) % data.length;
  localStorage.setItem(key, offset);

  return rotated;
}

/* SHUFFLE OPTIONS SAFELY */
function shuffleOptions(q) {
  const correct = q.options[q.answer];
  q.options = shuffle(q.options);
  q.answer = q.options.indexOf(correct);
  return q;
}

function formatTime(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function enableNext(v) {
  document.querySelector(".quiz-actions button").disabled = !v;
}
