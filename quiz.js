const QUESTIONS_URL =
  "https://raw.githubusercontent.com/yousafkhamza/devops-mcq-assets/main/questions.json";

const NEGATIVE = 0.25;
const TIMER = 120;
const MAX_ATTEMPTS = 3;

let quiz = [], current = 0, score = 0, timer, timeLeft = TIMER;
let answers = [];
let qCount = 0;

/* RULE FLOW */
function showRules(count) {
  qCount = count;
  hideAll();
  document.getElementById("rules").style.display = "block";
}

/* RATE LIMIT */
function checkRateLimit() {
  const today = new Date().toDateString();
  let a = JSON.parse(localStorage.getItem("attempts")) || { date: today, count: 0 };

  if (a.date !== today) a = { date: today, count: 0 };
  if (a.count >= MAX_ATTEMPTS) {
    alert("Daily attempt limit reached. Try tomorrow.");
    return false;
  }
  a.count++;
  localStorage.setItem("attempts", JSON.stringify(a));
  return true;
}

/* START */
function startQuiz() {
  if (!checkRateLimit()) return;
  antiCheat();

  hideAll();
  document.getElementById("quiz").style.display = "block";

  fetch(QUESTIONS_URL)
    .then(r => r.json())
    .then(data => {
      quiz = shuffle(data).slice(0, qCount);
      loadQuestion();
      startTimer();
    });
}

/* QUESTIONS */
function loadQuestion() {
  resetTimer();
  const q = quiz[current];
  document.getElementById("question").innerText = q.question;
  const opt = document.getElementById("options");
  opt.innerHTML = "";

  q.options.forEach((o, i) => {
    const b = document.createElement("button");
    b.innerText = o;
    b.onclick = () => answer(i);
    opt.appendChild(b);
  });
}

function answer(i) {
  answers.push(i);
  score += (i === quiz[current].answer) ? 1 : -NEGATIVE;
  next();
}

function skip() {
  answers.push(null);
  next();
}

function next() {
  current++;
  current < quiz.length ? loadQuestion() : finish();
}

function exitQuiz() { finish(); }

/* TIMER */
function startTimer() {
  timer = setInterval(() => {
    timeLeft--;
    document.getElementById("timer").innerText = format(timeLeft);
    if (timeLeft === 0) skip();
  }, 1000);
}

function resetTimer() {
  clearInterval(timer);
  timeLeft = TIMER;
  startTimer();
}

/* FINISH + REVIEW */
function finish() {
  clearInterval(timer);
  hideAll();
  const percent = Math.max(0, (score / quiz.length) * 100).toFixed(2);

  let html = `<h2>Final Score</h2><h1>${percent}%</h1><hr>`;
  quiz.forEach((q, i) => {
    html += `<p><b>Q${i+1}. ${q.question}</b></p><ul>`;
    q.options.forEach((o, idx) => {
      let cls = idx === q.answer ? "correct" :
                answers[i] === idx ? "wrong" :
                answers[i] === null ? "skipped" : "";
      html += `<li class="${cls}">${o}</li>`;
    });
    html += "</ul><hr>";
  });
  document.getElementById("result").innerHTML = html;
  document.getElementById("result").style.display = "block";
}

/* ANTI-CHEAT */
function antiCheat() {
  document.addEventListener("contextmenu", e => e.preventDefault());
  document.addEventListener("visibilitychange", () => document.hidden && finish());
  document.addEventListener("keydown", e => {
    if (e.key === "F12" || (e.ctrlKey && e.shiftKey)) finish();
  });
}

/* HELPERS */
function hideAll() {
  ["setup","rules","quiz","result"].forEach(id =>
    document.getElementById(id).style.display = "none");
}
function shuffle(a){return a.sort(()=>Math.random()-0.5);}
function format(s){return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;}
