// Sizzle & Serve — keyboard and mouse input, nothing else.
// The game reads one shared input object: held directions plus edge-triggered actions.
export function newInput() {
  return {
    up: false, down: false, left: false, right: false,
    interact: false, // set on keydown / click, cleared by the game loop after it acts
    start: false, // Enter pressed on the title / end screen
    mouse: { x: 0, y: 0, clicked: false },
  };
}

const KEY_MAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
};

export function attachInput(input, element) {
  window.addEventListener('keydown', (event) => {
    const dir = KEY_MAP[event.code];
    if (dir) {
      input[dir] = true;
      event.preventDefault();
      return;
    }
    if (event.code === 'KeyE' || event.code === 'Space') {
      if (!event.repeat) input.interact = true;
      event.preventDefault();
      return;
    }
    if (event.code === 'Enter') {
      if (!event.repeat) input.start = true;
      event.preventDefault();
    }
  });
  window.addEventListener('keyup', (event) => {
    const dir = KEY_MAP[event.code];
    if (dir) input[dir] = false;
  });
  element.addEventListener('mousemove', (event) => {
    const rect = element.getBoundingClientRect();
    input.mouse.x = (event.clientX - rect.left) * (element.width / rect.width);
    input.mouse.y = (event.clientY - rect.top) * (element.height / rect.height);
  });
  element.addEventListener('mousedown', (event) => {
    const rect = element.getBoundingClientRect();
    input.mouse.x = (event.clientX - rect.left) * (element.width / rect.width);
    input.mouse.y = (event.clientY - rect.top) * (element.height / rect.height);
    input.mouse.clicked = true;
    event.preventDefault();
  });
  // Keep the chef still when the window loses focus.
  window.addEventListener('blur', () => {
    input.up = false; input.down = false; input.left = false; input.right = false;
  });
}
