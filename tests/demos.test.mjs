import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { projectRoot, clientSource } from '../scripts/build.mjs';
import { loadContent, validateContent, selectedPapers } from '../src/content.mjs';
import { renderSelected, renderPaper } from '../src/render.mjs';

function readGif(buffer) {
  assert.match(buffer.subarray(0, 6).toString(), /^GIF8[79]a$/);
  const width = buffer.readUInt16LE(6), height = buffer.readUInt16LE(8);
  let offset = 13, frames = 0, loop = null;
  const delays = [];
  if (buffer[10] & 128) offset += 3 * 2 ** ((buffer[10] & 7) + 1);
  const skipBlocks = () => { while (buffer[offset]) offset += buffer[offset] + 1; offset += 1; };
  while (offset < buffer.length) {
    const marker = buffer[offset++];
    if (marker === 0x3b) break;
    if (marker === 0x21) {
      const type = buffer[offset++];
      if (type === 0xf9) delays.push(buffer.readUInt16LE(offset + 2));
      if (type === 0xff && buffer.subarray(offset + 1, offset + 12).toString() === 'NETSCAPE2.0') {
        const start = offset + buffer[offset] + 1;
        if (buffer[start] === 3 && buffer[start + 1] === 1) loop = buffer.readUInt16LE(start + 2);
      }
      skipBlocks();
    } else if (marker === 0x2c) {
      const packed = buffer[offset + 8]; offset += 9;
      if (packed & 128) offset += 3 * 2 ** ((packed & 7) + 1);
      offset += 1; skipBlocks(); frames += 1;
    } else throw new Error(`Unexpected GIF block: ${marker}`);
  }
  return { width, height, frames, loop, delays };
}

test('each selected paper has a real looping GIF and a matching static poster', () => {
  const data = validateContent(loadContent(projectRoot), projectRoot);
  const selected = selectedPapers(data.papers, data.home.selected);
  assert.ok(selected.length > 0);
  for (const paper of selected) {
    const gif = readFileSync(path.join(projectRoot, paper.cover.image));
    const png = readFileSync(path.join(projectRoot, paper.cover.poster));
    const metadata = readGif(gif);
    assert.equal(metadata.width, 800);
    assert.equal(metadata.height, 480);
    assert.equal(metadata.frames, 48);
    assert.equal(metadata.loop, 0);
    assert.equal(metadata.delays.length, 48);
    assert.ok(metadata.delays.every(delay => delay === 10));
    assert.ok(gif.length < 400 * 1024, 'animation should remain lightweight');
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(png.readUInt32BE(16), metadata.width);
    assert.equal(png.readUInt32BE(20), metadata.height);
    assert.match(paper.cover.caption, /Method illustration/);
  }
});

test('selected and bibliography demos render static fallbacks and separate controls', () => {
  const data = loadContent(projectRoot);
  const html = renderSelected(data.papers, data.home.selected);
  const selected = selectedPapers(data.papers, data.home.selected);
  const animations = selected.filter(paper => paper.cover?.poster).length;
  assert.equal((html.match(/data-paper-demo /g) || []).length, animations);
  assert.equal((html.match(/class="demo-toggle"/g) || []).length, animations);
  assert.equal((html.match(/src="assets\/papers\/[^" ]+-poster\.png"/g) || []).length, animations);
  assert.doesNotMatch(html, /<a[^>]*class="featured-paper"[^>]*>[\s\S]*?<button/);
  const paper = data.papers.find(paper => paper.id === 'tdm-r1-2026');
  const bibliography = renderPaper(paper, data.site);
  assert.match(bibliography, /class="paper-demo publication-demo"/);
  assert.match(bibliography, /aria-controls="demo-publication-tdm-r1-2026"/);
  assert.match(bibliography, /aria-pressed="false"[\s\S]*? hidden/);
});

function playerEnvironment({ reduced = false, observer = false, language = 'en' } = {}) {
  function emitter(extra = {}) {
    return Object.assign({ listeners: {}, addEventListener(name, fn) { (this.listeners[name] ||= []).push(fn); }, emit(name) { for (const fn of this.listeners[name] || []) fn(); } }, extra);
  }
  const media = emitter({ matches: reduced });
  const elements = Array.from({ length: 3 }, (_, index) => {
    const image = emitter({ attrs: { src: `poster-${index}.png` }, getAttribute(name) { return this.attrs[name]; }, setAttribute(name, value) { this.attrs[name] = value; } });
    const button = emitter({ hidden: true, attrs: {}, setAttribute(name, value) { this.attrs[name] = value; } });
    const label = { textContent: 'Play' };
    return { dataset: { animation: `demo-${index}.gif`, poster: `poster-${index}.png`, paperTitle: `Paper ${index}` }, image, button, label,
      querySelector(selector) { return { '.paper-demo-image': image, '.demo-toggle': button, '[data-demo-label]': label }[selector]; } };
  });
  const document = emitter({ hidden: false, documentElement: { lang: language, classList: { add() {} } }, querySelector: () => null,
    querySelectorAll: selector => selector === '[data-paper-demo]' ? elements : [] });
  let observerCallback;
  const window = { matchMedia: () => media };
  if (observer) window.IntersectionObserver = class { constructor(fn) { observerCallback = fn; } observe() {} };
  vm.runInNewContext(clientSource(), { document, window });
  return { elements, document, media, intersect(index, visible) { observerCallback([{ target: elements[index], isIntersecting: visible }]); } };
}

test('play and pause are independent, and manual pause survives tab visibility changes', () => {
  const env = playerEnvironment();
  assert.ok(env.elements.every(player => player.dataset.playing === 'true'));
  env.elements[0].button.emit('click');
  assert.equal(env.elements[0].image.attrs.src, 'poster-0.png');
  assert.equal(env.elements[1].image.attrs.src, 'demo-1.gif');
  assert.equal(env.elements[0].button.attrs['aria-pressed'], 'false');
  env.document.hidden = true; env.document.emit('visibilitychange');
  assert.ok(env.elements.every(player => player.dataset.playing === 'false'));
  env.document.hidden = false; env.document.emit('visibilitychange');
  assert.equal(env.elements[0].image.attrs.src, 'poster-0.png');
  assert.equal(env.elements[1].image.attrs.src, 'demo-1.gif');
  env.elements[0].button.emit('click');
  assert.equal(env.elements[0].image.attrs.src, 'demo-0.gif');
  assert.match(env.elements[0].button.attrs['aria-label'], /^Pause animation for Paper 0/);
});

test('reduced-motion users see posters and can explicitly play an individual demo', () => {
  const env = playerEnvironment({ reduced: true });
  assert.ok(env.elements.every(player => player.dataset.playing === 'false'));
  env.elements[1].button.emit('click');
  assert.equal(env.elements[1].image.attrs.src, 'demo-1.gif');
  assert.equal(env.elements[0].image.attrs.src, 'poster-0.png');
  env.media.matches = false; env.media.emit('change');
  assert.ok(env.elements.every(player => player.dataset.playing === 'true'));
  env.media.matches = true; env.media.emit('change');
  assert.ok(env.elements.every(player => player.dataset.playing === 'false'));
});

test('offscreen demos pause and return to the intended state on reentry', () => {
  const env = playerEnvironment({ observer: true });
  assert.ok(env.elements.every(player => player.dataset.playing === 'false'));
  env.intersect(0, true);
  assert.equal(env.elements[0].image.attrs.src, 'demo-0.gif');
  assert.equal(env.elements[1].image.attrs.src, 'poster-1.png');
  env.elements[0].button.emit('click');
  env.intersect(0, false); env.intersect(0, true);
  assert.equal(env.elements[0].image.attrs.src, 'poster-0.png');
  env.intersect(1, true); env.intersect(1, false);
  assert.equal(env.elements[1].image.attrs.src, 'poster-1.png');
  env.intersect(1, true);
  assert.equal(env.elements[1].image.attrs.src, 'demo-1.gif');
});

test('a failed animation falls back to its poster without affecting other demos', () => {
  const env = playerEnvironment();
  env.elements[0].image.emit('error');
  assert.equal(env.elements[0].image.attrs.src, 'poster-0.png');
  assert.equal(env.elements[0].button.hidden, true);
  assert.equal(env.elements[1].image.attrs.src, 'demo-1.gif');
});

test('Chinese demo controls retain playback behaviour and accessible labels', () => {
  const env = playerEnvironment({ language: 'zh-CN' });
  assert.equal(env.elements[0].label.textContent, '暂停');
  assert.match(env.elements[0].button.attrs['aria-label'], /^暂停《Paper 0》/);
  env.elements[0].button.emit('click');
  assert.equal(env.elements[0].label.textContent, '播放');
  assert.match(env.elements[0].button.attrs['aria-label'], /^播放《Paper 0》/);
  assert.equal(env.elements[0].image.attrs.src, 'poster-0.png');
});
