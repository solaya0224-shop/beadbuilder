/* ============================================
   swallowbirdcircle — bead customizer
   ============================================ */

// -------- Bead colors, sampled from the shop's actual bead tray photo --------
// x / y / w / h are percentages of the palette image, matching the 4-column x 6-row tray.
const BEAD_COLORS = [
  { name: 'Crystal Clear',    hex: '#CAAD92', x: 0,  y: 0,     w: 25, h: 16.67 },
  { name: 'Champagne',        hex: '#D2A382', x: 25, y: 0,     w: 25, h: 16.67 },
  { name: 'Light Topaz',      hex: '#AB5F36', x: 50, y: 0,     w: 25, h: 16.67 },
  { name: 'Ruby Red',         hex: '#970E18', x: 75, y: 0,     w: 25, h: 16.67 },
  { name: 'Garnet',           hex: '#611010', x: 0,  y: 16.67, w: 25, h: 16.67 },
  { name: 'Cocoa Brown',      hex: '#3D1A11', x: 25, y: 16.67, w: 25, h: 16.67 },
  { name: 'Tangerine',        hex: '#C63513', x: 50, y: 16.67, w: 25, h: 16.67 },
  { name: 'Honey Gold',       hex: '#D07A2A', x: 75, y: 16.67, w: 25, h: 16.67 },
  { name: 'Marigold',         hex: '#9A491A', x: 0,  y: 33.33, w: 25, h: 16.67 },
  { name: 'Sunshine Yellow',  hex: '#D28D1A', x: 25, y: 33.33, w: 25, h: 16.67 },
  { name: 'Chartreuse',       hex: '#928A1F', x: 50, y: 33.33, w: 25, h: 16.67 },
  { name: 'Grass Green',      hex: '#374D1A', x: 75, y: 33.33, w: 25, h: 16.67 },
  { name: 'Forest Green',     hex: '#161811', x: 0,  y: 50,    w: 25, h: 16.67 },
  { name: 'Emerald',          hex: '#1B2613', x: 25, y: 50,    w: 25, h: 16.67 },
  { name: 'Picasso Mix',      hex: '#3D2B18', x: 50, y: 50,    w: 25, h: 16.67 },
  { name: 'Teal',             hex: '#143039', x: 75, y: 50,    w: 25, h: 16.67 },
  { name: 'Aqua',             hex: '#1D3C65', x: 0,  y: 66.67, w: 25, h: 16.67 },
  { name: 'Sky Blue',         hex: '#306888', x: 25, y: 66.67, w: 25, h: 16.67 },
  { name: 'Periwinkle',       hex: '#3C3B5D', x: 50, y: 66.67, w: 25, h: 16.67 },
  { name: 'Ice Blue',         hex: '#807A88', x: 75, y: 66.67, w: 25, h: 16.67 },
  { name: 'Turquoise',        hex: '#4C7D92', x: 0,  y: 83.33, w: 25, h: 16.67 },
  { name: 'Navy Indigo',      hex: '#1D1838', x: 25, y: 83.33, w: 25, h: 16.67 },
  { name: 'Deep Plum',        hex: '#26181B', x: 50, y: 83.33, w: 25, h: 16.67 },
  { name: 'Root Beer',        hex: '#633735', x: 75, y: 83.33, w: 25, h: 16.67 },
];

// -------- Front wing bead layout, row by row, top to bottom --------
// count = number of customer-fillable beads in that row.
// wheels = fixed grey "wheel" beads on each side of the row (0 or 2), not
// customizable — these represent the wing's structural beads.
// label = what's shown to the left of the row (matches the shop's own notes).
const WING_ROWS = [
  { count: 4, wheels: 0, label: '4' },
  { count: 3, wheels: 2, label: '3+2w' },
  { count: 3, wheels: 0, label: '3' },
  { count: 2, wheels: 0, label: '2' },
  { count: 2, wheels: 0, label: '2' },
  { count: 2, wheels: 2, label: '2+2w' },
  { count: 1, wheels: 0, label: '1' },
  { count: 3, wheels: 0, label: '3' },
];
const WING_ROW_COUNT = WING_ROWS.length;

let selectedHex = null;
const cellFills = {}; // "r_c" -> hex

// ============================================
// Tiny sound engine (no audio files, just oscillators)
// ============================================
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function beep(freq, duration, type, delay) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.06, ctx.currentTime + (delay || 0));
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (delay || 0) + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + (delay || 0));
    osc.stop(ctx.currentTime + (delay || 0) + duration);
  } catch (e) { /* audio not available, fail silently */ }
}
function playPickSound() { beep(520, 0.08, 'square', 0); }
function playPaintSound() { beep(340, 0.05, 'triangle', 0); }
function playSuccessFanfare() {
  [440, 554, 659, 880].forEach((f, i) => beep(f, 0.18, 'square', i * 0.1));
}

// ============================================
// Loading screen: quick "lights out" countdown
// ============================================
function runLoadingScreen() {
  const screen = document.getElementById('loading-screen');
  const site = document.getElementById('site');
  const text = document.getElementById('loading-text');
  const sub = document.getElementById('loading-sub');

  const steps = ['GET READY', '3', '2', '1', 'GO!'];
  let i = 0;
  const interval = setInterval(() => {
    text.textContent = steps[i];
    sub.textContent = i === steps.length - 1 ? 'lights out and away we go' : 'starting your grid';
    beep(i === steps.length - 1 ? 660 : 300, 0.12, 'square', 0);
    i++;
    if (i >= steps.length) {
      clearInterval(interval);
      setTimeout(() => {
        screen.style.opacity = '0';
        setTimeout(() => {
          screen.classList.add('hidden');
          site.classList.remove('hidden');
        }, 400);
      }, 350);
    }
  }, 380);
}

// ============================================
// Palette hotspots
// ============================================
function buildHotspots() {
  const wrap = document.getElementById('hotspots');
  BEAD_COLORS.forEach((c) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hotspot';
    btn.style.left = c.x + '%';
    btn.style.top = c.y + '%';
    btn.style.width = c.w + '%';
    btn.style.height = c.h + '%';
    btn.setAttribute('aria-label', 'Select ' + c.name);
    btn.addEventListener('click', () => selectColor(c, btn));
    wrap.appendChild(btn);
  });
}

function selectColor(c, btnEl) {
  selectedHex = c.hex;
  playPickSound();

  document.querySelectorAll('.hotspot.picked').forEach((el) => el.classList.remove('picked'));
  btnEl.classList.add('picked');
  setTimeout(() => btnEl.classList.remove('picked'), 500);

  const swatch = document.getElementById('selectedSwirl');
  swatch.style.background = c.hex;
  swatch.classList.remove('pop');
  void swatch.offsetWidth; // restart animation
  swatch.classList.add('pop');

  document.getElementById('selectedName').textContent = c.name;
}

// ============================================
// Front wing grid
// ============================================
function buildCarGrid() {
  const grid = document.getElementById('carGrid');
  grid.innerHTML = '';

  WING_ROWS.forEach((rowSpec, r) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'wing-row';

    const labelEl = document.createElement('span');
    labelEl.className = 'row-label';
    labelEl.textContent = rowSpec.label;
    rowEl.appendChild(labelEl);

    const cellsEl = document.createElement('div');
    cellsEl.className = 'row-cells';

    const hasWheels = rowSpec.wheels >= 2;

    if (hasWheels) cellsEl.appendChild(makeWheelCell());

    for (let c = 0; c < rowSpec.count; c++) {
      cellsEl.appendChild(makeFillableCell(r, c));
    }

    if (hasWheels) cellsEl.appendChild(makeWheelCell());

    rowEl.appendChild(cellsEl);
    grid.appendChild(rowEl);
  });
}

function makeWheelCell() {
  const cell = document.createElement('button');
  cell.type = 'button';
  cell.className = 'cell wheel';
  cell.disabled = true;
  cell.tabIndex = -1;
  cell.setAttribute('aria-label', 'Fixed wheel bead, not customizable');
  return cell;
}

function makeFillableCell(r, c) {
  const cell = document.createElement('button');
  cell.type = 'button';
  cell.className = 'cell fillable';
  const key = r + '_' + c;
  cell.setAttribute('aria-label', 'Bead cell, row ' + (r + 1));
  cell.addEventListener('click', () => {
    if (!selectedHex) {
      document.getElementById('selectedName').textContent = 'Pick a color first!';
      return;
    }
    cellFills[key] = selectedHex;
    cell.style.background = selectedHex;
    playPaintSound();
  });
  return cell;
}

function clearGrid() {
  Object.keys(cellFills).forEach((k) => delete cellFills[k]);
  document.querySelectorAll('.cell.fillable').forEach((el) => { el.style.background = ''; });
}

// Fills every fillable cell with a random color from the palette, purely
// for fun / inspiration — customers can still click cells afterward to
// change individual beads.
function randomizeColors() {
  WING_ROWS.forEach((rowSpec, r) => {
    for (let c = 0; c < rowSpec.count; c++) {
      const randomColor = BEAD_COLORS[Math.floor(Math.random() * BEAD_COLORS.length)];
      cellFills[r + '_' + c] = randomColor.hex;
    }
  });
  const cells = document.querySelectorAll('#carGrid .cell.fillable');
  let idx = 0;
  WING_ROWS.forEach((rowSpec, r) => {
    for (let c = 0; c < rowSpec.count; c++) {
      const key = r + '_' + c;
      cells[idx].style.background = cellFills[key];
      idx++;
    }
  });
  beep(400, 0.06, 'sine', 0);
  beep(500, 0.06, 'sine', 0.06);
  beep(650, 0.08, 'sine', 0.12);
}

// ============================================
// Design export (canvas -> PNG)
// ============================================
function renderDesignToCanvas() {
  const size = 32, gap = 3, labelWidth = 50;
  const maxRowWidth = Math.max(...WING_ROWS.map((r) => r.count + r.wheels));
  const canvas = document.createElement('canvas');
  canvas.width = labelWidth + maxRowWidth * (size + gap);
  canvas.height = WING_ROW_COUNT * (size + gap);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFFDF8';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = '16px monospace';
  ctx.fillStyle = '#4A4744';
  ctx.textBaseline = 'middle';

  WING_ROWS.forEach((rowSpec, r) => {
    const y = r * (size + gap);
    ctx.fillStyle = '#4A4744';
    ctx.fillText(rowSpec.label, 4, y + size / 2);

    const hasWheels = rowSpec.wheels >= 2;
    let colCursor = 0;

    if (hasWheels) {
      drawWheelCell(ctx, labelWidth + colCursor * (size + gap), y, size);
      colCursor++;
    }
    for (let c = 0; c < rowSpec.count; c++) {
      const key = r + '_' + c;
      const x = labelWidth + colCursor * (size + gap);
      ctx.fillStyle = cellFills[key] || '#EFE6D6';
      ctx.fillRect(x, y, size, size);
      ctx.strokeStyle = '#1B1B1B';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, size, size);
      colCursor++;
    }
    if (hasWheels) {
      drawWheelCell(ctx, labelWidth + colCursor * (size + gap), y, size);
    }
  });
  return canvas;
}

function drawWheelCell(ctx, x, y, size) {
  ctx.fillStyle = '#6b6b6b';
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1B1B1B';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function downloadDesign() {
  const canvas = renderDesignToCanvas();
  const link = document.createElement('a');
  link.download = 'my-swallowbirdcircle-race-car.png';
  link.href = canvas.toDataURL();
  link.click();
}

// ============================================
// Confetti
// ============================================
function launchConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  const colors = ['#C8102E', '#F1641E', '#FFFDF8', '#1B1B1B'];
  const pieces = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * canvas.height * 0.5,
    size: 5 + Math.random() * 6,
    color: colors[Math.floor(Math.random() * colors.length)],
    speed: 2 + Math.random() * 3,
    drift: (Math.random() - 0.5) * 2,
    spin: Math.random() * Math.PI,
    spinSpeed: (Math.random() - 0.5) * 0.3,
  }));

  let frame = 0;
  const maxFrames = 220;

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach((p) => {
      p.y += p.speed;
      p.x += p.drift;
      p.spin += p.spinSpeed;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.spin);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });
    frame++;
    if (frame < maxFrames) {
      requestAnimationFrame(tick);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  tick();
}

// ============================================
// Success overlay
// ============================================
function openSuccessOverlay() {
  const filled = Object.keys(cellFills).length;
  if (filled === 0) {
    document.getElementById('selectedName').textContent = 'Fill in at least one bead first!';
    return;
  }
  const overlay = document.getElementById('successOverlay');
  overlay.classList.remove('hidden');
  playSuccessFanfare();
  launchConfetti();
}

function closeSuccessOverlay() {
  document.getElementById('successOverlay').classList.add('hidden');
}

// ============================================
// Social icons: small launch animation, then navigate
// ============================================
function wireSocialIcons() {
  document.querySelectorAll('.social-icon').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      if (a.classList.contains('launching')) return;
      const href = a.getAttribute('data-href');
      a.classList.add('launching');
      beep(500, 0.1, 'sine', 0);
      setTimeout(() => {
        window.open(href, '_blank', 'noopener');
        a.classList.remove('launching');
      }, 420);
    });
  });
}

// ============================================
// Init
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  buildHotspots();
  buildCarGrid();
  wireSocialIcons();

  document.getElementById('clearGridBtn').addEventListener('click', clearGrid);
  document.getElementById('randomizeBtn').addEventListener('click', randomizeColors);
  document.getElementById('checkBtn').addEventListener('click', openSuccessOverlay);
  document.getElementById('downloadDesignBtn').addEventListener('click', downloadDesign);
  document.getElementById('closeSuccessBtn').addEventListener('click', closeSuccessOverlay);

  runLoadingScreen();
});
