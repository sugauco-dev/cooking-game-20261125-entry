// Sizzle & Serve — the entrypoint: hands the game in.
// Copies game/ and screenshots/ from this repository into /output and writes
// /output/dossier.json with the kit's buildDossier, so the sealed scorer can
// check the entry byte for byte. Node 22 standard library only, no network.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildDossier } from './vendor/makefun-game.ts';

const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';
const rootDir = new URL('.', import.meta.url).pathname;

const dossierCaps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
};

function copyTree(name: string): void {
  const from = join(rootDir, name);
  const to = join(outDir, name);
  if (!existsSync(from)) throw new Error(`missing ${name}/ in the repository`);
  cpSync(from, to, { recursive: true });
}

function listFiles(dir: string, base = ''): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) found.push(...listFiles(join(dir, entry.name), rel));
    else if (entry.isFile()) found.push(rel);
  }
  return found;
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
copyTree('game');
copyTree('screenshots');

const gameFiles = listFiles(join(outDir, 'game'));
const shotFiles = listFiles(join(outDir, 'screenshots'));
console.log(`game/: ${gameFiles.length} files`);
console.log(`screenshots/: ${shotFiles.join(', ')}`);

writeFileSync(join(outDir, 'dossier.json'), buildDossier(outDir, dossierCaps));
console.log('dossier.json written');
