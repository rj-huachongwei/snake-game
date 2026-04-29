/**
 * game.js — 贪吃蛇游戏核心逻辑
 * 纯原生 JavaScript + Canvas，无第三方依赖
 */

(function () {
  'use strict';

  // ===== 常量 =====
  const GRID_SIZE = 20;          // 格子边长（像素）
  const COLS = 20;               // 列数
  const ROWS = 20;               // 行数
  const BASE_SPEED = 150;        // 初始帧间隔（ms）
  const MIN_SPEED = 60;          // 最快帧间隔（ms）
  const SPEED_STEP = 5;          // 每10分加速（ms）

  // ===== DOM =====
  const canvas      = document.getElementById('gameCanvas');
  const ctx         = canvas.getContext('2d');
  const scoreEl     = document.getElementById('score');
  const bestEl      = document.getElementById('best-score');
  const overlay     = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlay-title');
  const overlayMsg  = document.getElementById('overlay-msg');
  const mainBtn     = document.getElementById('main-btn');
  const pauseBtn    = document.getElementById('pause-btn');
  const restartBtn  = document.getElementById('restart-btn');
  const modal       = document.getElementById('modal');
  const modalScore  = document.getElementById('modal-score');
  const modalBest   = document.getElementById('modal-best');
  const modalRestart = document.getElementById('modal-restart');

  // ===== 游戏状态 =====
  const STATE = { IDLE: 0, RUNNING: 1, PAUSED: 2, OVER: 3 };
  let state = STATE.IDLE;
  let snake, dir, nextDir, food, score, bestScore, loopTimer;

  // ===== 初始化最高分 =====
  bestScore = parseInt(localStorage.getItem('snake_best') || '0', 10);
  bestEl.textContent = bestScore;

  // ===== 工具函数 =====
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function spawnFood() {
    let pos;
    do {
      pos = { x: randInt(0, COLS - 1), y: randInt(0, ROWS - 1) };
    } while (snake.some(seg => seg.x === pos.x && seg.y === pos.y));
    return pos;
  }

  function currentInterval() {
    // 每得 10 分速度提升 SPEED_STEP ms，最快 MIN_SPEED
    return Math.max(MIN_SPEED, BASE_SPEED - Math.floor(score / 10) * SPEED_STEP);
  }

  // ===== 游戏初始化 =====
  function initGame() {
    const startX = Math.floor(COLS / 2);
    const startY = Math.floor(ROWS / 2);
    snake = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
    ];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    score = 0;
    scoreEl.textContent = 0;
    food = spawnFood();
  }

  // ===== 游戏循环 =====
  function startLoop() {
    clearTimeout(loopTimer);
    loopTimer = setTimeout(tick, currentInterval());
  }

  function tick() {
    if (state !== STATE.RUNNING) return;
    dir = nextDir;

    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    // 边界穿越（环绕）
    head.x = (head.x + COLS) % COLS;
    head.y = (head.y + ROWS) % ROWS;
    // 撞自身检测
    if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
      endGame(); return;
    }

    snake.unshift(head);

    // 吃到食物
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      scoreEl.textContent = score;
      if (score > bestScore) {
        bestScore = score;
        bestEl.textContent = bestScore;
        localStorage.setItem('snake_best', bestScore);
      }
      food = spawnFood();
    } else {
      snake.pop();
    }

    draw();
    startLoop();
  }

  // ===== 渲染 =====
  const COLORS = {
    bg:         '#111827',
    grid:       '#1a2234',
    snakeHead:  '#4ade80',
    snakeBody:  '#22c55e',
    snakeDark:  '#16a34a',
    food:       '#f87171',
    foodGlow:   'rgba(248,113,113,0.35)',
  };

  function draw() {
    const W = COLS * GRID_SIZE;
    const H = ROWS * GRID_SIZE;

    // 背景
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, W, H);

    // 网格线（淡）
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * GRID_SIZE, 0);
      ctx.lineTo(x * GRID_SIZE, H);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * GRID_SIZE);
      ctx.lineTo(W, y * GRID_SIZE);
      ctx.stroke();
    }

    // 食物（带光晕）
    const fx = food.x * GRID_SIZE + GRID_SIZE / 2;
    const fy = food.y * GRID_SIZE + GRID_SIZE / 2;
    const glow = ctx.createRadialGradient(fx, fy, 2, fx, fy, GRID_SIZE);
    glow.addColorStop(0, COLORS.food);
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = COLORS.foodGlow;
    ctx.beginPath();
    ctx.arc(fx, fy, GRID_SIZE, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = COLORS.food;
    ctx.beginPath();
    ctx.roundRect(
      food.x * GRID_SIZE + 3,
      food.y * GRID_SIZE + 3,
      GRID_SIZE - 6,
      GRID_SIZE - 6,
      4
    );
    ctx.fill();

    // 蛇身
    snake.forEach((seg, i) => {
      const x = seg.x * GRID_SIZE + 1;
      const y = seg.y * GRID_SIZE + 1;
      const s = GRID_SIZE - 2;

      if (i === 0) {
        // 蛇头：亮绿色 + 圆角
        ctx.fillStyle = COLORS.snakeHead;
        ctx.beginPath();
        ctx.roundRect(x, y, s, s, 6);
        ctx.fill();

        // 眼睛
        drawEye(seg, dir, s);
      } else {
        // 蛇身：渐暗
        const t = i / snake.length;
        ctx.fillStyle = lerpColor(COLORS.snakeBody, COLORS.snakeDark, t);
        ctx.beginPath();
        ctx.roundRect(x + 1, y + 1, s - 2, s - 2, 4);
        ctx.fill();
      }
    });
  }

  function drawEye(head, d, s) {
    // 根据方向计算眼睛位置
    const bx = head.x * GRID_SIZE + 1;
    const by = head.y * GRID_SIZE + 1;
    const eyeR = 2.5;
    const offset = 5;

    let e1, e2;
    if (d.x === 1)       { e1 = {x: bx+s-offset, y: by+offset};   e2 = {x: bx+s-offset, y: by+s-offset}; }
    else if (d.x === -1) { e1 = {x: bx+offset,   y: by+offset};   e2 = {x: bx+offset,   y: by+s-offset}; }
    else if (d.y === -1) { e1 = {x: bx+offset,   y: by+offset};   e2 = {x: bx+s-offset, y: by+offset}; }
    else                 { e1 = {x: bx+offset,   y: by+s-offset}; e2 = {x: bx+s-offset, y: by+s-offset}; }

    ctx.fillStyle = '#0f1117';
    [e1, e2].forEach(e => {
      ctx.beginPath();
      ctx.arc(e.x, e.y, eyeR, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function lerpColor(a, b, t) {
    const ah = parseInt(a.slice(1), 16);
    const bh = parseInt(b.slice(1), 16);
    const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
    const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
    const rr = Math.round(ar + (br - ar) * t);
    const rg = Math.round(ag + (bg - ag) * t);
    const rb = Math.round(ab + (bb - ab) * t);
    return `rgb(${rr},${rg},${rb})`;
  }

  // ===== 状态控制 =====
  function startGame() {
    initGame();
    state = STATE.RUNNING;
    overlay.style.display = 'none';
    pauseBtn.disabled = false;
    restartBtn.disabled = false;
    pauseBtn.textContent = '暂停';
    pauseBtn.classList.remove('active');
    draw();
    startLoop();
  }

  function pauseGame() {
    if (state !== STATE.RUNNING) return;
    state = STATE.PAUSED;
    pauseBtn.textContent = '继续';
    pauseBtn.classList.add('active');
    clearTimeout(loopTimer);
  }

  function resumeGame() {
    if (state !== STATE.PAUSED) return;
    state = STATE.RUNNING;
    pauseBtn.textContent = '暂停';
    pauseBtn.classList.remove('active');
    startLoop();
  }

  function endGame() {
    state = STATE.OVER;
    clearTimeout(loopTimer);
    pauseBtn.disabled = true;
    // 显示 modal
    modalScore.textContent = score;
    modalBest.textContent = bestScore;
    modal.style.display = 'flex';
  }

  // ===== 按钮事件 =====
  mainBtn.addEventListener('click', startGame);

  pauseBtn.addEventListener('click', () => {
    if (state === STATE.RUNNING) pauseGame();
    else if (state === STATE.PAUSED) resumeGame();
  });

  restartBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    startGame();
  });

  modalRestart.addEventListener('click', () => {
    modal.style.display = 'none';
    startGame();
  });

  // ===== 键盘事件 =====
  const DIR_MAP = {
    ArrowUp:    { x:  0, y: -1 },
    ArrowDown:  { x:  0, y:  1 },
    ArrowLeft:  { x: -1, y:  0 },
    ArrowRight: { x:  1, y:  0 },
    w: { x:  0, y: -1 },
    s: { x:  0, y:  1 },
    a: { x: -1, y:  0 },
    d: { x:  1, y:  0 },
    W: { x:  0, y: -1 },
    S: { x:  0, y:  1 },
    A: { x: -1, y:  0 },
    D: { x:  1, y:  0 },
  };

  document.addEventListener('keydown', (e) => {
    const mapped = DIR_MAP[e.key];

    // 空格键 暂停/继续
    if (e.key === ' ') {
      e.preventDefault();
      if (state === STATE.RUNNING) pauseGame();
      else if (state === STATE.PAUSED) resumeGame();
      else if (state === STATE.IDLE || state === STATE.OVER) startGame();
      return;
    }

    // Enter 键也可开始
    if (e.key === 'Enter') {
      if (state === STATE.IDLE || state === STATE.OVER) startGame();
      return;
    }

    if (!mapped) return;
    e.preventDefault();

    // 不允许反向移动
    if (mapped.x === -dir.x && mapped.y === -dir.y) return;
    nextDir = mapped;

    // 如果还未开始 / 暂停状态，按方向键也可启动/继续
    if (state === STATE.IDLE) startGame();
    else if (state === STATE.PAUSED) resumeGame();
  });

  // ===== 初始绘制空棋盘 =====
  (function initialDraw() {
    const W = COLS * GRID_SIZE;
    const H = ROWS * GRID_SIZE;
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath(); ctx.moveTo(x * GRID_SIZE, 0); ctx.lineTo(x * GRID_SIZE, H); ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath(); ctx.moveTo(0, y * GRID_SIZE); ctx.lineTo(W, y * GRID_SIZE); ctx.stroke();
    }
  })();

})();
