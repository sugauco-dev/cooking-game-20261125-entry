// Sizzle & Serve — boot and the main loop: title, play, shift over.
// A ?shot=start|play|serve|end URL renders one deterministic scene instead,
// so the game's own code draws the screenshots the entry hands in.
import { CANVAS } from './config.js';
import { newWorld, stepWorld, interact, endShift } from './state.js';
import { newInput, attachInput } from './input.js';
import { drawWorld } from './render.js';
import { newAudio, sfx } from './audio.js';
import { SCENES } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS.width;
canvas.height = CANVAS.height;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || '7');

const input = newInput();
const audio = newAudio();
let world;

if (shot && SCENES[shot]) {
  // Screenshot mode: one fixed frame, no loop, no input.
  world = SCENES[shot](seed);
  drawWorld(ctx, world);
} else {
  world = newWorld((Date.now() % 2147483647) || 7);
  attachInput(input, canvas);
  let last = performance.now();

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    if (input.start) {
      input.start = false;
      if (world.screen === 'title') {
        world = newWorld((Date.now() % 2147483647) || 7);
        world.screen = 'play';
        sfx.click(audio);
      } else if (world.screen === 'over') {
        world = newWorld((Date.now() % 2147483647) || 7);
        world.screen = 'play';
        sfx.click(audio);
      }
    }

    if (world.screen === 'play') {
      if (input.mouse.clicked) {
        input.mouse.clicked = false;
        // Clicking the floor walks the chef there, then the click interacts.
        const mx = input.mouse.x;
        const my = input.mouse.y;
        if (my > 330 && my < 780 && mx > 20 && mx < 1260) {
          world.chef.x = Math.min(1244, Math.max(36, mx));
          world.chef.y = Math.min(756, Math.max(340, my));
          input.interact = true;
        }
      }
      if (input.interact) {
        input.interact = false;
        const event = interact(world, world.time);
        if (event === 'grilling' || event === 'frying') sfx.grillStart(audio);
        else if (event && event.startsWith('took')) sfx.take(audio);
        else if (event === 'plated') sfx.plate(audio);
        else if (event === 'served') sfx.serve(audio);
        else if (event === 'tossed burnt') sfx.burn(audio);
        else if (event === 'full' || event === 'no match') sfx.miss(audio);
      }
      stepWorld(world, dt, input);
    }

    drawWorld(ctx, world);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// Expose the world for debugging from the console.
window.__sizzle = { world: () => world };
