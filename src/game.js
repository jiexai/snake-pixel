/*
  像素贪吃蛇（单文件小项目）
  - 方向键 / WASD 控制
  - 空格暂停
  - R 重开
  - 触摸：在画布上滑动改变方向
*/

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  const ui = {
    score: document.getElementById('score'),
    best: document.getElementById('best'),
    speed: document.getElementById('speed'),
    overlay: document.getElementById('overlay'),
    overlayTitle: document.getElementById('overlayTitle'),
    overlayHint: document.getElementById('overlayHint'),
    btnResume: document.getElementById('btnResume'),
    btnRestart: document.getElementById('btnRestart'),
  };

  // 格子设置（像素风关键：用整格绘制 + canvas 开启 pixelated）
  const GRID = 28; // 28x28
  const CELL = Math.floor(canvas.width / GRID); // 560/28=20
  const BOARD_PX = GRID * CELL;

  // 颜色
  const COLORS = {
    bg: '#0a0f16',
    grid: '#162233',
    wall: '#24344b',
    snake: '#32d583',
    snake2: '#12b76a',
    eye: '#06121a',
    food: '#ff4d4f',
    food2: '#ffa39e',
    glow: 'rgba(255,77,79,.22)'
  };

  const STORAGE_KEY = 'snake_pixel_best_v1';

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function eq(a, b) { return a.x === b.x && a.y === b.y; }

  function wrapText(title, hint) {
    ui.overlayTitle.textContent = title;
    ui.overlayHint.textContent = hint;
  }

  function showOverlay(title, hint) {
    wrapText(title, hint);
    ui.overlay.hidden = false;
  }

  function hideOverlay() {
    ui.overlay.hidden = true;
  }

  function loadBest() {
    try {
      const v = Number(localStorage.getItem(STORAGE_KEY) || 0);
      return Number.isFinite(v) ? v : 0;
    } catch {
      return 0;
    }
  }

  function saveBest(v) {
    try { localStorage.setItem(STORAGE_KEY, String(v)); } catch {}
  }

  // 游戏状态
  let best = loadBest();
  ui.best.textContent = best;

  let running = true;
  let paused = false;
  let over = false;

  let score = 0;
  let tickMsBase = 140; // 初始速度（越小越快）
  let tickMs = tickMsBase;

  let lastTs = 0;
  let acc = 0;

  // snake: 数组头部为蛇头
  let snake;
  let dir;
  let nextDir;
  let food;

  function reset() {
    over = false;
    paused = false;
    running = true;

    score = 0;
    tickMs = tickMsBase;
    updateHUD();

    const cx = Math.floor(GRID / 2);
    const cy = Math.floor(GRID / 2);

    snake = [
      { x: cx, y: cy },
      { x: cx - 1, y: cy },
      { x: cx - 2, y: cy },
    ];

    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };

    food = spawnFood();
    hideOverlay();
  }

  function updateHUD() {
    ui.score.textContent = String(score);
    ui.best.textContent = String(best);

    // 速度显示：1x ~ 5x
    const mult = clamp(Math.round((tickMsBase / tickMs) * 10) / 10, 1, 9);
    ui.speed.textContent = `${mult}x`;
  }

  function spawnFood() {
    // 尽量避免生成在蛇身上
    for (let i = 0; i < 500; i++) {
      const p = { x: randInt(0, GRID - 1), y: randInt(0, GRID - 1) };
      if (!snake.some(s => eq(s, p))) return p;
    }
    // 极端情况下（基本不会）：返回固定点
    return { x: 1, y: 1 };
  }

  function setDir(dx, dy) {
    // 禁止 180° 掉头
    if (dx === -dir.x && dy === -dir.y) return;
    nextDir = { x: dx, y: dy };
  }

  function step() {
    if (paused || over) return;

    dir = nextDir;

    const head = snake[0];
    const newHead = { x: head.x + dir.x, y: head.y + dir.y };

    // 撞墙
    if (newHead.x < 0 || newHead.x >= GRID || newHead.y < 0 || newHead.y >= GRID) {
      gameOver();
      return;
    }

    // 撞自己（允许尾巴前进后“空出来”的格子：所以先计算是否吃到食物）
    const willEat = eq(newHead, food);

    // 如果不吃，尾巴会移走一格，因此碰撞检测要把尾巴排除
    const bodyToCheck = willEat ? snake : snake.slice(0, snake.length - 1);
    if (bodyToCheck.some(s => eq(s, newHead))) {
      gameOver();
      return;
    }

    snake.unshift(newHead);

    if (willEat) {
      score += 10;
      // 每吃 3 个加速一次（上限）
      const eaten = (score / 10);
      if (eaten % 3 === 0) tickMs = Math.max(70, Math.floor(tickMs * 0.92));

      best = Math.max(best, score);
      saveBest(best);
      food = spawnFood();
      updateHUD();
    } else {
      snake.pop();
    }
  }

  function gameOver() {
    over = true;
    showOverlay('游戏结束', '按 R 重开，或点击“重开”');
  }

  // 渲染
  function drawGrid() {
    // 背景
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, BOARD_PX, BOARD_PX);

    // 网格线（淡）
    ctx.fillStyle = COLORS.grid;
    for (let i = 0; i <= GRID; i++) {
      // 竖线
      ctx.fillRect(i * CELL, 0, 1, BOARD_PX);
      // 横线
      ctx.fillRect(0, i * CELL, BOARD_PX, 1);
    }

    // 边框墙
    ctx.strokeStyle = COLORS.wall;
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, BOARD_PX - 2, BOARD_PX - 2);
  }

  function drawFood() {
    const x = food.x * CELL;
    const y = food.y * CELL;

    // 外发光
    ctx.fillStyle = COLORS.glow;
    ctx.fillRect(x - 2, y - 2, CELL + 4, CELL + 4);

    // 像素块（两色）
    ctx.fillStyle = COLORS.food;
    ctx.fillRect(x + 2, y + 2, CELL - 4, CELL - 4);
    ctx.fillStyle = COLORS.food2;
    ctx.fillRect(x + 5, y + 5, Math.max(2, CELL - 12), Math.max(2, CELL - 12));
  }

  function drawSnake() {
    for (let i = snake.length - 1; i >= 0; i--) {
      const p = snake[i];
      const x = p.x * CELL;
      const y = p.y * CELL;

      const isHead = i === 0;
      const c = isHead ? COLORS.snake : (i % 2 === 0 ? COLORS.snake : COLORS.snake2);

      ctx.fillStyle = c;
      ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);

      // 简单的像素高光
      ctx.fillStyle = 'rgba(255,255,255,.10)';
      ctx.fillRect(x + 2, y + 2, CELL - 6, 3);

      if (isHead) {
        // 画眼睛：根据方向放置
        const ex = x + (dir.x === 1 ? CELL - 7 : dir.x === -1 ? 4 : CELL - 8);
        const ey = y + (dir.y === 1 ? CELL - 7 : dir.y === -1 ? 4 : 5);
        ctx.fillStyle = COLORS.eye;
        ctx.fillRect(ex, ey, 3, 3);
        ctx.fillRect(ex + (dir.x === 0 ? 6 : 0), ey + (dir.y === 0 ? 6 : 0), 3, 3);
      }
    }
  }

  function render() {
    drawGrid();
    drawFood();
    drawSnake();

    if (paused && !over) {
      // overlay 已处理
    }
  }

  function loop(ts) {
    if (!running) return;

    if (!lastTs) lastTs = ts;
    const dt = ts - lastTs;
    lastTs = ts;

    acc += dt;

    // 固定步长逻辑更新（可追帧）
    const maxSteps = 5;
    let steps = 0;
    while (acc >= tickMs && steps < maxSteps) {
      step();
      acc -= tickMs;
      steps++;
    }

    render();
    requestAnimationFrame(loop);
  }

  // 键盘输入
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();

    if (k === ' ' || k === 'spacebar') {
      e.preventDefault();
      togglePause();
      return;
    }

    if (k === 'r') {
      reset();
      return;
    }

    // 方向
    if (k === 'arrowup' || k === 'w') setDir(0, -1);
    else if (k === 'arrowdown' || k === 's') setDir(0, 1);
    else if (k === 'arrowleft' || k === 'a') setDir(-1, 0);
    else if (k === 'arrowright' || k === 'd') setDir(1, 0);
  });

  function togglePause() {
    if (over) return;
    paused = !paused;
    if (paused) showOverlay('暂停', '按空格继续');
    else hideOverlay();
  }

  // Overlay 按钮
  ui.btnResume.addEventListener('click', () => {
    if (over) return;
    paused = false;
    hideOverlay();
  });
  ui.btnRestart.addEventListener('click', () => reset());

  // 触摸滑动控制
  let touchStart = null;
  canvas.addEventListener('touchstart', (e) => {
    if (!e.touches?.length) return;
    const t = e.touches[0];
    touchStart = { x: t.clientX, y: t.clientY, ts: performance.now() };
  }, { passive: true });

  canvas.addEventListener('touchmove', (e) => {
    // 防止页面滚动干扰
    e.preventDefault();
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    if (!touchStart) return;
    const t = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0] : null;
    if (!t) { touchStart = null; return; }

    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    // 轻触：当作暂停/继续
    if (absX < 14 && absY < 14) {
      togglePause();
      touchStart = null;
      return;
    }

    if (absX > absY) {
      setDir(dx > 0 ? 1 : -1, 0);
    } else {
      setDir(0, dy > 0 ? 1 : -1);
    }

    touchStart = null;
  }, { passive: true });

  // 启动
  reset();
  requestAnimationFrame(loop);

  // 初次提示
  showOverlay('开始游戏', '按任意方向键或滑动开始 · 空格暂停');
})();
