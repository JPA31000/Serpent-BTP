// script.js
document.addEventListener('DOMContentLoaded', () => {
  // Références DOM
  const playBtn           = document.getElementById('play-btn');
  const restartBtn        = document.getElementById('restart-btn');
  const canvas            = document.getElementById('game-board');
  const ctx               = canvas.getContext('2d');
  const scoreDisplay      = document.getElementById('correct-answers-display');
  const timerDisplay      = document.getElementById('timer');
  const questionDisplay   = document.getElementById('question');
  const finalScoreDisplay = document.getElementById('final-score');
  const gameOverDiv       = document.getElementById('game-over');
  const upBtn             = document.getElementById('up-btn');
  const downBtn           = document.getElementById('down-btn');
  const leftBtn           = document.getElementById('left-btn');
  const rightBtn          = document.getElementById('right-btn');

  // Constantes
  const GRID_SIZE       = 20;
  const GRID_WIDTH      = canvas.width  / GRID_SIZE;
  const GRID_HEIGHT     = canvas.height / GRID_SIZE;
  const TOTAL_QUESTIONS = 30;
  const GAME_DURATION   = 180;   // 3 minutes
  const GAME_SPEED      = 200;   // ms entre chaque frame

  // État du jeu
  let snake            = [];
  let direction        = 'right';
  let nextDirection    = 'right';
  let food             = {};
  let answerFood       = { yes: {}, no: {} };
  let gameInterval     = null;
  let timerInterval    = null;
  let gameStarted      = false;
  let pausedForStart   = false;
  let questionActive   = false;
  let growSegments     = 0;
  let correctAnswers   = 0;
  let totalQuestions   = 0;
  let timeLeft         = GAME_DURATION;
  let questions        = [];
  let currentQuestion;
  let correctAnswer;
  const opposite = { up:'down', down:'up', left:'right', right:'left' };

  // 30 questions alternant "oui"/verte et "non"/rouge
  questions = [
    { question: "Le béton armé renforce-t‑il les structures ?",      answer: "oui" },
    { question: "Le plâtre est‑il un isolant thermique ?",           answer: "non" },
    { question: "Le parpaing est‑il fabriqué en béton ?",           answer: "oui" },
    { question: "Le goudron sert‑il aux fondations ?",              answer: "non" },
    { question: "La chape de mortier nivelle-t‑elle un sol ?",       answer: "oui" },
    { question: "Le verre feuilleté est une seule plaque ?",         answer: "non" },
    { question: "Le ciment Portland est‑il répandu en France ?",     answer: "oui" },
    { question: "Le papier peint est‑il un revêtement extérieur ?",  answer: "non" },
    { question: "Un échafaudage permet‑il de travailler en hauteur ?",answer: "oui" },
    { question: "Le treillis soudé sert‑il aux enduits décoratifs ?",answer: "non" },
    { question: "Le bois lamellé‑collé supporte‑t‑il de fortes portées ?", answer: "oui" },
    { question: "La tuile mécanique est‑elle en métal ?",            answer: "non" },
    { question: "La pierre ponce est‑elle un isolant minéral ?",     answer: "oui" },
    { question: "Le PVC résiste‑t‑il aux solvants forts ?",         answer: "non" },
    { question: "Le zinc est‑il utilisé pour les toitures ?",       answer: "oui" },
    { question: "Le sable fin assure‑t‑il un bon drainage ?",        answer: "non" },
    { question: "La résine époxy renforce-t‑elle les sols ?",        answer: "oui" },
    { question: "Le bois non traité résiste‑t‑il à l’humidité ?",     answer: "non" },
    { question: "Le béton fibré contient‑il des fibres synthétiques ?", answer: "oui" },
    { question: "La brique creuse isole‑t‑elle mieux que la pleine ?", answer: "oui" },
    { question: "Une dalle sur terre‑plein est coulée directement ?", answer: "oui" },
    { question: "Le verre trempé est plus souple que le verre ordinaire ?", answer: "non" },
    { question: "Le composite bois‑plastique s’utilise en bardage ?", answer: "oui" },
    { question: "Le papier goudronné étanche‑t‑il un toit plat ?",    answer: "non" },
    { question: "Le polystyrène expansé est un isolant thermique ?",  answer: "oui" },
    { question: "Le PVC rigide sert‑il aux câbles électriques ?",     answer: "non" },
    { question: "La terre cuite est un isolant naturel ?",            answer: "oui" },
    { question: "Le béton cellulaire est plus lourd que le classique ?", answer: "non" },
    { question: "Le profilé IPE a une section en I ?",                answer: "oui" }
  ];

  // Mélange Fisher–Yates
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  // Initialise le jeu
  function initGame() {
    snake = [{ x:10,y:10},{ x:9,y:10},{ x:8,y:10 }];
    direction = nextDirection = 'right';
    correctAnswers = totalQuestions = 0;
    timeLeft = GAME_DURATION;
    questionActive = false;
    growSegments = 0;
    gameStarted = true;
    pausedForStart = true;

    shuffle(questions);
    placeFood();

    updateScore();
    updateTimer();
    questionDisplay.textContent = "Appuyez sur une flèche pour démarrer.";

    clearInterval(timerInterval);
    timerInterval = setInterval(tick, 1000);
    draw();
  }

  function placeFood() {
    food = randomCell();
  }

  function placeAnswerFoods() {
    answerFood.yes = randomCell();
    do {
      answerFood.no = randomCell();
    } while (
      answerFood.no.x === answerFood.yes.x &&
      answerFood.no.y === answerFood.yes.y
    );
  }

  function tick() {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 0) endGame();
  }

  function startAuto() {
    if (!gameInterval) gameInterval = setInterval(loop, GAME_SPEED);
  }
  function stopAuto() {
    clearInterval(gameInterval);
    gameInterval = null;
  }
  function loop() {
    moveSnake();
    checkSelfCollision();
    if (questionActive) checkAnswerCollision();
    draw();
  }

  function moveSnake() {
    const head = { ...snake[0] };
    direction = nextDirection;
    if (direction==='right') head.x = (head.x+1)%GRID_WIDTH;
    if (direction==='left')  head.x = (head.x-1+GRID_WIDTH)%GRID_WIDTH;
    if (direction==='up')    head.y = (head.y-1+GRID_HEIGHT)%GRID_HEIGHT;
    if (direction==='down')  head.y = (head.y+1)%GRID_HEIGHT;
    snake.unshift(head);

    if (!questionActive && head.x===food.x && head.y===food.y) {
      totalQuestions++;
      questionActive = true;
      pausedForStart = true;
      growSegments++;
      currentQuestion = questions[totalQuestions-1].question;
      correctAnswer   = questions[totalQuestions-1].answer;
      questionDisplay.textContent = `${totalQuestions}/${TOTAL_QUESTIONS} – ${currentQuestion}`;
      placeAnswerFoods();
      stopAuto();
      return;
    }

    if (growSegments>0) growSegments--;
    else snake.pop();
  }

  function checkSelfCollision() {
    const [h,...b] = snake;
    for (const seg of b) if (seg.x===h.x && seg.y===h.y) return endGame();
  }

  function checkAnswerCollision() {
    const head = snake[0];
    if (head.x===answerFood.yes.x && head.y===answerFood.yes.y)  handleAnswer(correctAnswer==='oui');
    else if (head.x===answerFood.no.x && head.y===answerFood.no.y) handleAnswer(correctAnswer==='non');
  }

  function handleAnswer(isCorrect) {
    if (isCorrect) {
      correctAnswers++;
      growSegments++;
      updateScore();
    }
    questionActive = false;
    pausedForStart = true;
    stopAuto();
    questionDisplay.textContent = isCorrect
      ? `Bonne réponse ! (${correctAnswers}/${totalQuestions})`
      : `Mauvaise réponse ! (${correctAnswers}/${totalQuestions})`;
    placeFood();
  }

  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#27ae60';
    snake.forEach(seg=>ctx.fillRect(seg.x*GRID_SIZE,seg.y*GRID_SIZE,GRID_SIZE-1,GRID_SIZE-1));
    if (!questionActive) {
      ctx.fillStyle='#f1c40f';
      ctx.fillRect(food.x*GRID_SIZE,food.y*GRID_SIZE,GRID_SIZE,GRID_SIZE);
    } else {
      ctx.fillStyle='green';
      ctx.fillRect(answerFood.yes.x*GRID_SIZE,answerFood.yes.y*GRID_SIZE,GRID_SIZE,GRID_SIZE);
      ctx.fillStyle='red';
      ctx.fillRect(answerFood.no.x*GRID_SIZE,answerFood.no.y*GRID_SIZE,GRID_SIZE,GRID_SIZE);
    }
  }

  function randomCell() {
    let cell;
    do {
      cell = { x:Math.floor(Math.random()*GRID_WIDTH), y:Math.floor(Math.random()*GRID_HEIGHT) };
    } while (snake.some(seg=>seg.x===cell.x&&seg.y===cell.y));
    return cell;
  }

  function updateScore() { scoreDisplay.textContent = correctAnswers; }
  function updateTimer() {
    const m=String(Math.floor(timeLeft/60)).padStart(2,'0'),
          s=String(timeLeft%60).padStart(2,'0');
    timerDisplay.textContent = `${m}:${s}`;
  }

  // Map palier correctAnswers→temps équivalent
  function equivalentTime(eqScore) {
    if (eqScore <= 4)       return 30;
    if (eqScore <= 7)       return 60;
    if (eqScore <= 10)      return 90;
    if (eqScore <= 13)      return 120;
    if (eqScore <= 16)      return 150;
    return 180;
  }

  function endGame() {
    stopAuto();
    clearInterval(timerInterval);
    finalScoreDisplay.textContent = `${correctAnswers} / ${TOTAL_QUESTIONS}`;

    const eqSec = equivalentTime(correctAnswers);
    const eqMin = String(Math.floor(eqSec/60)).padStart(2,'0');
    const eqS   = String(eqSec%60).padStart(2,'0');

    let eqEl = document.getElementById('equivalent-time');
    if (!eqEl) {
      eqEl = document.createElement('p');
      eqEl.id = 'equivalent-time';
      gameOverDiv.appendChild(eqEl);
    }
    eqEl.textContent = `Temps équivalent : ${eqMin}:${eqS}`;

    gameOverDiv.style.display = 'flex';
  }

  function handleDirection(dir) {
    if (!gameStarted) return;
    if (dir === opposite[direction]) return;
    nextDirection = dir;
    if (pausedForStart) {
      pausedForStart = false;
      startAuto();
    }
  }

  // Clavier
  document.addEventListener('keydown', e => {
    const map = { ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right' };
    const dir = map[e.key];
    if (dir) handleDirection(dir);
  });

  // Contrôles tactiles / boutons
  [
    [upBtn, 'up'],
    [downBtn, 'down'],
    [leftBtn, 'left'],
    [rightBtn, 'right']
  ].forEach(([btn, dir]) => {
    btn.addEventListener('click', () => handleDirection(dir));
    btn.addEventListener('touchstart', e => {
      e.preventDefault();
      handleDirection(dir);
    });
  });

  // Boutons Jouer / Rejouer
  playBtn.addEventListener('click', () => {
    if (!gameStarted) {
      initGame();
      document.getElementById('intro-screen').style.display = 'none';
      gameOverDiv.style.display = 'none';
    }
  });
  restartBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    stopAuto();
    gameStarted = false;
    document.getElementById('intro-screen').style.display = 'flex';
    gameOverDiv.style.display = 'none';
  });
});
