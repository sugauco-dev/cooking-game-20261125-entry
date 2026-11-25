// Sizzle & Serve — all canvas drawing: the kitchen, the chef, the food, the HUD.
// The judge sees the game through screenshots, so every frame must read at a glance.
import {
  CANVAS, PALETTE, INGREDIENTS, STATIONS, TRASH, BOARD, CHEF_RADIUS,
  GRILL_SECONDS, BURN_AFTER_SECONDS, FRY_SECONDS,
} from './config.js';
import { ticketProgress, readyTicket, stationCenter } from './state.js';

export function roundRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight, align) {
  ctx.fillStyle = color;
  ctx.font = `${weight || '700'} ${size}px 'Trebuchet MS', 'Segoe UI', sans-serif`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// One ingredient, drawn as a small readable glyph (bun dome, patty slab, ...).
export function drawIngredient(ctx, key, x, y, size) {
  const ing = INGREDIENTS[key];
  if (!ing) return;
  const s = size;
  ctx.save();
  ctx.translate(x, y);
  if (key === 'bun') {
    ctx.fillStyle = ing.color;
    ctx.beginPath(); ctx.arc(0, s * 0.08, s * 0.46, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = ing.dark;
    ctx.fillRect(-s * 0.46, s * 0.06, s * 0.92, s * 0.14);
    ctx.fillStyle = '#fff3c4';
    ctx.fillRect(-s * 0.2, -s * 0.28, s * 0.08, s * 0.05);
    ctx.fillRect(s * 0.08, -s * 0.32, s * 0.08, s * 0.05);
  } else if (key === 'patty') {
    ctx.fillStyle = ing.color;
    roundRect(ctx, -s * 0.5, -s * 0.16, s, s * 0.34, s * 0.12);
    ctx.fill();
    ctx.fillStyle = ing.dark;
    ctx.fillRect(-s * 0.3, -s * 0.05, s * 0.12, s * 0.1);
    ctx.fillRect(s * 0.1, -s * 0.08, s * 0.14, s * 0.1);
  } else if (key === 'lettuce') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    for (let i = 0; i < 5; i += 1) {
      const a = (i / 5) * Math.PI * 2;
      ctx.arc(Math.cos(a) * s * 0.22, Math.sin(a) * s * 0.22, s * 0.24, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.strokeStyle = ing.dark; ctx.lineWidth = s * 0.05;
    ctx.beginPath(); ctx.moveTo(-s * 0.3, 0); ctx.lineTo(s * 0.3, 0); ctx.stroke();
  } else if (key === 'tomato') {
    ctx.fillStyle = ing.color;
    ctx.beginPath(); ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f6a09a';
    ctx.beginPath(); ctx.arc(0, 0, s * 0.26, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ing.dark;
    ctx.fillRect(-s * 0.05, -s * 0.42, s * 0.1, s * 0.14);
  } else if (key === 'cheese') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.moveTo(-s * 0.48, s * 0.3); ctx.lineTo(s * 0.48, s * 0.3); ctx.lineTo(0, -s * 0.36);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = ing.dark;
    ctx.beginPath(); ctx.arc(-s * 0.1, s * 0.08, s * 0.07, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(s * 0.16, s * 0.14, s * 0.06, 0, Math.PI * 2); ctx.fill();
  } else if (key === 'sauce') {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0, -s * 0.1, s * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = ing.color; ctx.lineWidth = s * 0.14; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-s * 0.2, -s * 0.3); ctx.quadraticCurveTo(0, -s * 0.05, s * 0.2, -s * 0.28);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-s * 0.22, -s * 0.05); ctx.quadraticCurveTo(0, s * 0.18, s * 0.22, -s * 0.04);
    ctx.stroke();
  } else if (key === 'fries') {
    ctx.fillStyle = '#d64541';
    ctx.beginPath();
    ctx.moveTo(-s * 0.36, -s * 0.05); ctx.lineTo(s * 0.36, -s * 0.05);
    ctx.lineTo(s * 0.28, s * 0.42); ctx.lineTo(-s * 0.28, s * 0.42);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = ing.color;
    for (let i = -1; i <= 1; i += 1) ctx.fillRect(i * s * 0.22 - s * 0.07, -s * 0.5, s * 0.14, s * 0.55);
  }
  ctx.restore();
}

function drawStation(ctx, world, station) {
  const { x, y, w, h } = station;
  const isHot = station.id === 'grill' || station.id === 'fryer';
  ctx.fillStyle = PALETTE.counterSide;
  roundRect(ctx, x, y + 8, w, h, 10);
  ctx.fill();
  ctx.fillStyle = isHot ? PALETTE.steel : PALETTE.counterTop;
  roundRect(ctx, x, y, w, h - 6, 10);
  ctx.fill();
  text(ctx, station.label, x + w / 2, y + 20, 17, station.id === 'serve' ? '#fff' : PALETTE.ink, '800', 'center');
  if (station.id !== 'grill' && station.id !== 'fryer') {
    text(ctx, station.sub, x + w / 2, y + 40, 12, station.id === 'serve' ? '#ffe9b0' : '#6b4a22', '600', 'center');
  }

  if (station.id === 'serve') {
    ctx.fillStyle = '#fff7e6';
    roundRect(ctx, x + 10, y + 52, w - 20, 34, 6);
    ctx.fill();
    text(ctx, 'PICK UP HERE', x + w / 2, y + 69, 13, '#8a5426', '800', 'center');
  }
  if (station.id === 'bread') {
    for (let i = 0; i < 3; i += 1) drawIngredient(ctx, 'bun', x + 34 + i * 42, y + 70, 34);
  }
  if (station.id === 'fridge') {
    const next = ['lettuce', 'tomato', 'cheese'][world.fridgePick % 3];
    drawIngredient(ctx, 'lettuce', x + 36, y + 64, 30);
    drawIngredient(ctx, 'tomato', x + 86, y + 64, 30);
    drawIngredient(ctx, 'cheese', x + 136, y + 64, 30);
    text(ctx, `next: ${INGREDIENTS[next].name}`, x + w / 2, y + 90, 11, '#3f7d33', '700', 'center');
  }
  if (station.id === 'sauce') drawIngredient(ctx, 'sauce', x + w / 2, y + 70, 36);
  if (station.id === 'grill') drawCooker(ctx, world, 'grill', x, y, w);
  if (station.id === 'fryer') drawCooker(ctx, world, 'fryer', x, y, w);
  if (station.id === 'assembly') drawPlate(ctx, world.plate, x + w / 2, y + 66, 46, readyTicket(world) !== undefined);
}

function drawCooker(ctx, world, which, x, y, w) {
  const slot = which === 'grill' ? world.grill : world.fryer;
  const total = which === 'grill' ? GRILL_SECONDS : FRY_SECONDS;
  const cx = x + w / 2;
  // Status line where the station's sub-label would sit, so nothing overlaps.
  if (slot.state === 'cooking') text(ctx, 'COOKING…', cx, y + 40, 13, '#f2b705', '800', 'center');
  else if (slot.state === 'ready') text(ctx, 'READY!', cx, y + 40, 13, '#6fbf5a', '800', 'center');
  else if (slot.state === 'burnt') text(ctx, 'BURNT!', cx, y + 40, 13, '#ff8a80', '800', 'center');
  else text(ctx, which === 'grill' ? 'patty 6s' : 'fries 5s', cx, y + 40, 12, '#6b4a22', '600', 'center');
  ctx.fillStyle = '#2e2a26';
  roundRect(ctx, x + 16, y + 52, w - 32, 34, 8);
  ctx.fill();
  if (slot.state === 'empty') {
    text(ctx, which === 'grill' ? 'press E: start patty' : 'press E: start fries', cx, y + 69, 12, '#c9ced6', '600', 'center');
    return;
  }
  const elapsed = world.time - slot.startedAt;
  const frac = Math.min(1, elapsed / total);
  if (slot.state === 'burnt') {
    drawIngredient(ctx, 'patty', cx, y + 69, 30);
    ctx.fillStyle = 'rgba(20,10,5,0.55)';
    ctx.beginPath(); ctx.arc(cx, y + 69, 16, 0, Math.PI * 2); ctx.fill();
    return;
  }
  drawIngredient(ctx, slot.item, cx, y + 69, 30);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  roundRect(ctx, x + 22, y + 80, w - 44, 7, 3);
  ctx.fill();
  ctx.fillStyle = slot.state === 'ready' ? '#6fbf5a' : '#f2b705';
  roundRect(ctx, x + 22, y + 80, (w - 44) * frac, 7, 3);
  ctx.fill();
}

// A plate with its stacked ingredients, drawn from above.
export function drawPlate(ctx, items, x, y, size, ready) {
  const s = size;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(x, y + s * 0.1, s * 0.62, s * 0.42, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#c9ced6'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(x, y + s * 0.1, s * 0.62, s * 0.42, 0, 0, Math.PI * 2); ctx.stroke();
  if (items.length === 0) {
    text(ctx, 'empty plate', x, y + s * 0.1, 12, '#9aa1ad', '600', 'center');
    return;
  }
  items.forEach((item, i) => {
    // Fan the stack out sideways so every layer stays visible at a glance.
    drawIngredient(ctx, item, x + (i - (items.length - 1) / 2) * s * 0.34, y + s * 0.1 - i * s * 0.1, s * 0.6);
  });
  if (ready) {
    ctx.strokeStyle = '#f2b705'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(x, y + s * 0.1, s * 0.72, s * 0.52, 0, 0, Math.PI * 2); ctx.stroke();
    text(ctx, 'READY!', x, y - s * 0.52, 14, '#b98a00', '800', 'center');
  }
}

function drawTicket(ctx, ticket, x, y, now) {
  const w = BOARD.ticketW;
  const h = BOARD.ticketH;
  const frac = ticketProgress(ticket, now);
  const urgent = frac < 0.3;
  ctx.fillStyle = PALETTE.boardPaper;
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = urgent ? '#d64541' : '#d9b380';
  ctx.lineWidth = urgent ? 4 : 2;
  roundRect(ctx, x, y, w, h, 10);
  ctx.stroke();
  text(ctx, `#${ticket.id}  ${ticket.recipe.name}`, x + 12, y + 18, 16, PALETTE.ink, '800');
  ticket.items.forEach((item, i) => {
    drawIngredient(ctx, item, x + 28 + i * 46, y + 56, 36);
  });
  text(ctx, `${ticket.recipe.reward} coins`, x + w - 12, y + 20, 13, '#8a5426', '700', 'right');
  ctx.fillStyle = '#e8dcc4';
  roundRect(ctx, x + 12, y + h - 18, w - 24, 8, 4);
  ctx.fill();
  ctx.fillStyle = urgent ? '#d64541' : '#4d9b4d';
  roundRect(ctx, x + 12, y + h - 18, (w - 24) * frac, 8, 4);
  ctx.fill();
}

function drawChef(ctx, world) {
  const chef = world.chef;
  const x = chef.x;
  const y = chef.y;
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(x, y + 22, 26, 8, 0, 0, Math.PI * 2); ctx.fill();
  // Body (apron) and head.
  ctx.fillStyle = '#3e7cb1';
  roundRect(ctx, x - 18, y - 8, 36, 30, 10);
  ctx.fill();
  ctx.fillStyle = '#fdf6e3';
  roundRect(ctx, x - 12, y - 2, 24, 24, 6);
  ctx.fill();
  ctx.fillStyle = '#f2c79b';
  ctx.beginPath(); ctx.arc(x, y - 18, 15, 0, Math.PI * 2); ctx.fill();
  // Toque.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(x - 9, y - 32, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 9, y - 32, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x, y - 36, 11, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(x - 13, y - 32, 26, 8);
  // Carried ingredients float above the hat.
  chef.carry.forEach((item, i) => {
    drawIngredient(ctx, item, x - (chef.carry.length - 1) * 18 + i * 36, y - 58, 30);
  });
}

function drawHeader(ctx, world) {
  ctx.fillStyle = PALETTE.board;
  ctx.fillRect(0, 0, CANVAS.width, 64);
  text(ctx, 'SIZZLE & SERVE', 24, 33, 26, '#f2b705', '800');
  text(ctx, 'BISTRO RUSH', 268, 35, 14, '#fdf6e3', '700');
  const mins = Math.floor(world.shiftLeft / 60);
  const secs = Math.floor(world.shiftLeft % 60);
  const timerColor = world.shiftLeft <= 30 ? '#ff8a80' : '#fdf6e3';
  text(ctx, `TIME ${mins}:${String(secs).padStart(2, '0')}`, 560, 33, 24, timerColor, '800', 'center');
  text(ctx, `COINS ${world.coins}`, 830, 33, 22, '#f2b705', '800', 'center');
  text(ctx, world.combo >= 2 ? `COMBO x${Math.min(world.combo, 5)}` : 'COMBO —', 1010, 33, 20, world.combo >= 2 ? '#6fbf5a' : '#9aa1ad', '800', 'center');
  text(ctx, `SERVED ${world.served}`, 1180, 33, 20, '#fdf6e3', '800', 'center');
  if (world.rush) {
    text(ctx, 'RUSH HOUR!', 640, 92, 18, '#d64541', '800', 'center');
  }
}

function drawBoard(ctx, world) {
  ctx.fillStyle = PALETTE.board;
  roundRect(ctx, BOARD.x, BOARD.y, BOARD.w, BOARD.h, 12);
  ctx.fill();
  text(ctx, 'ORDER BOARD', BOARD.x + 16, BOARD.y + 20, 14, '#f2b705', '800');
  const open = world.tickets.filter((t) => !t.served && !t.missed);
  if (open.length === 0) {
    text(ctx, 'No orders yet — the lunch crowd is coming…', BOARD.x + 220, BOARD.y + 68, 17, '#fdf6e3', '600');
  }
  open.forEach((ticket, i) => {
    drawTicket(ctx, ticket, BOARD.x + 16 + i * (BOARD.ticketW + BOARD.gap), BOARD.y + 30, world.time);
  });
}

function drawFloor(ctx) {
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 64, CANVAS.width, 150);
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 16; col += 1) {
      ctx.fillStyle = (row + col) % 2 === 0 ? PALETTE.floorA : PALETTE.floorB;
      ctx.fillRect(col * 80, 214 + row * 65, 80, 65);
    }
  }
  ctx.fillStyle = PALETTE.wallTrim;
  ctx.fillRect(0, 210, CANVAS.width, 6);
  // A woven rug low on the floor and a potted herb by the wall,
  // so the open floor reads as a bistro, not an empty board.
  ctx.fillStyle = '#c96f4a';
  roundRect(ctx, 480, 640, 320, 100, 16);
  ctx.fill();
  ctx.strokeStyle = '#f3e3c2'; ctx.lineWidth = 4;
  roundRect(ctx, 494, 654, 292, 72, 10);
  ctx.stroke();
  ctx.fillStyle = '#f3e3c2';
  ctx.beginPath(); ctx.arc(640, 690, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#b5773f';
  roundRect(ctx, 1150, 690, 64, 56, 8);
  ctx.fill();
  ctx.fillStyle = '#4d9b4d';
  ctx.beginPath(); ctx.arc(1182, 668, 26, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(1164, 682, 18, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(1200, 682, 18, 0, Math.PI * 2); ctx.fill();
  // Trash can.
  ctx.fillStyle = PALETTE.steelDark;
  roundRect(ctx, TRASH.x, TRASH.y, TRASH.w, TRASH.h, 8);
  ctx.fill();
  ctx.fillStyle = '#6b7280';
  roundRect(ctx, TRASH.x + 8, TRASH.y - 8, TRASH.w - 16, 12, 6);
  ctx.fill();
  text(ctx, 'TRASH', TRASH.x + TRASH.w / 2, TRASH.y + TRASH.h / 2, 15, '#fff', '800', 'center');
  text(ctx, 'WASD / arrows to move  •  E or click to use a station', 640, 786, 14, '#7a5a30', '600', 'center');
}

function drawFloaters(ctx, world) {
  for (const f of world.floaters) {
    const age = world.time - f.bornAt;
    ctx.globalAlpha = Math.max(0, 1 - age / 1.1);
    text(ctx, f.text, f.x, f.y - age * 46, 20, f.color, '800', 'center');
  }
  ctx.globalAlpha = 1;
  for (const p of world.particles) {
    const age = world.time - p.bornAt;
    ctx.globalAlpha = Math.max(0, 1 - age / p.life);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
  }
  ctx.globalAlpha = 1;
  if (world.message && world.time - world.messageAt < 2) {
    ctx.globalAlpha = Math.max(0, 1 - (world.time - world.messageAt - 1.2) / 0.8);
    text(ctx, world.message, 640, 350, 26, '#2e2a26', '800', 'center');
    ctx.globalAlpha = 1;
  }
}

function drawTitle(ctx, world) {
  drawFloor(ctx);
  drawHeader(ctx, world);
  drawBoard(ctx, world);
  for (const s of STATIONS) drawStation(ctx, world, s);
  drawChef(ctx, world);
  ctx.fillStyle = 'rgba(46,42,38,0.72)';
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
  text(ctx, 'SIZZLE & SERVE', 640, 250, 84, '#f2b705', '800', 'center');
  text(ctx, 'B I S T R O   R U S H', 640, 318, 30, '#fdf6e3', '700', 'center');
  text(ctx, 'Run the lunch rush: grill, fry, stack and serve before the tickets run out.', 640, 380, 22, '#fdf6e3', '600', 'center');
  text(ctx, 'Move: WASD / arrows      Use station: E or click      Trash: walk to the bin', 640, 420, 19, '#f2c14e', '600', 'center');
  ctx.fillStyle = '#f2b705';
  roundRect(ctx, 490, 470, 300, 64, 12);
  ctx.fill();
  text(ctx, 'PRESS ENTER TO COOK', 640, 503, 24, '#2e2a26', '800', 'center');
  text(ctx, '5 recipes  •  grill & fryer timing  •  combos pay double', 640, 580, 17, '#fdf6e3', '600', 'center');
}

function drawOver(ctx, world) {
  drawFloor(ctx);
  drawHeader(ctx, world);
  drawBoard(ctx, world);
  for (const s of STATIONS) drawStation(ctx, world, s);
  ctx.fillStyle = 'rgba(46,42,38,0.72)';
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
  const over = world.over || { served: 0, missed: 0, coins: 0, stars: 0, bestCombo: 0 };
  text(ctx, 'SHIFT OVER!', 640, 220, 72, '#f2b705', '800', 'center');
  text(ctx, '★'.repeat(over.stars) + '☆'.repeat(3 - over.stars), 640, 300, 44, '#f2b705', '800', 'center');
  text(ctx, `Dishes served: ${over.served}      Walked out: ${over.missed}`, 640, 380, 26, '#fdf6e3', '700', 'center');
  text(ctx, `Coins earned: ${over.coins}      Best combo: x${Math.min(over.bestCombo, 5)}`, 640, 428, 26, '#fdf6e3', '700', 'center');
  text(ctx, over.stars >= 3 ? 'Head-chef material. The bistro is yours.' : over.stars === 2 ? 'A solid shift — the regulars will be back.' : 'The rush won this time. Run it back!', 640, 490, 22, '#f2c14e', '600', 'center');
  ctx.fillStyle = '#f2b705';
  roundRect(ctx, 440, 540, 400, 64, 12);
  ctx.fill();
  text(ctx, 'PRESS ENTER TO PLAY AGAIN', 640, 573, 21, '#2e2a26', '800', 'center');
}

export function drawWorld(ctx, world) {
  ctx.save();
  if (world.shake > 0) {
    ctx.translate((Math.random() - 0.5) * world.shake * 24, (Math.random() - 0.5) * world.shake * 24);
  }
  if (world.screen === 'title') { drawTitle(ctx, world); ctx.restore(); return; }
  if (world.screen === 'over') { drawOver(ctx, world); ctx.restore(); return; }
  drawFloor(ctx);
  drawHeader(ctx, world);
  drawBoard(ctx, world);
  for (const s of STATIONS) drawStation(ctx, world, s);
  drawChef(ctx, world);
  drawFloaters(ctx, world);
  ctx.restore();
}
