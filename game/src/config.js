// Sizzle & Serve: Bistro Rush — tuning, layout and recipes.
// Every number the game plays by lives here, so a balance pass touches one file.
export const CANVAS = { width: 1280, height: 800 };

export const SHIFT_SECONDS = 180;
export const RUSH_AT_SECONDS_LEFT = 30;
export const MAX_TICKETS = 4;
export const MAX_CARRY = 3;
export const CHEF_SPEED = 300;
export const CHEF_RADIUS = 24;
export const INTERACT_RANGE = 92;

// Grill / fryer timing (seconds). A patty burns if left on the grill past BURN_AFTER.
export const GRILL_SECONDS = 6;
export const BURN_AFTER_SECONDS = 12;
export const FRY_SECONDS = 5;

// A ticket lives this long before the customer walks out.
export const TICKET_MIN_SECONDS = 50;
export const TICKET_MAX_SECONDS = 80;

// Palette: a warm neighbourhood bistro — cream tile, terracotta, wood, leaf green.
export const PALETTE = {
  wall: '#f3e3c2',
  wallTrim: '#d9b380',
  floorA: '#e8cfa8',
  floorB: '#dfc193',
  counterTop: '#b5773f',
  counterSide: '#8a5426',
  steel: '#c9ced6',
  steelDark: '#9aa1ad',
  board: '#2e2a26',
  boardPaper: '#fdf6e3',
  ink: '#2e2a26',
  cream: '#fff7e6',
  green: '#4d9b4d',
  red: '#d64541',
  gold: '#f2b705',
  blue: '#3e7cb1',
};

export const INGREDIENTS = {
  bun:     { name: 'Bun',     color: '#e8b96a', dark: '#b98a3e', key: 'bun' },
  patty:   { name: 'Patty',   color: '#7a4a21', dark: '#4e2c10', key: 'patty' },
  lettuce: { name: 'Lettuce', color: '#6fbf5a', dark: '#3f7d33', key: 'lettuce' },
  tomato:  { name: 'Tomato',  color: '#e05244', dark: '#a92c22', key: 'tomato' },
  cheese:  { name: 'Cheese',  color: '#f6c945', dark: '#c79a17', key: 'cheese' },
  sauce:   { name: 'Sauce',   color: '#f08a1d', dark: '#b35c05', key: 'sauce' },
  fries:   { name: 'Fries',   color: '#f2c14e', dark: '#b98d1e', key: 'fries' },
};

// Recipes: the ticket's name, the exact stack it wants, and its base reward.
export const RECIPES = [
  { id: 'classic',  name: 'Classic Burger', items: ['bun', 'patty', 'lettuce', 'tomato'], reward: 16 },
  { id: 'melt',     name: 'Cheese Melt',    items: ['bun', 'patty', 'cheese', 'sauce'],   reward: 16 },
  { id: 'garden',   name: 'Garden Stack',   items: ['bun', 'lettuce', 'tomato', 'cheese'], reward: 16 },
  { id: 'basket',   name: 'Fry Basket',     items: ['fries', 'sauce'],                     reward: 10 },
  { id: 'double',   name: 'Double Trouble', items: ['bun', 'patty', 'patty', 'cheese'],   reward: 22 },
];

// Stations along the kitchen's top wall. x/y/w/h are canvas pixels.
export const STATIONS = [
  { id: 'bread',    label: 'BREAD',   sub: 'bun',          x: 36,  y: 218, w: 150, h: 96, kind: 'bin',    gives: 'bun' },
  { id: 'fridge',   label: 'FRIDGE',  sub: 'fresh stuff',  x: 202, y: 218, w: 170, h: 96, kind: 'cycle',  gives: ['lettuce', 'tomato', 'cheese'] },
  { id: 'grill',    label: 'GRILL',   sub: 'patty 6s',     x: 388, y: 218, w: 190, h: 96, kind: 'grill' },
  { id: 'fryer',    label: 'FRYER',   sub: 'fries 5s',     x: 594, y: 218, w: 150, h: 96, kind: 'fryer' },
  { id: 'sauce',    label: 'SAUCE',   sub: 'ketchup',      x: 760, y: 218, w: 130, h: 96, kind: 'bin',    gives: 'sauce' },
  { id: 'assembly', label: 'ASSEMBLY', sub: 'build the dish', x: 906, y: 218, w: 180, h: 96, kind: 'assembly' },
  { id: 'serve',    label: 'SERVE',   sub: 'window',       x: 1102, y: 218, w: 142, h: 96, kind: 'serve' },
];

// The trash can sits at the bottom-left of the floor.
export const TRASH = { x: 36, y: 690, w: 120, h: 80 };

// Order board: the ticket rail under the header.
export const BOARD = { x: 24, y: 76, w: 1232, h: 124, ticketW: 292, ticketH: 108, gap: 20 };
