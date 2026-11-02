import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { projectRoot } from './build.mjs';

export function addPaper(root, id, now = new Date()) {
  if (typeof id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
    throw new Error('Use a lowercase ID, e.g. npm run add:paper -- my-paper-2026');
  }
  const paper = JSON.parse(readFileSync(path.join(root, 'examples/paper.json'), 'utf8'));
  const date = now.toISOString().slice(0, 10);
  Object.assign(paper, { id, date, year: Number(date.slice(0, 4)), published: false });
  const file = path.join(root, 'content/papers', `${id}.json`);
  mkdirSync(path.dirname(file), { recursive: true });
  try { writeFileSync(file, JSON.stringify(paper, null, 2) + '\n', { flag: 'wx' }); }
  catch (error) {
    if (error.code === 'EEXIST') throw new Error(`Paper already exists: content/papers/${id}.json`);
    throw error;
  }
  return file;
}

if (typeof process !== 'undefined' && process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [kind, id] = process.argv.slice(2);
    if (kind !== 'paper') throw new Error('Usage: npm run add:paper -- my-paper-2026');
    addPaper(projectRoot, id);
    console.log(`Created content/papers/${id}.json. Fill in the fields and set published to true.`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
