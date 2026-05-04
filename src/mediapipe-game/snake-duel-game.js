/**
 * SnakeDuelGame — 2-Player educational snake duel on one shared grid.
 *
 * Player 1 (green snake): WASD to move, Z X C V to answer
 * Player 2 (cyan snake) : Arrows to move, 1 2 3 4 to answer
 *
 * Rules:
 *  - Shared 20×20 grid with a single "?" food cell
 *  - The snake that eats the food first gets the question
 *  - The other snake keeps moving freely while the question is shown
 *  - Correct answer: eating snake grows +2 segments, food respawns for next question
 *  - Wrong answer: no growth, food respawns immediately (no score penalty)
 *  - Snake–snake collision: pass-through (no death, edu-friendly)
 *  - Self-collision: snake resets to start position (no hard game over)
 *  - Game ends after all questions are answered → score comparison
 *
 * State machine:
 *   INTRO → MOVING → QUESTION(whoAte) → FEEDBACK → MOVING → … → COMPLETE
 */

// ── Constants ─────────────────────────────────────────────────────────────────
const TICK_MS      = 200;   // movement tick (ms per cell)
const GRID_SIZE    = 20;

const DIR = { UP: 'UP', DOWN: 'DOWN', LEFT: 'LEFT', RIGHT: 'RIGHT' };

// ── Player configs ─────────────────────────────────────────────────────────────
const PLAYER_CFGS = [
  { label: 'P1', headColor: '#4ade80', bodyColor: '#16a34a', glowColor: '#86efac', nameColor: '#86efac', startCol: 5,  startRow: 10, startDir: DIR.RIGHT, ansHint: 'Z X C V' },
  { label: 'P2', headColor: '#f472b6', bodyColor: '#be185d', glowColor: '#fbcfe8', nameColor: '#f9a8d4', startCol: 14, startRow: 10, startDir: DIR.LEFT,  ansHint: '1 2 3 4' },
];

// ── Theme ─────────────────────────────────────────────────────────────────────
const THEME = {
  bgTop:      '#0d0b2e',
  bgMid:      '#130d3a',
  bgBot:      '#180a40',
  gridLine:   'rgba(139,92,246,0.10)',
  gridBorder: 'rgba(139,92,246,0.55)',
  food:       '#fbbf24',
  foodGlow:   '#f59e0b',
  text:       '#e2e8f0',
  purple:     '#8b5cf6',
  blue:       '#3b82f6',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function easeOut(t) { return 1 - (1 - t) * (1 - t); }

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function makeSnake(cfg) {
  return [
    { col: cfg.startCol,     row: cfg.startRow },
    { col: cfg.startCol - (cfg.startDir === DIR.RIGHT ? 1 : -1), row: cfg.startRow },
    { col: cfg.startCol - (cfg.startDir === DIR.RIGHT ? 2 : -2), row: cfg.startRow },
  ];
}

// ── SnakeDuelGame ─────────────────────────────────────────────────────────────
export class SnakeDuelGame {
  /**
   * @param {{
   *   playable: any;
   *   settings: any;
   *   canvas: HTMLCanvasElement;
   *   keyboard: import('./dual-keyboard-input.js').DualKeyboardInput;
   * }} params
   */
  constructor({ playable, settings, canvas, keyboard }) {
    this.playable  = playable;
    this.canvas    = canvas;
    this.dual      = keyboard; // DualKeyboardInput

    this.gridSize  = GRID_SIZE;
    this.questions = [...(playable.questions ?? [])];
    this.tickMs    = TICK_MS;

    // State machine
    this.state      = 'INTRO';
    this.stateAtMs  = performance.now();

    // Per-player state
    this.snakes = PLAYER_CFGS.map(cfg => ({
      cfg,
      body:      makeSnake(cfg),
      dir:       cfg.startDir,
      nextDir:   cfg.startDir,
      growQueue: 0,
      score:     0,
      isAnswer:  false,   // currently answering this frame
    }));

    // Question state
    this.questionIndex   = 0;
    this.whichAte        = -1;   // player index who ate food this round
    this.selectedChoiceId = null;
    this.feedbackCorrect = null;

    // Food
    this.food  = null; // {col, row}
    this.foodPulse = 0;

    // Tick
    this._lastTickMs   = null;
    this._lastFrameMs  = null;

    // Effects
    this.particles = []; // confetti
    this.flashes   = []; // eating flash {col, row, life, color}

    this.completedAtMs = null;
  }

  isComplete()       { return this.completedAtMs != null; }
  getCompletedAtMs() { return this.completedAtMs; }
  getResult() {
    const total   = this.questions.length;
    const correct = this.snakes[0].score + this.snakes[1].score;
    return { correct, total };
  }

  // ── Update ────────────────────────────────────────────────────────────────
  update({ nowMs }) {
    const dt = Math.min(32, nowMs - (this._lastFrameMs ?? nowMs));
    this._lastFrameMs = nowMs;

    switch (this.state) {
      case 'INTRO':    this._updateIntro(nowMs);          break;
      case 'MOVING':   this._updateMoving(dt, nowMs);     break;
      case 'QUESTION': this._updateQuestion(dt, nowMs);   break;
      case 'FEEDBACK': this._updateFeedback(nowMs);       break;
      case 'COMPLETE': this._updateComplete(dt, nowMs);   break;
    }

    // Flash effects
    for (const f of this.flashes) f.life -= dt;
    this.flashes = this.flashes.filter(f => f.life > 0);

    this.dual.resetFrame();
  }

  _updateIntro(nowMs) {
    if (nowMs - this.stateAtMs >= 2800) {
      this._placeFood();
      this._lastTickMs = nowMs;
      this._setState('MOVING', nowMs);
    }
  }

  _updateMoving(dt, nowMs) {
    // Direction input for both snakes
    for (let pi = 0; pi < 2; pi++) {
      const sn = this.snakes[pi];
      const kb = pi === 0 ? this.dual.player1 : this.dual.player2;
      if (kb.justPressed('left')  && sn.dir !== DIR.RIGHT) sn.nextDir = DIR.LEFT;
      if (kb.justPressed('right') && sn.dir !== DIR.LEFT)  sn.nextDir = DIR.RIGHT;
      if (kb.justPressed('up')    && sn.dir !== DIR.DOWN)  sn.nextDir = DIR.UP;
      if (kb.justPressed('down')  && sn.dir !== DIR.UP)    sn.nextDir = DIR.DOWN;
    }

    this.foodPulse = (nowMs * 0.004) % (Math.PI * 2);

    // Tick
    if (this._lastTickMs == null) this._lastTickMs = nowMs;
    if (nowMs - this._lastTickMs >= this.tickMs) {
      this._lastTickMs = nowMs;
      this._tickMovement(nowMs);
    }
  }

  _tickMovement(nowMs) {
    // Move both snakes and check who eats food
    let eater = -1;

    for (let pi = 0; pi < 2; pi++) {
      const sn   = this.snakes[pi];
      sn.dir     = sn.nextDir;
      const head = sn.body[0];
      let nc = head.col, nr = head.row;

      if (sn.dir === DIR.LEFT)  nc--;
      if (sn.dir === DIR.RIGHT) nc++;
      if (sn.dir === DIR.UP)    nr--;
      if (sn.dir === DIR.DOWN)  nr++;

      // Wall wrap
      nc = ((nc % this.gridSize) + this.gridSize) % this.gridSize;
      nr = ((nr % this.gridSize) + this.gridSize) % this.gridSize;

      // Self-collision: reset this snake
      if (sn.body.some(s => s.col === nc && s.row === nr)) {
        this._resetSnake(pi);
        continue;
      }

      // Move
      sn.body.unshift({ col: nc, row: nr });
      if (sn.growQueue > 0) {
        sn.growQueue--;
      } else {
        sn.body.pop();
      }

      // Food eat check — first snake to reach the food wins the question
      if (this.food && nc === this.food.col && nr === this.food.row && eater === -1) {
        eater = pi;
        // flash
        this.flashes.push({ col: nc, row: nr, life: 400, color: PLAYER_CFGS[pi].glowColor });
      }
    }

    if (eater !== -1) {
      this.whichAte = eater;
      this._setState('QUESTION', nowMs);
    }
  }

  _updateQuestion(dt, nowMs) {
    // Non-answering snake keeps moving
    const otherPi = this.whichAte === 0 ? 1 : 0;
    const otherSn = this.snakes[otherPi];
    const otherKb = otherPi === 0 ? this.dual.player1 : this.dual.player2;

    if (otherKb.justPressed('left')  && otherSn.dir !== DIR.RIGHT) otherSn.nextDir = DIR.LEFT;
    if (otherKb.justPressed('right') && otherSn.dir !== DIR.LEFT)  otherSn.nextDir = DIR.RIGHT;
    if (otherKb.justPressed('up')    && otherSn.dir !== DIR.DOWN)  otherSn.nextDir = DIR.UP;
    if (otherKb.justPressed('down')  && otherSn.dir !== DIR.UP)    otherSn.nextDir = DIR.DOWN;

    if (this._lastTickMs == null) this._lastTickMs = nowMs;
    if (nowMs - this._lastTickMs >= this.tickMs) {
      this._lastTickMs = nowMs;
      this._tickSingleSnake(otherPi, nowMs);
    }

    // Answering snake processes keys
    const q  = this.questions[this.questionIndex];
    if (!q) {
      this.whichAte = -1;
      this._placeFood();
      this._setState('MOVING', nowMs);
      return;
    }
    const eatKb = this.whichAte === 0 ? this.dual.player1 : this.dual.player2;
    const eatKbAlt = this.whichAte === 0 ? this.dual.player2 : null;
    const KEYS  = ['ans1', 'ans2', 'ans3', 'ans4'];
    for (let ki = 0; ki < KEYS.length; ki++) {
      const pressedPrimary = eatKb.justPressed(KEYS[ki]);
      const pressedAlt = eatKbAlt ? eatKbAlt.justPressed(KEYS[ki]) : false;
      if (pressedPrimary || pressedAlt) {
        const choice = q.choices[ki];
        if (!choice) break;
        this.selectedChoiceId = choice.id;
        this.feedbackCorrect  = choice.id === q.correctChoiceId;
        if (this.feedbackCorrect) {
          this.snakes[this.whichAte].score++;
          this.snakes[this.whichAte].growQueue += 2;
        }
        this._setState('FEEDBACK', nowMs);
        break;
      }
    }

    // 8-second timeout
    if (nowMs - this.stateAtMs >= 8000 && !this.selectedChoiceId) {
      this.selectedChoiceId = null;
      this.feedbackCorrect  = false;
      this._setState('FEEDBACK', nowMs);
    }
  }

  _tickSingleSnake(pi, nowMs) {
    const sn   = this.snakes[pi];
    sn.dir     = sn.nextDir;
    const head = sn.body[0];
    let nc = head.col, nr = head.row;

    if (sn.dir === DIR.LEFT)  nc--;
    if (sn.dir === DIR.RIGHT) nc++;
    if (sn.dir === DIR.UP)    nr--;
    if (sn.dir === DIR.DOWN)  nr++;

    nc = ((nc % this.gridSize) + this.gridSize) % this.gridSize;
    nr = ((nr % this.gridSize) + this.gridSize) % this.gridSize;

    if (sn.body.some(s => s.col === nc && s.row === nr)) {
      this._resetSnake(pi); return;
    }

    sn.body.unshift({ col: nc, row: nr });
    if (sn.growQueue > 0) sn.growQueue--;
    else sn.body.pop();
  }

  _updateFeedback(nowMs) {
    if (nowMs - this.stateAtMs < 1500) return;
    this.questionIndex++;
    this.selectedChoiceId = null;
    this.feedbackCorrect  = null;
    this.whichAte         = -1;
    if (this.questionIndex >= this.questions.length) {
      this._setState('COMPLETE', nowMs);
      this._spawnConfetti();
    } else {
      this._placeFood();
      this._lastTickMs = nowMs;
      this._setState('MOVING', nowMs);
    }
  }

  _updateComplete(dt, nowMs) {
    for (const p of this.particles) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vy += 0.0005 * dt;
      p.rot += p.rotV * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter(p => p.life > 0);
    if (nowMs - this.stateAtMs >= 3500 && this.completedAtMs == null) {
      this.completedAtMs = nowMs;
    }
  }

  _setState(s, nowMs) { this.state = s; this.stateAtMs = nowMs; }

  _resetSnake(pi) {
    const cfg          = PLAYER_CFGS[pi];
    this.snakes[pi].body      = makeSnake(cfg);
    this.snakes[pi].dir       = cfg.startDir;
    this.snakes[pi].nextDir   = cfg.startDir;
    this.snakes[pi].growQueue = 0;
  }

  _placeFood() {
    const allBodies = this.snakes.flatMap(sn => sn.body);
    let col, row, attempts = 0;
    do {
      col = Math.floor(Math.random() * this.gridSize);
      row = Math.floor(Math.random() * this.gridSize);
      attempts++;
    } while (attempts < 300 && allBodies.some(s => s.col === col && s.row === row));
    this.food = { col, row };
  }

  _spawnConfetti() {
    const colors = ['#f59e0b','#ef4444','#3b82f6','#10b981','#8b5cf6','#ec4899','#fff'];
    for (let i = 0; i < 90; i++) {
      this.particles.push({
        x: Math.random(), y: Math.random() * 0.4,
        vx: (Math.random() - 0.5) * 0.0005,
        vy: Math.random() * 0.0003 + 0.0001,
        rot: Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 0.012,
        size: 0.008 + Math.random() * 0.010,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 2500 + Math.random() * 1500,
      });
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  render({ ctx, nowMs }) {
    const W = this.canvas.width;
    const H = this.canvas.height;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Background — deep purple-indigo gradient
    const bgGrad = ctx.createLinearGradient(0, 0, W * 0.5, H);
    bgGrad.addColorStop(0, THEME.bgTop);
    bgGrad.addColorStop(0.5, THEME.bgMid);
    bgGrad.addColorStop(1, THEME.bgBot);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // Radial vignette
    const vign = ctx.createRadialGradient(W / 2, H / 2, H * 0.12, W / 2, H / 2, H * 0.85);
    vign.addColorStop(0, 'rgba(0,0,0,0)');
    vign.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vign;
    ctx.fillRect(0, 0, W, H);

    // Compute grid layout (centered square)
    const hud        = H * 0.10;
    const hint       = H * 0.05;
    const available  = Math.min(W, H - hud - hint) * 0.94;
    const cellSize   = available / this.gridSize;
    const gridW      = cellSize * this.gridSize;
    const gridH      = gridW;
    const gridX      = (W - gridW) / 2;
    const gridY      = hud + (H - hud - hint - gridH) / 2;

    const gCtx = { cellSize, gridX, gridY };

    this._drawGrid(ctx, gCtx, W, H);
    this._drawFlashes(ctx, gCtx, nowMs);
    this._drawFood(ctx, gCtx, nowMs);
    for (let pi = 0; pi < 2; pi++) this._drawSnake(ctx, gCtx, pi);
    this._drawHUD(ctx, W, H);

    if (this.state === 'INTRO')    this._drawIntro(ctx, W, H, nowMs);
    if (this.state === 'QUESTION') this._drawQuestion(ctx, W, H);
    if (this.state === 'FEEDBACK') this._drawFeedback(ctx, W, H);
    if (this.state === 'COMPLETE') this._drawComplete(ctx, W, H, nowMs);

    if (this.state === 'MOVING' || this.state === 'QUESTION') {
      this._drawControlsHint(ctx, W, H, gridY + gridH);
    }

    ctx.restore();
  }

  _drawGrid(ctx, { cellSize, gridX, gridY }, W, H) {
    const gW = cellSize * this.gridSize;
    const gH = cellSize * this.gridSize;

    // Inner background tint
    const innerGrad = ctx.createLinearGradient(gridX, gridY, gridX + gW, gridY + gH);
    innerGrad.addColorStop(0, 'rgba(139,92,246,0.05)');
    innerGrad.addColorStop(1, 'rgba(59,130,246,0.04)');
    ctx.fillStyle = innerGrad;
    ctx.fillRect(gridX, gridY, gW, gH);

    // Grid lines
    ctx.strokeStyle = THEME.gridLine;
    ctx.lineWidth   = 0.5;
    for (let c = 0; c <= this.gridSize; c++) {
      ctx.beginPath(); ctx.moveTo(gridX + c * cellSize, gridY); ctx.lineTo(gridX + c * cellSize, gridY + gH); ctx.stroke();
    }
    for (let r = 0; r <= this.gridSize; r++) {
      ctx.beginPath(); ctx.moveTo(gridX, gridY + r * cellSize); ctx.lineTo(gridX + gW, gridY + r * cellSize); ctx.stroke();
    }

    // Glowing border
    ctx.save();
    ctx.shadowColor = THEME.purple;
    ctx.shadowBlur  = 22;
    ctx.strokeStyle = THEME.gridBorder;
    ctx.lineWidth   = 2;
    roundRect(ctx, gridX, gridY, gW, gH, 3);
    ctx.stroke();
    ctx.restore();
  }

  _drawFlashes(ctx, { cellSize, gridX, gridY }, nowMs) {
    for (const f of this.flashes) {
      const alpha = clamp(f.life / 400, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = f.color;
      ctx.shadowColor = f.color;
      ctx.shadowBlur  = 20;
      ctx.fillRect(gridX + f.col * cellSize, gridY + f.row * cellSize, cellSize, cellSize);
      ctx.restore();
    }
  }

  _drawFood(ctx, { cellSize, gridX, gridY }, nowMs) {
    if (!this.food) return;
    const fx = gridX + this.food.col * cellSize + cellSize / 2;
    const fy = gridY + this.food.row * cellSize + cellSize / 2;
    const pulse = 0.85 + 0.15 * Math.sin(this.foodPulse);
    const r = cellSize * 0.38 * pulse;

    ctx.save();
    ctx.shadowColor = THEME.foodGlow;
    ctx.shadowBlur  = 12;
    ctx.fillStyle   = THEME.food;
    ctx.beginPath(); ctx.arc(fx, fy, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle   = '#1e1b4b';
    ctx.font        = `700 ${r * 1.1}px system-ui`;
    ctx.textAlign   = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowBlur  = 0;
    ctx.fillText('?', fx, fy);
    ctx.restore();
  }

  _drawSnake(ctx, { cellSize, gridX, gridY }, pi) {
    const sn    = this.snakes[pi];
    const cfg   = PLAYER_CFGS[pi];
    const r     = Math.max(2, cellSize * 0.14);
    const total = sn.body.length;

    for (let i = sn.body.length - 1; i >= 0; i--) {
      const seg    = sn.body[i];
      const sx     = gridX + seg.col * cellSize;
      const sy     = gridY + seg.row * cellSize;
      const pad    = cellSize * 0.07;
      const isHead = i === 0;
      const t      = total > 1 ? i / (total - 1) : 0; // 0=head, 1=tail

      ctx.save();
      ctx.globalAlpha = isHead ? 1 : Math.max(0.50, 1 - t * 0.50);
      if (isHead) {
        ctx.shadowColor = cfg.glowColor;
        ctx.shadowBlur  = 16;
      }
      ctx.fillStyle = isHead ? cfg.headColor : cfg.bodyColor;
      roundRect(ctx, sx + pad, sy + pad, cellSize - pad * 2, cellSize - pad * 2, r);
      ctx.fill();

      // Sheen highlight on every segment
      ctx.globalAlpha *= 0.30;
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, sx + pad, sy + pad, cellSize - pad * 2, (cellSize - pad * 2) * 0.40, r);
      ctx.fill();

      if (isHead) {
        ctx.globalAlpha = 1;
        ctx.shadowBlur  = 0;
        // Eyes
        const eyeR   = cellSize * 0.09;
        const eyeOX  = cellSize * 0.22, eyeOY = cellSize * 0.26;
        const hcX    = sx + cellSize / 2, hcY = sy + cellSize / 2;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(hcX - eyeOX, hcY - eyeOY + cellSize * 0.06, eyeR, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(hcX + eyeOX, hcY - eyeOY + cellSize * 0.06, eyeR, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.arc(hcX - eyeOX + 1, hcY - eyeOY + cellSize * 0.06, eyeR * 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(hcX + eyeOX + 1, hcY - eyeOY + cellSize * 0.06, eyeR * 0.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
  }

  _drawHUD(ctx, W, H) {
    const hudH = H * 0.10;

    // Background
    const hudGrad = ctx.createLinearGradient(0, 0, 0, hudH);
    hudGrad.addColorStop(0, 'rgba(13,11,46,0.98)');
    hudGrad.addColorStop(1, 'rgba(13,11,46,0.82)');
    ctx.fillStyle = hudGrad;
    ctx.fillRect(0, 0, W, hudH);

    // Bottom separator gradient line
    const sep = ctx.createLinearGradient(0, 0, W, 0);
    sep.addColorStop(0,    'rgba(139,92,246,0)');
    sep.addColorStop(0.25, 'rgba(139,92,246,0.9)');
    sep.addColorStop(0.75, 'rgba(59,130,246,0.9)');
    sep.addColorStop(1,    'rgba(59,130,246,0)');
    ctx.fillStyle = sep;
    ctx.fillRect(0, hudH - 2, W, 2);

    const cardW = W * 0.26, cardH = hudH * 0.74, cardY = hudH * 0.13, cr = 10;
    const barY  = cardY + cardH * 0.32, barH2 = cardH * 0.18, barMaxW = cardW * 0.38;

    // ── P1 card ────────────────────────────────────────────
    const p1X = W * 0.012;
    ctx.save();
    ctx.fillStyle   = 'rgba(74,222,128,0.10)';
    roundRect(ctx, p1X, cardY, cardW, cardH, cr); ctx.fill();
    ctx.strokeStyle = 'rgba(74,222,128,0.50)';
    ctx.lineWidth   = 1.5;
    roundRect(ctx, p1X, cardY, cardW, cardH, cr); ctx.stroke();
    ctx.restore();

    ctx.fillStyle    = PLAYER_CFGS[0].nameColor;
    ctx.font         = `700 ${W * 0.015}px system-ui`;
    ctx.textAlign    = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('🐍 P1  WASD', p1X + cardW * 0.06, cardY + cardH * 0.32);
    ctx.fillStyle = '#fff';
    ctx.font      = `800 ${W * 0.030}px system-ui`;
    ctx.fillText(`${this.snakes[0].score}`, p1X + cardW * 0.06, cardY + cardH * 0.70);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font      = `400 ${W * 0.012}px system-ui`;
    ctx.fillText('điểm', p1X + cardW * 0.06 + W * 0.022, cardY + cardH * 0.72);

    const p1Fr  = Math.min(this.snakes[0].body.length / 25, 1);
    const barX1 = p1X + cardW * 0.56;
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    roundRect(ctx, barX1, barY - barH2 / 2, barMaxW, barH2, barH2 / 2); ctx.fill();
    if (p1Fr > 0) {
      ctx.fillStyle = PLAYER_CFGS[0].headColor;
      roundRect(ctx, barX1, barY - barH2 / 2, barMaxW * p1Fr, barH2, barH2 / 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.38)'; ctx.font = `400 ${W * 0.010}px system-ui`;
    ctx.textAlign = 'left';
    ctx.fillText(`${this.snakes[0].body.length} ô`, barX1, cardY + cardH * 0.76);

    // ── P2 card ────────────────────────────────────────────
    const p2X = W - W * 0.012 - cardW;
    ctx.save();
    ctx.fillStyle   = 'rgba(244,114,182,0.10)';
    roundRect(ctx, p2X, cardY, cardW, cardH, cr); ctx.fill();
    ctx.strokeStyle = 'rgba(244,114,182,0.50)';
    ctx.lineWidth   = 1.5;
    roundRect(ctx, p2X, cardY, cardW, cardH, cr); ctx.stroke();
    ctx.restore();

    ctx.fillStyle    = PLAYER_CFGS[1].nameColor;
    ctx.font         = `700 ${W * 0.015}px system-ui`;
    ctx.textAlign    = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText('Arrows  P2 🐍', p2X + cardW * 0.94, cardY + cardH * 0.32);
    ctx.fillStyle = '#fff';
    ctx.font      = `800 ${W * 0.030}px system-ui`;
    ctx.fillText(`${this.snakes[1].score}`, p2X + cardW * 0.94, cardY + cardH * 0.70);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font      = `400 ${W * 0.012}px system-ui`;
    ctx.fillText('điểm', p2X + cardW * 0.94 - W * 0.022, cardY + cardH * 0.72);

    const p2Fr  = Math.min(this.snakes[1].body.length / 25, 1);
    const barX2 = p2X + cardW * 0.06;
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    roundRect(ctx, barX2, barY - barH2 / 2, barMaxW, barH2, barH2 / 2); ctx.fill();
    if (p2Fr > 0) {
      ctx.fillStyle = PLAYER_CFGS[1].headColor;
      roundRect(ctx, barX2 + barMaxW * (1 - p2Fr), barY - barH2 / 2, barMaxW * p2Fr, barH2, barH2 / 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.38)'; ctx.font = `400 ${W * 0.010}px system-ui`;
    ctx.textAlign = 'right';
    ctx.fillText(`${this.snakes[1].body.length} ô`, barX2 + barMaxW, cardY + cardH * 0.76);

    // ── Progress dots (center) ─────────────────────────────
    const tot    = this.questions.length;
    const dotR   = Math.min(W * 0.008, 7);
    const dotY   = hudH * 0.44;
    const dotSp  = dotR * 3.2;
    const startX = W / 2 - (tot - 1) * dotSp / 2;
    for (let i = 0; i < tot; i++) {
      ctx.save();
      const isCur = i === this.questionIndex;
      if (isCur) { ctx.shadowColor = THEME.food; ctx.shadowBlur = 10; }
      ctx.beginPath();
      ctx.arc(startX + i * dotSp, dotY, isCur ? dotR * 1.4 : dotR, 0, Math.PI * 2);
      ctx.fillStyle = i < this.questionIndex ? '#10b981'
        : i === this.questionIndex ? THEME.food
        : 'rgba(255,255,255,0.22)';
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle    = 'rgba(255,255,255,0.40)';
    ctx.font         = `400 ${W * 0.011}px system-ui`;
    ctx.textAlign    = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(`Câu ${Math.min(this.questionIndex + 1, tot)} / ${tot}`, W / 2, hudH * 0.68);
  }

  _drawControlsHint(ctx, W, H, bottomY) {
    const isQuestion = this.state === 'QUESTION';
    const eatCfg     = this.whichAte >= 0 ? PLAYER_CFGS[this.whichAte] : null;

    const hintH = H * 0.040;
    const hintY = bottomY + (H - bottomY - hintH) / 2;
    const pillW = W * 0.72, pillX = (W - pillW) / 2;

    ctx.save();
    ctx.fillStyle   = 'rgba(255,255,255,0.06)';
    roundRect(ctx, pillX, hintY, pillW, hintH, hintH / 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth   = 1;
    roundRect(ctx, pillX, hintY, pillW, hintH, hintH / 2); ctx.stroke();
    ctx.restore();

    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = `500 ${W * 0.013}px system-ui`;
    if (isQuestion && eatCfg) {
      ctx.fillStyle = eatCfg.nameColor;
      ctx.fillText(`🐍 ${eatCfg.label} trả lời bằng [${eatCfg.ansHint}]  •  Rắn kia vẫn đang di chuyển!`, W / 2, hintY + hintH / 2);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.48)';
      ctx.fillText('P1: WASD di chuyển   •   P2: Arrows di chuyển   •   Ai ăn ❓ trước được quyền trả lời!', W / 2, hintY + hintH / 2);
    }
  }

  _drawIntro(ctx, W, H, nowMs) {
    const progress = clamp((nowMs - this.stateAtMs) / 2800, 0, 1);
    const fadeOut  = 1 - easeOut(Math.max(0, (progress - 0.82) / 0.18));
    const overlayA = progress < 0.82 ? 1 : fadeOut;
    ctx.fillStyle = `rgba(0,0,0,${0.75 * overlayA})`;
    ctx.fillRect(0, 0, W, H);

    const a = Math.min(1, progress * 2.5) * overlayA;

    // Title with glow
    ctx.save();
    ctx.shadowColor = '#8b5cf6'; ctx.shadowBlur = 35;
    ctx.fillStyle   = `rgba(255,255,255,${a})`;
    ctx.font        = `800 ${W * 0.054}px system-ui`;
    ctx.textAlign   = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🐍 Snake Duel', W / 2, H * 0.24);
    ctx.restore();

    ctx.fillStyle = `rgba(139,92,246,${a})`;
    ctx.font      = `600 ${W * 0.021}px system-ui`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('2 NGƯỜI CHƠI', W / 2, H * 0.34);

    // Divider line
    const dg = ctx.createLinearGradient(W * 0.20, 0, W * 0.80, 0);
    dg.addColorStop(0, 'rgba(139,92,246,0)');
    dg.addColorStop(0.5, `rgba(139,92,246,${a * 0.9})`);
    dg.addColorStop(1, 'rgba(139,92,246,0)');
    ctx.fillStyle = dg;
    ctx.fillRect(W * 0.20, H * 0.39, W * 0.60, 1.5);

    // Info rows
    const rows = [
      { label: 'P1 (xanh lá)', desc: 'WASD di chuyển',             color: PLAYER_CFGS[0].nameColor },
      { label: 'P2 (hồng)',    desc: 'Arrows di chuyển',            color: PLAYER_CFGS[1].nameColor },
      { label: 'Rắn ăn ❓',   desc: 'Được quyền trả lời',          color: '#fbbf24' },
      { label: 'Trả lời đúng', desc: 'Rắn dài +2 ô & +1 điểm',      color: '#4ade80' },
    ];
    rows.forEach(({ label, desc, color }, idx) => {
      const ly = H * 0.455 + idx * H * 0.072;
      ctx.globalAlpha = a;
      ctx.font = `400 ${W * 0.016}px system-ui`;
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillText(label, W / 2 - W * 0.018, ly);
      ctx.font = `600 ${W * 0.016}px system-ui`;
      ctx.textAlign = 'left';
      ctx.fillStyle = color;
      ctx.fillText(desc, W / 2 + W * 0.018, ly);
    });
    ctx.globalAlpha = 1;
  }

  _drawQuestion(ctx, W, H) {
    const q = this.questions[this.questionIndex];
    if (!q) return;
    this._drawQuestionCard(ctx, W, H, q, null, null);
  }

  _drawFeedback(ctx, W, H) {
    const q = this.questions[this.questionIndex] ?? this.questions[this.questionIndex - 1];
    if (!q) return;
    this._drawQuestionCard(ctx, W, H, q, this.selectedChoiceId, this.feedbackCorrect);
  }

  _drawQuestionCard(ctx, W, H, q, selectedId, isCorrect) {
    // Overlay
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, W, H);

    const cW = W * 0.84, cH = H * 0.82, cX = (W - cW) / 2, cY = (H - cH) / 2;
    const cr = 22;

    // Card shadow
    ctx.save();
    ctx.shadowColor = 'rgba(139,92,246,0.55)'; ctx.shadowBlur = 55;
    ctx.fillStyle   = '#130d3a';
    roundRect(ctx, cX, cY, cW, cH, cr); ctx.fill();
    ctx.restore();

    // Card body
    const cardGrad = ctx.createLinearGradient(cX, cY, cX + cW, cY + cH);
    cardGrad.addColorStop(0, '#130d3a'); cardGrad.addColorStop(1, '#0d1848');
    ctx.fillStyle = cardGrad;
    roundRect(ctx, cX, cY, cW, cH, cr); ctx.fill();

    // Card border
    const brdGrad = ctx.createLinearGradient(cX, cY, cX + cW, cY + cH);
    brdGrad.addColorStop(0, 'rgba(139,92,246,0.75)'); brdGrad.addColorStop(1, 'rgba(59,130,246,0.75)');
    ctx.strokeStyle = brdGrad; ctx.lineWidth = 2;
    roundRect(ctx, cX, cY, cW, cH, cr); ctx.stroke();

    // Header band
    const headerH = cH * 0.13;
    const eatCfg  = this.whichAte >= 0 ? PLAYER_CFGS[this.whichAte] : null;
    if (eatCfg) {
      const hGrad = ctx.createLinearGradient(cX, cY, cX + cW * 0.6, cY);
      hGrad.addColorStop(0, `rgba(${this.whichAte === 0 ? '74,222,128' : '244,114,182'},0.28)`);
      hGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cX + cr, cY); ctx.lineTo(cX + cW - cr, cY);
      ctx.arcTo(cX + cW, cY, cX + cW, cY + cr, cr);
      ctx.lineTo(cX + cW, cY + headerH); ctx.lineTo(cX, cY + headerH);
      ctx.arcTo(cX, cY, cX + cr, cY, cr); ctx.closePath();
      ctx.fillStyle = hGrad; ctx.fill();
      ctx.restore();

      ctx.fillStyle = eatCfg.nameColor;
      ctx.font      = `700 ${W * 0.016}px system-ui`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(`🐍 ${eatCfg.label} ăn được food!   Trả lời bằng [${eatCfg.ansHint}]`, W / 2, cY + headerH * 0.5);
    }

    // Question number pill
    const qNumText  = `Câu ${this.questionIndex + 1} / ${this.questions.length}`;
    const pillFs    = W * 0.013;
    ctx.font        = `600 ${pillFs}px system-ui`;
    const pillTW    = ctx.measureText(qNumText).width + 22;
    const pillH     = pillFs * 1.8;
    const pillX     = W / 2 - pillTW / 2, pillY = cY + headerH + cH * 0.035;
    ctx.fillStyle   = 'rgba(139,92,246,0.22)';
    roundRect(ctx, pillX, pillY, pillTW, pillH, pillH / 2); ctx.fill();
    ctx.strokeStyle = 'rgba(139,92,246,0.55)'; ctx.lineWidth = 1;
    roundRect(ctx, pillX, pillY, pillTW, pillH, pillH / 2); ctx.stroke();
    ctx.fillStyle   = '#a5b4fc'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(qNumText, W / 2, pillY + pillH / 2);

    // Question text
    const qFs    = W * 0.022;
    ctx.font     = `600 ${qFs}px system-ui`;
    ctx.fillStyle = '#f1f5f9'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const qLines = this._wrapText(ctx, q.prompt, cW * 0.84);
    const qLineH = qFs * 1.55;
    const qTextY = cY + headerH + cH * 0.15;
    for (let i = 0; i < Math.min(qLines.length, 3); i++) {
      ctx.fillText(qLines[i], W / 2, qTextY + i * qLineH);
    }

    // Timer bar (only when waiting for answer)
    if (selectedId == null) {
      const elapsed    = Math.min(performance.now() - this.stateAtMs, 8000);
      const timerFrac  = 1 - elapsed / 8000;
      const tbW = cW * 0.78, tbH = 5, tbX = cX + (cW - tbW) / 2;
      const tbY = cY + headerH + cH * 0.35;
      ctx.fillStyle = 'rgba(255,255,255,0.11)';
      roundRect(ctx, tbX, tbY, tbW, tbH, tbH / 2); ctx.fill();
      const tc = timerFrac > 0.5 ? '#10b981' : timerFrac > 0.25 ? '#f59e0b' : '#ef4444';
      ctx.save();
      ctx.shadowColor = tc; ctx.shadowBlur = 7;
      ctx.fillStyle   = tc;
      roundRect(ctx, tbX, tbY, tbW * timerFrac, tbH, tbH / 2); ctx.fill();
      ctx.restore();
    }

    // Choice buttons
    const cols = 2;
    const choW = cW * 0.44, choH = cH * 0.135;
    const gapX = cW * 0.04, gapY = cH * 0.024;
    const sX   = cX + (cW - cols * choW - (cols - 1) * gapX) / 2;
    const sY   = cY + headerH + cH * 0.39;
    const p1Keys = ['Z', 'X', 'C', 'V'];
    const p2Keys = ['1', '2', '3', '4'];
    const cFs    = W * 0.015;

    q.choices.forEach((c, idx) => {
      const col = idx % cols, row = Math.floor(idx / cols);
      const cx  = sX + col * (choW + gapX);
      const cy  = sY + row * (choH + gapY);

      let bgColor = 'rgba(255,255,255,0.06)', borderColor = 'rgba(255,255,255,0.18)', textColor = '#cbd5e1';
      if (selectedId != null) {
        if (c.id === q.correctChoiceId)             { bgColor = 'rgba(16,185,129,0.22)'; borderColor = '#10b981'; textColor = '#d1fae5'; }
        if (c.id === selectedId && !isCorrect)      { bgColor = 'rgba(239,68,68,0.22)';  borderColor = '#ef4444'; textColor = '#fee2e2'; }
      }

      ctx.save();
      if (selectedId == null) { ctx.shadowColor = 'rgba(139,92,246,0.25)'; ctx.shadowBlur = 8; }
      ctx.fillStyle = bgColor;
      roundRect(ctx, cx, cy, choW, choH, 12); ctx.fill();
      ctx.shadowBlur  = 0;
      ctx.strokeStyle = borderColor; ctx.lineWidth = 1.5;
      roundRect(ctx, cx, cy, choW, choH, 12); ctx.stroke();
      ctx.restore();

      // Key badge
      const bSz  = Math.min(choH * 0.52, W * 0.027);
      const bX   = cx + 10, bY = cy + (choH - bSz) / 2;
      const bGrd = ctx.createLinearGradient(bX, bY, bX, bY + bSz);
      bGrd.addColorStop(0, '#7c3aed'); bGrd.addColorStop(1, '#5b21b6');
      ctx.fillStyle = bGrd;
      roundRect(ctx, bX, bY, bSz, bSz, 6); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = `700 ${bSz * 0.5}px system-ui`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const keyLabel = this.whichAte === 1 ? p2Keys[idx] : p1Keys[idx];
      ctx.fillText(keyLabel, bX + bSz / 2, bY + bSz / 2);

      // Choice text
      const tX     = cx + bSz + 16;
      const tAreaW = choW - bSz - 24;
      ctx.fillStyle = textColor; ctx.font = `500 ${cFs}px system-ui`;
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      const cLines = this._wrapText(ctx, c.text, tAreaW);
      const cLH    = cFs * 1.4;
      const totTH  = Math.min(cLines.length, 2) * cLH;
      const stY    = cy + choH / 2 - totTH / 2 + cLH / 2;
      for (let li = 0; li < Math.min(cLines.length, 2); li++) ctx.fillText(cLines[li], tX, stY + li * cLH);

      // Correct tick
      if (selectedId != null && c.id === q.correctChoiceId) {
        ctx.fillStyle = '#10b981'; ctx.font = `bold ${choH * 0.44}px system-ui`;
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.fillText('✓', cx + choW - 12, cy + choH / 2);
      }
    });

    // Feedback banner at bottom of card
    if (selectedId != null) {
      const banH = cH * 0.095, banY = cY + cH - banH;
      const banGrd = ctx.createLinearGradient(cX, banY, cX + cW, banY);
      if (isCorrect) {
        banGrd.addColorStop(0, 'rgba(16,185,129,0)'); banGrd.addColorStop(0.35, 'rgba(16,185,129,0.32)'); banGrd.addColorStop(1, 'rgba(16,185,129,0)');
      } else {
        banGrd.addColorStop(0, 'rgba(239,68,68,0)'); banGrd.addColorStop(0.35, 'rgba(239,68,68,0.32)'); banGrd.addColorStop(1, 'rgba(239,68,68,0)');
      }
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cX, banY); ctx.lineTo(cX + cW, banY);
      ctx.lineTo(cX + cW, banY + banH - cr);
      ctx.arcTo(cX + cW, banY + banH, cX + cW - cr, banY + banH, cr);
      ctx.lineTo(cX + cr, banY + banH);
      ctx.arcTo(cX, banY + banH, cX, banY + banH - cr, cr);
      ctx.lineTo(cX, banY); ctx.closePath();
      ctx.fillStyle = banGrd; ctx.fill();
      ctx.restore();

      const mColor = isCorrect ? '#6ee7b7' : '#fca5a5';
      const msg    = isCorrect ? '✓  Chính xác! Rắn dài thêm 2 ô 🎉' : '✗  Chưa đúng — Food sẽ respawn ngay!';
      ctx.save();
      ctx.shadowColor = mColor; ctx.shadowBlur = 10;
      ctx.fillStyle   = mColor; ctx.font = `700 ${W * 0.019}px system-ui`;
      ctx.textAlign   = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(msg, W / 2, banY + banH / 2);
      ctx.restore();
    } else {
      ctx.fillStyle    = 'rgba(255,255,255,0.28)';
      ctx.font         = `400 ${W * 0.012}px system-ui`;
      ctx.textAlign    = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('Rắn còn lại vẫn di chuyển trong lúc này!', W / 2, cY + cH - cH * 0.048);
    }
  }

  _drawComplete(ctx, W, H, nowMs) {
    const elapsed = nowMs - this.stateAtMs;
    const alpha   = clamp(elapsed / 500, 0, 1);
    ctx.fillStyle = `rgba(0,0,0,${0.55 * alpha})`; ctx.fillRect(0, 0, W, H);

    // Confetti
    for (const pt of this.particles) {
      ctx.save(); ctx.translate(pt.x * W, pt.y * H); ctx.rotate(pt.rot);
      const s = pt.size * W; ctx.globalAlpha = clamp(pt.life / 1000, 0, 1);
      ctx.fillStyle = pt.color; ctx.fillRect(-s / 2, -s / 2, s, s * 0.6); ctx.restore();
    }

    const t  = easeOut(clamp(elapsed / 600, 0, 1));
    const vW = W * 0.72, vH = H * 0.72, vX = (W - vW) / 2;
    const vY = lerp(H, (H - vH) / 2, t);
    const vcr = 24;

    // Card shadow
    ctx.save();
    ctx.shadowColor = 'rgba(139,92,246,0.65)'; ctx.shadowBlur = 65;
    ctx.fillStyle = '#0d0b2e'; roundRect(ctx, vX, vY, vW, vH, vcr); ctx.fill();
    ctx.restore();

    // Card body gradient
    const cGrd = ctx.createLinearGradient(vX, vY, vX + vW, vY + vH);
    cGrd.addColorStop(0, '#130d3a'); cGrd.addColorStop(1, '#0d1848');
    ctx.fillStyle = cGrd; roundRect(ctx, vX, vY, vW, vH, vcr); ctx.fill();

    // Card border gold → purple
    const bGrd = ctx.createLinearGradient(vX, vY, vX + vW, vY + vH);
    bGrd.addColorStop(0, 'rgba(251,191,36,0.85)'); bGrd.addColorStop(1, 'rgba(139,92,246,0.85)');
    ctx.strokeStyle = bGrd; ctx.lineWidth = 2.5; roundRect(ctx, vX, vY, vW, vH, vcr); ctx.stroke();

    // Title
    ctx.save();
    ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 22;
    ctx.fillStyle = '#fbbf24'; ctx.font = `800 ${W * 0.038}px system-ui`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🏆 Kết quả Snake Duel', W / 2, vY + vH * 0.13);
    ctx.restore();

    // Divider
    const dg = ctx.createLinearGradient(vX + vW * 0.1, 0, vX + vW * 0.9, 0);
    dg.addColorStop(0, 'rgba(255,255,255,0)'); dg.addColorStop(0.5, 'rgba(255,255,255,0.2)'); dg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = dg; ctx.fillRect(vX + vW * 0.1, vY + vH * 0.215, vW * 0.8, 1.2);

    // Player score cards
    const drawScore = (cx, pi) => {
      const sn  = this.snakes[pi];
      const cfg = PLAYER_CFGS[pi];
      const scW = vW * 0.36, scH = vH * 0.47;
      const scX = cx - scW / 2, scY = vY + vH * 0.265;
      const isWinner = pi === 0 ? sn.score > this.snakes[1].score : sn.score > this.snakes[0].score;

      ctx.save();
      if (isWinner) { ctx.shadowColor = cfg.glowColor; ctx.shadowBlur = 20; }
      ctx.fillStyle = pi === 0 ? 'rgba(74,222,128,0.11)' : 'rgba(244,114,182,0.11)';
      roundRect(ctx, scX, scY, scW, scH, 16); ctx.fill();
      ctx.strokeStyle = isWinner
        ? (pi === 0 ? 'rgba(74,222,128,0.80)' : 'rgba(244,114,182,0.80)')
        : (pi === 0 ? 'rgba(74,222,128,0.40)' : 'rgba(244,114,182,0.40)');
      ctx.lineWidth = isWinner ? 2 : 1.5; roundRect(ctx, scX, scY, scW, scH, 16); ctx.stroke();
      ctx.restore();

      ctx.fillStyle = cfg.nameColor; ctx.font = `700 ${W * 0.022}px system-ui`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(`🐍 ${cfg.label}`, cx, scY + scH * 0.22);

      ctx.save();
      ctx.shadowColor = cfg.glowColor; ctx.shadowBlur = 14;
      ctx.fillStyle = '#fff'; ctx.font = `800 ${W * 0.058}px system-ui`;
      ctx.fillText(`${sn.score}`, cx, scY + scH * 0.50);
      ctx.restore();

      ctx.fillStyle = '#a5b4fc'; ctx.font = `${W * 0.016}px system-ui`;
      ctx.fillText(`/ ${this.questions.length} điểm`, cx, scY + scH * 0.67);
      ctx.fillStyle = 'rgba(255,255,255,0.38)'; ctx.font = `${W * 0.012}px system-ui`;
      ctx.fillText(`Độ dài: ${sn.body.length} ô`, cx, scY + scH * 0.82);
    };
    drawScore(vX + vW * 0.27, 0);
    drawScore(vX + vW * 0.73, 1);

    // VS divider
    ctx.fillStyle = 'rgba(255,255,255,0.20)'; ctx.font = `700 ${W * 0.020}px system-ui`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('VS', W / 2, vY + vH * 0.49);

    // Winner text
    const p1s = this.snakes[0].score, p2s = this.snakes[1].score;
    const winner = p1s > p2s ? '🥇 P1 Chiến Thắng!' : p2s > p1s ? '🥇 P2 Chiến Thắng!' : '🤝 Hòa Nhau!';
    const wColor = p1s > p2s ? PLAYER_CFGS[0].nameColor : p2s > p1s ? PLAYER_CFGS[1].nameColor : '#fbbf24';
    ctx.save();
    ctx.shadowColor = wColor; ctx.shadowBlur = 18;
    ctx.fillStyle = wColor; ctx.font = `800 ${W * 0.030}px system-ui`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(winner, W / 2, vY + vH * 0.88);
    ctx.restore();
  }

  // ── Util ──────────────────────────────────────────────────────────────────
  _wrapText(ctx, text, maxW) {
    const words = String(text || '').split(/\s+/); const lines = []; let line = '';
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
    }
    if (line) lines.push(line); return lines;
  }
}
