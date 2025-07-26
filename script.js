// script.js
document.addEventListener('DOMContentLoaded', () => {
  // Références DOM
  const playBtn     = document.getElementById('play-btn');
  const restartBtn  = document.getElementById('restart-btn');
  const canvas      = document.getElementById('game-board');
  const ctx         = canvas.getContext('2d');

  // Constantes
  const gridSize   = 20;
  const gridWidth  = canvas.width  / gridSize;
  const gridHeight = canvas.height / gridSize;
  const TOTAL_QUESTIONS_IN_QUIZ = 20;

  // Variables de jeu
  let snake, direction, nextDirection;
  let food, answerFood = { yes: {}, no: {} };
  let gameInterval = null, timerInterval = null;
  let gameSpeed;
  let correctAnswers, totalQuestions;
  let questionActive, questionPaused;
  let currentQuestion, correctAnswer;
  let timeLeft;   // en secondes
  let gameStarted = false;

  // Questions pour le BTP
  const questions = [
    { question: "Un mur sert à séparer des pièces ou à soutenir un toit.", answer: "oui" },
    { question: "Le sable est un ingrédient du béton.", answer: "oui" },
    { question: "Un marteau sert à visser des vis.", answer: "non" },
    { question: "La maçonnerie utilise des briques ou des blocs.", answer: "oui" },
    { question: "Une grue sert à soulever des charges lourdes sur un chantier.", answer: "oui" },
    { question: "Le ciment est un type de bois.", answer: "non" },
    { question: "Un architecte dessine les plans des bâtiments.", answer: "oui" },
    { question: "Le parpaing est un bloc de construction courant.", answer: "oui" },
    { question: "Pour peindre un mur, on utilise de l'eau seulement.", answer: "non" },
    { question: "Un casque de sécurité protège la tête sur un chantier.", answer: "oui" },
    { question: "La plomberie s'occupe de l'électricité dans un bâtiment.", answer: "non" },
    { question: "Un échafaudage est une structure temporaire pour travailler en hauteur.", answer: "oui" },
    { question: "Le gros œuvre correspond aux fondations et murs porteurs d'un bâtiment.", answer: "oui" },
    { question: "Un mètre ruban sert à mesurer des distances.", answer: "oui" },
    { question: "Un électricien installe les prises et les fils électriques.", answer: "oui" },
    { question: "Le carrelage se pose sur les murs et les sols.", answer: "oui" },
    { question: "Un permis de construire est nécessaire pour bâtir une maison.", answer: "oui" },
    { question: "Le toit protège le bâtiment de la pluie et du vent.", answer: "oui" },
    { question: "Le bois est un matériau de construction renouvelable.", answer: "oui" },
    { question: "La rénovation consiste à construire un bâtiment neuf.", answer: "non" }
  ];

  // ------------------------------------------------
  // Fonctions de gestion du jeu
  // ------------------------------------------------

  function initGame() {
    snake = [{ x:10,y:10 },{ x:9,y:10 },{ x:8,y:10 }];
    direction = nextDirection = 'right';
    correctAnswers = totalQuestions = 0;
    questionActive = questionPaused = false;
    updateDisplay();

    gameSpeed = 200;

    timeLeft = 180;
    document.getElementById('timer').textContent = formatTime(timeLeft);
    clearInterval(timerInterval);
    timerInterval = setInterval(countdown, 1000);

    shuffle(questions);

    generateFood();
  }

  function startGame() {
    // Si la partie n'a pas encore commencé, on l'initialise
    if (!gameStarted) {
      initGame();
      gameStarted = true;
    }
    // On (re)lance la boucle de jeu
    clearInterval(gameInterval);
    questionPaused = false;
    gameInterval = setInterval(gameLoop, gameSpeed);
    // On masque les écrans d'intro et de fin
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('intro-screen').style.display = 'none';
  }

  function restartGame() {
    clearInterval(gameInterval);
    clearInterval(timerInterval);
    gameStarted = false; // On réinitialise l'état de la partie
    startGame();
  }

  function gameOver() {
    clearInterval(gameInterval);
    clearInterval(timerInterval);
    document.getElementById('correct-answers').textContent = correctAnswers;
    document.getElementById('game-over').style.display     = 'flex';
  }

  // ------------------------------------------------
  // Boucle de jeu et logique du serpent
  // ------------------------------------------------

  function gameLoop() {
    moveSnake();
    checkCollision();
    draw();
  }

  function countdown() {
    timeLeft--;
    document.getElementById('timer').textContent = formatTime(timeLeft);
    if (timeLeft <= 0) {
      gameOver();
    }
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

    if (!questionActive && snake[0].x===food.x && snake[0].y===food.y) {
      if (totalQuestions >= TOTAL_QUESTIONS_IN_QUIZ) {
        gameOver();
        return;
      }
      totalQuestions++;
      questionActive = true;
      questionPaused = true;
      currentQuestion = questions[totalQuestions-1].question;
      correctAnswer   = questions[totalQuestions-1].answer;
      document.getElementById('question').textContent = `${totalQuestions}/${TOTAL_QUESTIONS_IN_QUIZ} – ${currentQuestion}`;
      generateAnswerFoods();
      clearInterval(gameInterval);
      gameInterval = null;
    } else {
      snake.pop();
    }
  }

  function checkCollision() {
    const head = snake[0];

    for (let i=1; i<snake.length; i++) {
      if (head.x===snake[i].x && head.y===snake[i].y) return gameOver();
    }

    if (questionActive && questionPaused) {
      let choice = null;
      if (head.x===answerFood.yes.x && head.y===answerFood.yes.y) choice = 'oui';
      if (head.x===answerFood.no.x && head.y===answerFood.no.y) choice = 'non';

      if (choice !== null) {
        const wasCorrect = (choice === correctAnswer);
        if (wasCorrect) {
          correctAnswers++;
        }
        endQuestion(wasCorrect);
      }
    }
  }

  function endQuestion(wasCorrect) {
    questionActive = false;
    questionPaused = true;

    updateDisplay();

    const feedback = wasCorrect ? 'Bonne réponse !' : 'Mauvaise réponse.';
    document.getElementById('question').textContent = `${feedback} (${correctAnswers}/${totalQuestions}) - Appuyez sur une flèche pour continuer.`;

    generateFood();
    clearInterval(gameInterval);
    gameInterval = null;
  }

  // ------------------------------------------------
  // Utilitaires
  // ------------------------------------------------

  function updateDisplay() {
    document.getElementById('correct-answers-display').textContent = correctAnswers;
  }

  function generateFood() {
    food = {
      x: Math.floor(Math.random() * gridWidth),
      y: Math.floor(Math.random() * gridHeight)
    };
    while (isOccupied(food)) {
        food = {
            x: Math.floor(Math.random() * gridWidth),
            y: Math.floor(Math.random() * gridHeight)
        };
    }
  }

  function generateAnswerFoods() {
    let pos1, pos2;
    do {
      pos1 = { x: Math.floor(Math.random() * gridWidth), y: Math.floor(Math.random() * gridHeight) };
    } while (isOccupied(pos1));

    do {
      pos2 = { x: Math.floor(Math.random() * gridWidth), y: Math.floor(Math.random() * gridHeight) };
    } while (isOccupied(pos2) || (pos1.x === pos2.x && pos1.y === pos2.y));

    if (Math.random() < 0.5) {
      answerFood.yes = pos1;
      answerFood.no = pos2;
    } else {
      answerFood.yes = pos2;
      answerFood.no = pos1;
    }
  }

  function isOccupied(pos) {
    return snake.some(segment => segment.x === pos.x && segment.y === pos.y);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#27ae60';
    snake.forEach(segment => {
      ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 1, gridSize - 1);
    });

    if (!questionActive) {
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
    }

    if (questionActive) {
      ctx.fillStyle = 'green';
      ctx.fillRect(answerFood.yes.x * gridSize, answerFood.yes.y * gridSize, gridSize, gridSize);
      ctx.fillStyle = 'red';
      ctx.fillRect(answerFood.no.x * gridSize, answerFood.no.y * gridSize, gridSize, gridSize);
    }
  }

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  // ------------------------------------------------
  // Gestionnaires d'événements
  // ------------------------------------------------

  // Le clic sur le bouton "Jouer" appelle la fonction startGame.
  playBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', restartGame);

  document.addEventListener('keydown', e => {
    const keyMap = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
    const oppositeMap = { up: 'down', down: 'up', left: 'right', right: 'left' };

    if (keyMap[e.key] && direction !== oppositeMap[keyMap[e.key]]) {
        nextDirection = keyMap[e.key];
        // Relance le jeu s'il est en pause (après une question).
        // La condition "gameStarted" empêche de démarrer le jeu avec une touche
        // depuis l'écran d'introduction.
        if (gameInterval === null && gameStarted) {
            startGame();
        }
    }
  });

  document.getElementById('up-btn').addEventListener('click', () => {
    if (direction !== 'down') nextDirection = 'up';
    if (gameInterval === null && gameStarted) startGame();
  });
  document.getElementById('down-btn').addEventListener('click', () => {
    if (direction !== 'up') nextDirection = 'down';
    if (gameInterval === null && gameStarted) startGame();
  });
  document.getElementById('left-btn').addEventListener('click', () => {
    if (direction !== 'right') nextDirection = 'left';
    if (gameInterval === null && gameStarted) startGame();
  });
  document.getElementById('right-btn').addEventListener('click', () => {
    if (direction !== 'left') nextDirection = 'right';
    if (gameInterval === null && gameStarted) startGame();
  });
});