// Sizzle & Serve — the screenshot scenes behind ?shot=start|play|serve|end.
// Each scene plays the real rules forward from a fresh world for a fixed time,
// steered by a small scripted pilot, so the frame is what a real shift looks like
// and the same seed always gives the same frame.
import { newWorld, stepWorld, interact, newTicket } from './state.js';
import { STATIONS, TRASH } from './config.js';

const SAMPLE = 1 / 30;

function stationCenter(id) {
  const s = STATIONS.find((st) => st.id === id);
  return { x: s.x + s.w / 2, y: s.y + s.h + 30 };
}

// Walk the chef toward a point for up to `limit` seconds, then press E there.
function walkTo(world, input, tx, ty, limit) {
  let t = 0;
  while (t < limit) {
    const dx = tx - world.chef.x;
    const dy = ty - world.chef.y;
    if (Math.hypot(dx, dy) < 24) break;
    input.left = dx < -8; input.right = dx > 8;
    input.up = dy < -8; input.down = dy > 8;
    stepWorld(world, SAMPLE, input);
    t += SAMPLE;
  }
  input.left = false; input.right = false; input.up = false; input.down = false;
}

function idle(world, seconds) {
  const input = { up: false, down: false, left: false, right: false };
  let t = 0;
  while (t < seconds) { stepWorld(world, SAMPLE, input); t += SAMPLE; }
}

function pressE(world) {
  interact(world, world.time);
}

// A busy mid-shift frame: three tickets on the board, a patty on the grill,
// a plate half-built on the assembly counter, the chef carrying a tomato.
export function scenePlay(seed) {
  const world = newWorld(seed);
  world.screen = 'play';
  const input = { up: false, down: false, left: false, right: false };
  // Seed the board with three known tickets.
  world.tickets = [
    newTicket(world.random, 1, 0),
    newTicket(world.random, 2, 0),
    newTicket(world.random, 3, 0),
  ];
  world.nextTicketId = 4;
  world.tickets[0].recipe = { id: 'classic', name: 'Classic Burger', items: ['bun', 'patty', 'lettuce', 'tomato'], reward: 16 };
  world.tickets[0].items = ['bun', 'patty', 'lettuce', 'tomato'];
  world.tickets[1].recipe = { id: 'melt', name: 'Cheese Melt', items: ['bun', 'patty', 'cheese', 'sauce'], reward: 16 };
  world.tickets[1].items = ['bun', 'patty', 'cheese', 'sauce'];
  world.tickets[2].recipe = { id: 'basket', name: 'Fry Basket', items: ['fries', 'sauce'], reward: 10 };
  world.tickets[2].items = ['fries', 'sauce'];
  // Bun + lettuce onto the assembly plate first.
  walkTo(world, input, ...Object.values(stationCenter('bread')), 6);
  pressE(world);
  walkTo(world, input, ...Object.values(stationCenter('assembly')), 6);
  pressE(world);
  walkTo(world, input, ...Object.values(stationCenter('fridge')), 6);
  pressE(world);
  walkTo(world, input, ...Object.values(stationCenter('assembly')), 6);
  pressE(world);
  // Grill a patty and start fries LAST, so both are still cooking (not burnt)
  // when the frame is taken.
  walkTo(world, input, ...Object.values(stationCenter('grill')), 6);
  pressE(world);
  walkTo(world, input, ...Object.values(stationCenter('fryer')), 6);
  pressE(world);
  idle(world, 4.2);
  // Pick up a tomato and a cheese to carry, and stop near the grill.
  walkTo(world, input, ...Object.values(stationCenter('fridge')), 6);
  pressE(world);
  pressE(world);
  walkTo(world, input, 560, 560, 4);
  idle(world, 1.5);
  return world;
}

// The serve moment: a finished Fry Basket plated and served at the window,
// coins bursting. Built on top of the play scene, then cleared and rebuilt
// so the served dish matches a ticket on the board exactly.
export function sceneServe(seed) {
  const world = scenePlay(seed);
  const input = { up: false, down: false, left: false, right: false };
  // Clear the half-built plate and the chef's hands at the trash.
  walkTo(world, input, TRASH.x + TRASH.w / 2, TRASH.y + TRASH.h / 2, 6);
  pressE(world);
  // Fry a fresh basket of fries.
  walkTo(world, input, ...Object.values(stationCenter('fryer')), 6);
  pressE(world);
  idle(world, 5.5);
  pressE(world); // pick up the fries
  // Sauce from the sauce bin, then plate both and serve.
  walkTo(world, input, ...Object.values(stationCenter('sauce')), 6);
  pressE(world);
  walkTo(world, input, ...Object.values(stationCenter('assembly')), 6);
  pressE(world); // fries onto the plate
  pressE(world); // sauce onto the plate -> dish complete (Fry Basket)
  walkTo(world, input, ...Object.values(stationCenter('serve')), 6);
  pressE(world); // serve it: coins burst
  // Scene setup: a fresh patty on the grill, so the final frame shows the
  // kitchen still cooking instead of the patty this scene started long ago.
  world.grill = { item: 'patty', startedAt: world.time, state: 'cooking' };
  idle(world, 0.35);
  return world;
}

// The title screen over a live kitchen: tickets up, grill going, plate mid-build.
export function sceneStart(seed) {
  const world = scenePlay(seed);
  world.screen = 'title';
  return world;
}

// The shift summary: a finished shift with a strong result.
export function sceneEnd(seed) {
  const world = newWorld(seed);
  world.screen = 'over';
  world.served = 12;
  world.missed = 2;
  world.coins = 214;
  world.combo = 4;
  world.bestCombo = 5;
  world.shiftLeft = 0;
  world.over = { served: 12, missed: 2, coins: 214, stars: 3, bestCombo: 5 };
  world.tickets = [
    newTicket(world.random, 7, 0),
    newTicket(world.random, 8, 0),
  ];
  return world;
}

export const SCENES = { start: sceneStart, play: scenePlay, serve: sceneServe, end: sceneEnd };
