/* ============================================
   swallowbirdcircle — bead customizer
   ============================================ */

// -------- Bead colors, based on the shop's actual bead tray photo --------
// x / y / w / h are percentages of the palette image, matching the 4-column x 6-row tray.
// Hex values are brightness/white-balance corrected from the raw photo sample
// (the photo was shot under warm indoor light, which skewed everything dark
// and brown) so they read closer to the true bead color on screen.
// "multi" colors (just Picasso Mix) render as a speckled gradient instead of
// one flat color, since that's a mixed-color bead in real life.
const BEAD_COLORS = [
  { name: 'Crystal Clear',   hex: '#F1E9DC', x: 0,  y: 0,     w: 25, h: 16.67 },
  { name: 'Champagne',       hex: '#EAD6BC', x: 25, y: 0,     w: 25, h: 16.67 },
  { name: 'Light Topaz',     hex: '#CB8E52', x: 50, y: 0,     w: 25, h: 16.67 },
  { name: 'Ruby Red',        hex: '#CC2436', x: 75, y: 0,     w: 25, h: 16.67 },
  { name: 'Garnet',          hex: '#7E2222', x: 0,  y: 16.67, w: 25, h: 16.67 },
  { name: 'Cocoa Brown',     hex: '#5E3826', x: 25, y: 16.67, w: 25, h: 16.67 },
  { name: 'Tangerine',       hex: '#E3591E', x: 50, y: 16.67, w: 25, h: 16.67 },
  { name: 'Honey Gold',      hex: '#E29A34', x: 75, y: 16.67, w: 25, h: 16.67 },
  { name: 'Marigold',        hex: '#CC7620', x: 0,  y: 33.33, w: 25, h: 16.67 },
  { name: 'Sunshine Yellow', hex: '#EBBC3E', x: 25, y: 33.33, w: 25, h: 16.67 },
  { name: 'Chartreuse',      hex: '#BCCB45', x: 50, y: 33.33, w: 25, h: 16.67 },
  { name: 'Grass Green',     hex: '#5F8030', x: 75, y: 33.33, w: 25, h: 16.67 },
  { name: 'Forest Green',    hex: '#234223', x: 0,  y: 50,    w: 25, h: 16.67 },
  { name: 'Emerald',         hex: '#2F6E40', x: 25, y: 50,    w: 25, h: 16.67 },
  {
    name: 'Picasso Mix', x: 50, y: 50, w: 25, h: 16.67,
    hex: '#8A7355', // fallback solid color (used for aria-labels / plain contexts)
    multi: true,
    stops: ['#4A3419', '#7C8F4A', '#B5451B', '#D9B23C', '#5A7A8C', '#4A3419'],
  },
  { name: 'Teal',            hex: '#1F7686', x: 75, y: 50,    w: 25, h: 16.67 },
  { name: 'Aqua',            hex: '#3E76B0', x: 0,  y: 66.67, w: 25, h: 16.67 },
  { name: 'Sky Blue',        hex: '#4E97BE', x: 25, y: 66.67, w: 25, h: 16.67 },
  { name: 'Periwinkle',      hex: '#7C7BB0', x: 50, y: 66.67, w: 25, h: 16.67 },
  { name: 'Ice Blue',        hex: '#D3DEE7', x: 75, y: 66.67, w: 25, h: 16.67 },
  { name: 'Turquoise',       hex: '#5FADBC', x: 0,  y: 83.33, w: 25, h: 16.67 },
  { name: 'Navy Indigo',     hex: '#312A68', x: 25, y: 83.33, w: 25, h: 16.67 },
  { name: 'Deep Plum',       hex: '#512E3D', x: 50, y: 83.33, w: 25, h: 16.67 },
  { name: 'Root Beer',       hex: '#7E5240', x: 75, y: 83.33, w: 25, h: 16.67 },
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

let selectedIndex = null; // index into BEAD_COLORS, or null
const cellFills = {}; // "r_c" -> index into BEAD_COLORS

// Returns a CSS background value (solid color, or a gradient for multi-color beads)
function cssBackgroundFor(index) {
  const c = BEAD_COLORS[index];
  if (!c) return '';
  return c.multi ? `linear-gradient(135deg, ${c.stops.join(', ')})` : c.hex;
}

// ============================================
// Sound engine (no audio files — everything is synthesized)
// ============================================
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function beep(freq, duration, type, delay, volume) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'square';
    osc.frequency.value = freq;
    const startAt = ctx.currentTime + (delay || 0);
    gain.gain.setValueAtTime(volume || 0.06, startAt);
    gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startAt);
    osc.stop(startAt + duration + 0.02);
  } catch (e) { /* audio not available, fail silently */ }
}

// A short engine "rev" — a sawtooth sweep, layered with a lower rumble
// oscillator underneath for more body.
function engineRev(duration, delay) {
  try {
    const ctx = getAudioCtx();
    const startAt = ctx.currentTime + (delay || 0);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, startAt);
    osc.frequency.exponentialRampToValueAtTime(360, startAt + duration * 0.55);
    osc.frequency.exponentialRampToValueAtTime(200, startAt + duration);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(0.09, startAt + duration * 0.15);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startAt);
    osc.stop(startAt + duration + 0.05);

    const rumble = ctx.createOscillator();
    const rumbleGain = ctx.createGain();
    rumble.type = 'square';
    rumble.frequency.setValueAtTime(45, startAt);
    rumble.frequency.exponentialRampToValueAtTime(120, startAt + duration * 0.55);
    rumbleGain.gain.setValueAtTime(0.0001, startAt);
    rumbleGain.gain.exponentialRampToValueAtTime(0.05, startAt + duration * 0.15);
    rumbleGain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    rumble.connect(rumbleGain);
    rumbleGain.connect(ctx.destination);
    rumble.start(startAt);
    rumble.stop(startAt + duration + 0.05);
  } catch (e) { /* audio not available, fail silently */ }
}

function playPickSound() { beep(520, 0.08, 'square', 0); }
function playPaintSound() { beep(340, 0.05, 'triangle', 0); }

// A short original victory riff (no borrowed melodies) plus an engine
// flourish underneath, for the "I'm done!" moment.
function playVictoryFanfare() {
  const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5];
  notes.forEach((f, i) => beep(f, 0.16, 'square', i * 0.11, 0.055));
  engineRev(0.9, 0.05);
}

// ============================================
// Loading screen: "lights out" countdown with engine sound
// ============================================
function runLoadingScreen() {
  const screen = document.getElementById('loading-screen');
  const site = document.getElementById('site');
  const text = document.getElementById('loading-text');
  const sub = document.getElementById('loading-sub');

  engineRev(1.1, 0); // engine turning over as the screen appears

  const steps = ['GET READY', '3', '2', '1', 'GO!'];
  let i = 0;
  const interval = setInterval(() => {
    text.textContent = steps[i];
    const isGo = i === steps.length - 1;
    sub.textContent = isGo ? 'lights out and away we go' : 'starting your grid';
    if (isGo) {
      engineRev(0.8, 0);
    } else {
      beep(300, 0.12, 'square', 0);
    }
    i++;
    if (i >= steps.length) {
      clearInterval(interval);
      setTimeout(() => {
        screen.style.opacity = '0';
        setTimeout(() => {
          screen.classList.add('hidden');
          site.classList.remove('hidden');
        }, 400);
      }, 450);
    }
  }, 420);
}

// ============================================
// Palette hotspots
// ============================================
function buildHotspots() {
  const wrap = document.getElementById('hotspots');
  BEAD_COLORS.forEach((c, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hotspot';
    btn.style.left = c.x + '%';
    btn.style.top = c.y + '%';
    btn.style.width = c.w + '%';
    btn.style.height = c.h + '%';
    btn.setAttribute('aria-label', 'Select ' + c.name);
    btn.addEventListener('click', () => selectColor(index, btn));
    wrap.appendChild(btn);
  });
}

function selectColor(index, btnEl) {
  selectedIndex = index;
  const c = BEAD_COLORS[index];
  playPickSound();

  document.querySelectorAll('.hotspot.picked').forEach((el) => el.classList.remove('picked'));
  btnEl.classList.add('picked');
  setTimeout(() => btnEl.classList.remove('picked'), 500);

  const swatch = document.getElementById('selectedSwirl');
  swatch.style.background = cssBackgroundFor(index);
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
    if (selectedIndex === null) {
      document.getElementById('selectedName').textContent = 'Pick a color first!';
      return;
    }
    cellFills[key] = selectedIndex;
    cell.style.background = cssBackgroundFor(selectedIndex);
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
  const cells = document.querySelectorAll('#carGrid .cell.fillable');
  let idx = 0;
  WING_ROWS.forEach((rowSpec, r) => {
    for (let c = 0; c < rowSpec.count; c++) {
      const randomIndex = Math.floor(Math.random() * BEAD_COLORS.length);
      const key = r + '_' + c;
      cellFills[key] = randomIndex;
      cells[idx].style.background = cssBackgroundFor(randomIndex);
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
      fillBeadCell(ctx, x, y, size, cellFills[key]);
      colCursor++;
    }
    if (hasWheels) {
      drawWheelCell(ctx, labelWidth + colCursor * (size + gap), y, size);
    }
  });
  return canvas;
}

function fillBeadCell(ctx, x, y, size, colorIndex) {
  const c = BEAD_COLORS[colorIndex];
  if (c && c.multi) {
    const grad = ctx.createLinearGradient(x, y, x + size, y + size);
    const n = c.stops.length;
    c.stops.forEach((stop, i) => grad.addColorStop(i / (n - 1), stop));
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = c ? c.hex : '#EFE6D6';
  }
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = '#1B1B1B';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, size, size);
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
  link.download = 'my-swallowbirdcircle-front-wing.png';
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
  const pieces = Array.from({ length: 130 }, () => ({
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
  playVictoryFanfare();
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
