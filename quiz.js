/***********************
 * CONFIG
 ***********************/
const QUESTIONS_URL =
  "https://cdn.jsdelivr.net/gh/yousafkhamza/devops-mcq-assets@main/questions.json";

const QUESTION_TIME = 120;
const NEGATIVE_MARK = 0.25;
const MAX_ATTEMPTS = 3;

/***********************
 * STATE
 ***********************/
let selectedQuestionCount = 0;
let questions = [];
let currentIndex = 0;
let score = 0;
let timer = null;
let timeLeft = QUESTION_TIME;
let userAnswers = [];
let answered = false;

/***********************
 * FLOW
 ***********************/
function showRules(count) {
  selectedQuestionCount = count;
  hideAll();
  document.getElementById("rules").style.display = "block";
}

/***********************
 * RATE LIMIT
 ***********************/
function checkRateLimit() {
  const today = new Date().toDateString();
  let data = JSON.parse(localStorage.getItem("attempts")) || { date: today, count: 0 };

  if (data.date !== today) data = { date: today, count: 0 };
  if (data.count >= MAX_ATTEMPTS) {
    alert("Daily attempt limit reached. Try again tomorrow.");
    return false;
  }

  data.count++;
  localStorage.setItem("attempts", JSON.stringify(data));
  return true;
}

/***********************
 * START
 ***********************/
function startQuiz() {
  if (!checkRateLimit()) return;

  antiCheat();
  hideAll();
  document.getElementById("quiz").style.display = "block";

  fetch(QUESTIONS_URL)
    .then(res => res.json())
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

/***********************
 * QUESTION
 ***********************/
function loadQuestion() {
  resetTimer();
  answered = false;

  const q = questions[currentIndex];
  document.getElementById("question").innerText = q.question;
  document.getElementById("counter").innerText =
    `${currentIndex + 1} / ${questions.length}`;

  const optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML = "";

  q.options.forEach((opt, index) => {
    const btn = document.createElement("button");
    btn.innerText = opt;
    btn.onclick = () => answerQuestion(index, btn);
    optionsDiv.appendChild(btn);
  });
}

function answerQuestion(index, btn) {
  if (answered) return;
  answered = true;

  document.querySelectorAll("#options button").forEach(b => {
    b.classList.add("disabled");
  });

  btn.classList.add("selected");
  userAnswers.push(index);

  score += index === questions[currentIndex].answer ? 1 : -NEGATIVE_MARK;

  setTimeout(nextQuestion, 300);
}

function skipQuestion() {
  userAnswers.push(null);
  nextQuestion();
}

function nextQuestion() {
  currentIndex++;
  currentIndex < questions.length ? loadQuestion() : finishQuiz();
}

function exitQuiz() {
  finishQuiz();
}

/***********************
 * TIMER
 ***********************/
function startTimer() {
  timer = setInterval(() => {
    timeLeft--;

    const timerEl = document.getElementById("timer");
    timerEl.innerText = formatTime(timeLeft);
    timerEl.classList.remove("warning", "danger");

    if (timeLeft <= 10) timerEl.classList.add("danger");
    else if (timeLeft <= 30) timerEl.classList.add("warning");

    if (timeLeft === 0) {
      userAnswers.push(null);
      nextQuestion();
    }
  }, 1000);
}

function resetTimer() {
  clearInterval(timer);
  timeLeft = QUESTION_TIME;
  const timerEl = document.getElementById("timer");
  timerEl.classList.remove("warning", "danger");
  timerEl.innerText = formatTime(timeLeft);
  startTimer();
}

/***********************
 * FINISH
 ***********************/
function finishQuiz() {
  clearInterval(timer);
  hideAll();

  const percent = Math.max(0, (score / questions.length) * 100).toFixed(2);
  let html = `<h2>Final Result</h2><h1>${percent}%</h1><hr>`;

  questions.forEach((q, i) => {
    html += `<p><b>Q${i + 1}. ${q.question}</b></p><ul>`;
    q.options.forEach((opt, idx) => {
      let cls = idx === q.answer ? "correct"
        : userAnswers[i] === idx ? "wrong"
        : userAnswers[i] === null ? "skipped" : "";
      html += `<li class="${cls}">${opt}</li>`;
    });
    html += "</ul><hr>";
  });

  document.getElementById("result").innerHTML = html;
  document.getElementById("result").style.display = "block";
}

/***********************
 * ANTI-CHEAT
 ***********************/
function antiCheat() {
  document.addEventListener("contextmenu", e => e.preventDefault());
  document.addEventListener("visibilitychange", () => document.hidden && finishQuiz());
  document.addEventListener("keydown", e => {
    if (e.key === "F12" || (e.ctrlKey && e.shiftKey)) finishQuiz();
  });
}

/***********************
 * HELPERS
 ***********************/
function hideAll() {
  ["setup", "rules", "quiz", "result"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
}

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function shuffleOptions(q) {
  const correct = q.options[q.answer];
  const shuffled = shuffle([...q.options]);
  q.options = shuffled;
  q.answer = shuffled.indexOf(correct);
  return q;
}

function formatTime(sec) {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}
