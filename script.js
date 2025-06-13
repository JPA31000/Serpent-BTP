// script.js
document.addEventListener('DOMContentLoaded', () => {
  // Références DOM
  const playBtn     = document.getElementById('play-btn');
  const startBtn    = document.getElementById('start-btn');
  const pauseBtn    = document.getElementById('pause-btn');
  const restartBtn  = document.getElementById('restart-btn');
  const canvas      = document.getElementById('game-board');
  const ctx         = canvas.getContext('2d');

  // Constantes
  const gridSize   = 20;
  const gridWidth  = canvas.width  / gridSize;
  const gridHeight = canvas.height / gridSize;

  // Variables de jeu
  let snake, direction, nextDirection;
  let food, answerFood = { yes: {}, no: {} };
  let gameInterval = null, timerInterval = null;
  let gameSpeed;
  let difficulty, score, level, correctAnswers, totalQuestions;
  let questionActive, questionPaused;
  let currentQuestion, correctAnswer;
  let timeLeft;   // en secondes
  let gameStarted = false;

  // 20 questions pour la note sur 20
  const questions = [
    { question: "Le béton armé contient des barres d'acier pour augmenter sa résistance à la traction.", answer: "oui" },
    { question: "Un pont à haubans utilise des câbles disposés en éventail pour supporter le tablier.", answer: "oui" },
    { question: "Le coffrage est utilisé pour donner forme au béton pendant son durcissement.", answer: "oui" },
    { question: "La pierre de taille est principalement utilisée dans la construction moderne de gratte-ciels.", answer: "non" },
    { question: "Les fondations superficielles sont adaptées pour tous les types de sol et de bâtiments.", answer: "non" },
    { question: "Le BIM (Building Information Modeling) est une technologie utilisée dans la construction.", answer: "oui" },
    { question: "Le mortier est un mélange de ciment, sable, eau et chaux utilisé comme liant.", answer: "oui" },
    { question: "Les ponts suspendus sont maintenus par des câbles ancrés directement dans le tablier.", answer: "non" },
    { question: "Le plâtre est imperméable et souvent utilisé pour les constructions extérieures.", answer: "non" },
    { question: "Les bâtiments à ossature bois peuvent atteindre plusieurs étages.", answer: "oui" },
    { question: "Le terme 'gros œuvre' désigne les finitions décoratives d'un bâtiment.", answer: "non" },
    { question: "Les agrégats sont des matériaux comme le sable ou le gravier utilisés dans le béton.", answer: "oui" },
    { question: "Une poutre en I présente une meilleure résistance à la flexion qu'une poutre carrée de même masse.", answer: "oui" },
    { question: "L'isolation thermique par l'extérieur (ITE) permet d'éliminer les ponts thermiques.", answer: "oui" },
    { question: "Les charpentes métalliques sont plus lourdes que les charpentes en bois.", answer: "non" },
    { question: "L'énergie hydraulique peut être utilisée sur les chantiers pour alimenter des outils.", answer: "oui" },
    { question: "La charge d'exploitation est prise en compte dans le calcul des fondations.", answer: "oui" },
    { question: "Le béton précontraint utilise des câbles de tension pour améliorer ses performances.", answer: "oui" },
    { question: "La flexion maximale d'une poutre se produit au niveau des appuis.", answer: "non" },
    { question: "La conductivité thermique du bois est supérieure à celle du béton.", answer: "non" }
  ];

  // ------------------------------------------------
  // Fonctions de gestion du jeu
  // ------------------------------------------------

  function initGame() {
    // serpent de départ
    snake = [{ x:10,y:10 },{ x:9,y:10 },{ x:8,y:10 }];
    direction = nextDirection = 'right';
    score = level = correctAnswers = totalQuestions = 0;
    questionActive = questionPaused = false;
    updateDisplay();

    // vitesse
    if (difficulty === 'easy')   gameSpeed = 200;
    else if (difficulty === 'hard') gameSpeed = 100;
    else                            gameSpeed = 150;

    // minuterie 3 min
    timeLeft = 180;
    document.getElementById('timer').textContent = formatTime(timeLeft);
    clearInterval(timerInterval);
    timerInterval = setInterval(countdown, 1000);

    // tirer 20 questions aléatoires et uniques
    shuffle(questions);
    questions.splice(20); // on garde les 20 premières

    generateFood();
  }

  function startGame() {
    if (!gameStarted) {
      initGame();
      gameStarted = true;
    }
    clearInterval(gameInterval);
    questionPaused = false;
    gameInterval = setInterval(gameLoop, gameSpeed);
    document.getElementById('game-over').style.display = 'none';
  }

  function pauseGame() {
    if (gameInterval && !questionActive) {
      clearInterval(gameInterval);
      gameInterval = null;
    }
  }

  function restartGame() {
    clearInterval(gameInterval);
    clearInterval(timerInterval);
    gameStarted = false;
    startGame();
  }

  function gameOver() {
    clearInterval(gameInterval);
    clearInterval(timerInterval);
    document.getElementById('final-score').textContent     = correctAnswers;
    document.getElementById('correct-answers').textContent = correctAnswers;
    document.getElementById('total-questions').textContent = 20;
    document.getElementById('game-over').style.display     = 'flex';
  }

  // ------------------------------------------------
  // Boucle, compteur et logique du serpent/questions
  // ------------------------------------------------

  function gameLoop() {
    moveSnake();
    checkCollision();
    draw();
  }

  function countdown() {
    timeLeft--;
    document.getElementById('timer').textContent = formatTime(timeLeft);
    if (timeLeft <= 0) gameOver();
  }

  function moveSnake() {
    if (questionActive && questionPaused) return;

    const head = { ...snake[0] };
    direction = nextDirection;
    if      (direction==='right') head.x = (head.x+1)%gridWidth;
    else if (direction==='left')  head.x = (head.x-1+gridWidth)%gridWidth;
    else if (direction==='up')    head.y = (head.y-1+gridHeight)%gridHeight;
    else if (direction==='down')  head.y = (head.y+1)%gridHeight;

    snake.unshift(head);

    // question
    if (!questionActive && snake[0].x===food.x && snake[0].y===food.y) {
      totalQuestions++;
      questionActive = questionPaused = true;
      currentQuestion = questions[totalQuestions-1].question;
      correctAnswer   = questions[totalQuestions-1].answer;
      document.getElementById('question').textContent = `${totalQuestions}/20 – ${currentQuestion}`;
      generateAnswerFoods();
    } else {
      snake.pop();
    }
    updateDisplay();
  }

  function checkCollision() {
    const head = snake[0];
    // auto‐collision
    for (let i=1; i<snake.length; i++) {
      if (head.x===snake[i].x && head.y===snake[i].y) return gameOver();
    }
    // réponses
    if (questionActive && !questionPaused) {
      if (head.x===answerFood.yes.x && head.y===answerFood.yes.y) {
        if (correctAnswer==='oui') correctAnswers++;
        endQuestion();
      }
      if (head.x===answerFood.no.x && head.y===answerFood.no.y) {
        // 0 point en cas de 'non' alors qu'on attend 'oui'
        endQuestion();
      }
    }
  }

  function endQuestion() {
    questionActive = false;
    document.getElementById('question').textContent = `Bonne réponse ! (${correctAnswers}/${totalQuestions})`;
    generateFood();
  }

  // ------------------------------------------------
  // Utilitaires (affichage, génération, dessin…)
  // ------------------------------------------------

  function updateDisplay() {
    level = Math.floor(correctAnswers / 5) + 1;
    document.getElementById('score').textContent = correctAnswers;
    document.getElementById('level').textContent = level;
  }

  function generateFood() {
    food = {
      x: Math.floor(Math.random() * gridWidth),
      y: Math.floor(Math.random() * gridHeight)
    };
  }

  function generateAnswerFoods() {
    answerFood.yes = {
      x: Math.floor(Math.random() * gridWidth),
      y: Math.floor(Math.random() * gridHeight)
    };
    do {
      answerFood.no = {
        x: Math.floor(Math.random() * gridWidth),
        y: Math.floor(Math.random() * gridHeight)
      };
    } while (answerFood.no.x === answerFood.yes.x && answerFood.no.y === answerFood.yes.y);
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  function drawCell(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    snake.forEach((s, i) => drawCell(s.x, s.y, i === 0 ? '#1abc9c' : '#2ecc71'));
    drawCell(food.x, food.y, '#f1c40f');
    if (questionActive) {
      drawCell(answerFood.yes.x, answerFood.yes.y, '#2ecc71');
      drawCell(answerFood.no.x, answerFood.no.y, '#e74c3c');
    }
  }

  function formatTime(sec) {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  function setDirection(dir) {
    if (
      (dir === 'left' && direction !== 'right') ||
      (dir === 'right' && direction !== 'left') ||
      (dir === 'up' && direction !== 'down') ||
      (dir === 'down' && direction !== 'up')
    ) {
      nextDirection = dir;
      questionPaused = false;
    }
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp')    setDirection('up');
    if (e.key === 'ArrowDown')  setDirection('down');
    if (e.key === 'ArrowLeft')  setDirection('left');
    if (e.key === 'ArrowRight') setDirection('right');
  });

  playBtn.addEventListener('click', () => {
    difficulty = document.getElementById('difficulty-select').value;
    document.getElementById('intro-screen').style.display = 'none';
    startGame();
  });

  startBtn.addEventListener('click', startGame);
  pauseBtn.addEventListener('click', pauseGame);
  restartBtn.addEventListener('click', restartGame);

  document.getElementById('up-btn').addEventListener('click', () => setDirection('up'));
  document.getElementById('down-btn').addEventListener('click', () => setDirection('down'));
  document.getElementById('left-btn').addEventListener('click', () => setDirection('left'));
  document.getElementById('right-btn').addEventListener('click', () => setDirection('right'));

});
