// Sizzle & Serve — the world: orders, the chef, the grill, the plate, the score.
// Pure state and rules; no drawing and no input here.
import {
  SHIFT_SECONDS, MAX_TICKETS, MAX_CARRY, CHEF_SPEED, CHEF_RADIUS, INTERACT_RANGE,
  GRILL_SECONDS, BURN_AFTER_SECONDS, FRY_SECONDS,
  TICKET_MIN_SECONDS, TICKET_MAX_SECONDS, RECIPES, STATIONS, TRASH,
} from './config.js';

// A tiny seeded random generator, so a screenshot seed always replays the same shift.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function stationById(id) {
  return STATIONS.find((s) => s.id === id);
}

export function stationCenter(station) {
  return { x: station.x + station.w / 2, y: station.y + station.h / 2 };
}

export function newTicket(random, id, now) {
  const recipe = RECIPES[Math.floor(random() * RECIPES.length)];
  const life = TICKET_MIN_SECONDS + random() * (TICKET_MAX_SECONDS - TICKET_MIN_SECONDS);
  return {
    id, recipe, items: [...recipe.items],
    bornAt: now, expiresAt: now + life, life,
    served: false, missed: false,
  };
}

export function newWorld(seed) {
  const random = mulberry32(seed);
  return {
    seed, random,
    screen: 'title', // title | play | over
    time: 0, // seconds since the shift started
    shiftLeft: SHIFT_SECONDS,
    coins: 0,
    served: 0,
    missed: 0,
    combo: 0,
    bestCombo: 0,
    chef: { x: 640, y: 560, vx: 0, vy: 0, facing: 1, carry: [], plate: null },
    tickets: [],
    nextTicketId: 1,
    spawnIn: 1.2, // first ticket arrives quickly so the board is never empty
    grill: { item: null, startedAt: 0, state: 'empty' }, // empty | cooking | ready | burnt
    fryer: { item: null, startedAt: 0, state: 'empty' },
    fridgePick: 0, // which fresh item the fridge hands out next
    plate: [], // items stacked on the assembly counter
    floaters: [], // {x, y, text, color, bornAt}
    particles: [], // {x, y, vx, vy, color, bornAt, life}
    message: '',
    messageAt: 0,
    shake: 0,
    rush: false,
    over: null, // {served, missed, coins, stars} once the shift ends
  };
}

export function ticketProgress(ticket, now) {
  return Math.max(0, (ticket.expiresAt - now) / ticket.life);
}

export function plateMatchesTicket(plate, ticket) {
  if (plate.length !== ticket.items.length) return false;
  const have = [...plate].sort();
  const want = [...ticket.items].sort();
  return have.every((item, i) => item === want[i]);
}

export function readyTicket(world) {
  return world.tickets.find((t) => !t.served && !t.missed && plateMatchesTicket(world.plate, t));
}

export function addFloater(world, x, y, text, color) {
  world.floaters.push({ x, y, text, color, bornAt: world.time });
}

export function burst(world, x, y, color, count) {
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + world.random() * 0.5;
    const speed = 60 + world.random() * 140;
    world.particles.push({
      x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 60,
      color, bornAt: world.time, life: 0.7 + world.random() * 0.4,
    });
  }
}

export function servePlate(world, now) {
  const ticket = readyTicket(world);
  if (!ticket) return false;
  ticket.served = true;
  world.served += 1;
  world.combo += 1;
  world.bestCombo = Math.max(world.bestCombo, world.combo);
  const mult = Math.min(world.combo, 5);
  const earned = ticket.recipe.reward + (mult - 1) * 2;
  world.coins += earned;
  world.plate = [];
  const win = stationById('serve');
  addFloater(world, win.x + win.w / 2 - 110, win.y + win.h + 26, `+${earned} coins`, '#f2b705');
  burst(world, win.x + win.w / 2, win.y + 30, '#f2b705', 26);
  burst(world, win.x + win.w / 2, win.y + 30, '#ffffff', 12);
  world.message = mult >= 3 ? `COMBO x${mult}!` : 'Served!';
  world.messageAt = now;
  return true;
}

// One simulation step (dt seconds). Moves the chef, cooks, spawns and expires tickets.
export function stepWorld(world, dt, input) {
  if (world.screen !== 'play') return;
  world.time += dt;
  world.shiftLeft = Math.max(0, SHIFT_SECONDS - world.time);
  world.rush = world.shiftLeft <= 30;
  if (world.shiftLeft <= 0) {
    endShift(world);
    return;
  }

  // Chef movement, clamped to the open floor.
  const chef = world.chef;
  let mx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let my = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  const len = Math.hypot(mx, my);
  if (len > 0) { mx /= len; my /= len; chef.facing = mx !== 0 ? Math.sign(mx) : chef.facing; }
  chef.x = Math.min(1244, Math.max(36, chef.x + mx * CHEF_SPEED * dt));
  chef.y = Math.min(756, Math.max(340, chef.y + my * CHEF_SPEED * dt));

  // Grill: raw patty cooks, then waits, then burns.
  const grill = world.grill;
  if (grill.state === 'cooking' && world.time - grill.startedAt >= GRILL_SECONDS) {
    grill.state = 'ready';
    addFloater(world, 483, 200, 'Patty ready!', '#6fbf5a');
  } else if (grill.state === 'ready' && world.time - grill.startedAt >= BURN_AFTER_SECONDS) {
    grill.state = 'burnt';
    world.shake = 0.35;
    addFloater(world, 483, 200, 'Burnt!', '#d64541');
  }

  // Fryer: fries finish and wait (they never burn — they just go soggy and slow).
  const fryer = world.fryer;
  if (fryer.state === 'cooking' && world.time - fryer.startedAt >= FRY_SECONDS) {
    fryer.state = 'ready';
    addFloater(world, 669, 200, 'Fries ready!', '#6fbf5a');
  }

  // New orders arrive; the rush shortens the gap.
  world.spawnIn -= dt;
  if (world.spawnIn <= 0 && world.tickets.filter((t) => !t.served && !t.missed).length < MAX_TICKETS) {
    world.tickets.push(newTicket(world.random, world.nextTicketId, world.time));
    world.nextTicketId += 1;
    world.spawnIn = world.rush ? 6 + world.random() * 4 : 9 + world.random() * 6;
  }

  // Expired tickets walk out: combo resets, customer lost.
  for (const ticket of world.tickets) {
    if (!ticket.served && !ticket.missed && world.time >= ticket.expiresAt) {
      ticket.missed = true;
      world.missed += 1;
      world.combo = 0;
      world.message = 'Customer left!';
      world.messageAt = world.time;
      world.shake = 0.25;
    }
  }
  world.tickets = world.tickets.filter((t) => world.time - t.expiresAt < 4 || (!t.served && !t.missed));

  // Floaters and particles age out.
  world.floaters = world.floaters.filter((f) => world.time - f.bornAt < 1.1);
  world.particles = world.particles.filter((p) => world.time - p.bornAt < p.life);
  for (const p of world.particles) {
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt;
  }
  if (world.shake > 0) world.shake = Math.max(0, world.shake - dt);
}

export function endShift(world) {
  world.screen = 'over';
  const stars = world.served >= 14 ? 3 : world.served >= 9 ? 2 : world.served >= 5 ? 1 : 0;
  world.over = { served: world.served, missed: world.missed, coins: world.coins, stars, bestCombo: world.bestCombo };
}

// Interact with the nearest station (E / Space / click). Returns a short event label.
export function interact(world, now) {
  const chef = world.chef;
  const cx = chef.x;
  const cy = chef.y;
  let best = null;
  let bestD = Infinity;
  for (const s of STATIONS) {
    const c = stationCenter(s);
    const d = Math.hypot(c.x - cx, c.y + 30 - cy);
    if (d < bestD) { bestD = d; best = s; }
  }
  const trashD = Math.hypot(TRASH.x + TRASH.w / 2 - cx, TRASH.y + TRASH.h / 2 - cy);
  if (trashD < bestD && trashD < INTERACT_RANGE + 40) {
    chef.carry = [];
    world.plate = [];
    world.message = 'Trashed.';
    world.messageAt = now;
    return 'trash';
  }
  if (!best || bestD > INTERACT_RANGE + 60) return null;

  if (best.kind === 'bin') {
    if (chef.carry.length >= MAX_CARRY) { world.message = 'Hands full!'; world.messageAt = now; return 'full'; }
    chef.carry.push(best.gives);
    return `took ${best.gives}`;
  }
  if (best.kind === 'cycle') {
    if (chef.carry.length >= MAX_CARRY) { world.message = 'Hands full!'; world.messageAt = now; return 'full'; }
    const item = best.gives[world.fridgePick % best.gives.length];
    world.fridgePick += 1;
    chef.carry.push(item);
    return `took ${item}`;
  }
  if (best.kind === 'grill') {
    if (world.grill.state === 'empty') {
      // A patty comes from the grill's own stack: press E to start one cooking.
      world.grill.item = 'patty';
      world.grill.startedAt = now;
      world.grill.state = 'cooking';
      return 'grilling';
    }
    if (world.grill.state === 'ready') {
      if (chef.carry.length >= MAX_CARRY) { world.message = 'Hands full!'; world.messageAt = now; return 'full'; }
      world.grill.state = 'empty';
      world.grill.item = null;
      chef.carry.push('patty');
      return 'took patty';
    }
    if (world.grill.state === 'burnt') {
      world.grill.state = 'empty';
      world.grill.item = null;
      world.message = 'Burnt patty tossed.';
      world.messageAt = now;
      return 'tossed burnt';
    }
    return 'cooking';
  }
  if (best.kind === 'fryer') {
    if (world.fryer.state === 'empty') {
      world.fryer.item = 'fries';
      world.fryer.startedAt = now;
      world.fryer.state = 'cooking';
      return 'frying';
    }
    if (world.fryer.state === 'ready') {
      if (chef.carry.length >= MAX_CARRY) { world.message = 'Hands full!'; world.messageAt = now; return 'full'; }
      world.fryer.state = 'empty';
      world.fryer.item = null;
      chef.carry.push('fries');
      return 'took fries';
    }
    return 'frying';
  }
  if (best.kind === 'assembly') {
    if (chef.carry.length > 0) {
      world.plate.push(chef.carry.shift());
      if (readyTicket(world)) {
        world.message = 'Dish complete — serve it!';
        world.messageAt = now;
      }
      return 'plated';
    }
    return 'empty hands';
  }
  if (best.kind === 'serve') {
    if (world.plate.length > 0 && readyTicket(world)) {
      servePlate(world, now);
      return 'served';
    }
    if (world.plate.length > 0) {
      world.message = 'No ticket wants this dish yet.';
      world.messageAt = now;
      return 'no match';
    }
    world.message = 'Nothing plated to serve.';
    world.messageAt = now;
    return 'nothing';
  }
  return null;
}
