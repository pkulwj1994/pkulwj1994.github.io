import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { localizeContent } from './i18n.mjs';

export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g,
  char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export function assetPath(root, value) {
  if (typeof value !== 'string' || !value.startsWith('assets/') || value.includes('\\') ||
      value.split('/').some(part => part === '..' || part === '.' || !part)) {
    throw new Error('use a file inside assets/, without .. or backslashes');
  }
  const file = path.resolve(root, value);
  if (!existsSync(file) || !statSync(file).isFile()) throw new Error(`missing file: ${value}`);
  return file;
}

export function validateUrl(value, root, { local = false, mail = false, anchor = false } = {}) {
  if (typeof value !== 'string') throw new Error('must be a URL');
  if (local && value.startsWith('assets/')) return assetPath(root, value);
  if (anchor && /^#[a-z][a-z0-9-]*$/.test(value)) return value;
  if (mail && /^mailto:[^\s<>]+@[^\s<>]+$/.test(value)) return value;
  if (!/^https?:\/\//i.test(value)) throw new Error('use an https:// URL or an existing assets/ file');
  const parsed = new URL(value);
  if (!parsed.hostname) throw new Error('must include a hostname');
  return value;
}

// Small formatting vocabulary for migrated biography, news, and talk content.
// Publication metadata stays plain text and is escaped during rendering.
export function richText(value, root) {
  if (typeof value !== 'string') throw new Error('must be an HTML string');
  for (const token of value.match(/<[^>]*>/g) || []) {
    if (/^<\/?(?:strong|b|em)>$|^<br\s*\/?>$|^<\/a>$|^<\/span>$/.test(token)) continue;
    if (/^<span class=["']gradient-text["']>$/.test(token)) continue;
    if (/^<a\s/.test(token)) {
      const attributes = token.slice(2, -1);
      const expression = /\s+([a-z-]+)=(?:"([^"]*)"|'([^']*)')/g;
      const matches = [...attributes.matchAll(expression)];
      if (!matches.length || attributes.replace(expression, '').trim()) throw new Error(`unsupported link markup: ${token}`);
      for (const match of matches) {
        const [, name, doubleQuoted, singleQuoted] = match;
        const text = doubleQuoted ?? singleQuoted;
        if (!['href', 'target', 'rel', 'title'].includes(name)) throw new Error(`unsupported link attribute: ${name}`);
        if (name === 'href') validateUrl(text, root, { local: true, mail: true, anchor: true });
      }
      continue;
    }
    throw new Error(`unsupported HTML tag: ${token}`);
  }
  return value;
}

export function loadContent(root, language = 'en') {
  function json(file) {
    try { return JSON.parse(readFileSync(path.join(root, file), 'utf8')); }
    catch (error) { throw new Error(`${file}: ${error.message}`); }
  }
  return localizeContent({
    site: json('content/site.json'), home: json('content/home.json'),
    news: json('content/news.json'), talks: json('content/talks.json'), people: json('content/people.json'),
    papers: readdirSync(path.join(root, 'content/papers')).filter(name => name.endsWith('.json')).sort()
      .map(name => ({ ...json(`content/papers/${name}`), _file: `content/papers/${name}` }))
  }, language);
}

export function validateContent(data, root) {
  const errors = [];
  const fail = (where, message) => errors.push(`${where}: ${message}`);
  const attempt = (where, fn) => { try { fn(); } catch (error) { fail(where, error.message); } };
  const text = (value, where, optional = false) => {
    if (optional && (value === undefined || value === '')) return;
    if (typeof value !== 'string' || !value.trim()) fail(where, 'must be a nonempty string');
  };
  const array = (value, where) => {
    if (Array.isArray(value)) return value;
    fail(where, 'must be an array'); return [];
  };
  const object = (value, where) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) return value;
    fail(where, 'must be an object'); return {};
  };
  const bool = (value, where) => { if (value !== undefined && typeof value !== 'boolean') fail(where, 'must be true or false'); };
  const id = (value, where) => { if (typeof value !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) fail(where, 'use a lowercase slug, e.g. my-paper-2026'); };
  const date = (value, where) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) {
      fail(where, 'use a real YYYY-MM-DD date');
    }
  };
  const unique = (items, where) => {
    const seen = new Set();
    items.forEach(item => { if (seen.has(item.id)) fail(where, `duplicate id: ${item.id}`); seen.add(item.id); });
  };

  const site = object(data.site, 'content/site.json');
  for (const key of ['name', 'displayName', 'degree', 'title', 'description', 'publicationTitle', 'publicationDescription', 'footerTagline']) text(site[key], `content/site.json.${key}`);
  if (typeof site.email !== 'string' || !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(site.email)) fail('content/site.json.email', 'use an email address');
  text(site.wechat, 'content/site.json.wechat', true);
  for (const key of ['baseUrl', 'scholar', 'github']) attempt(`content/site.json.${key}`, () => validateUrl(site[key], root));
  for (const key of ['portrait', 'favicon']) attempt(`content/site.json.${key}`, () => assetPath(root, site[key]));
  const navigation = object(site.navigation, 'content/site.json.navigation');
  for (const key of ['about', 'research', 'publications', 'contact']) text(navigation[key], `content/site.json.navigation.${key}`);

  const home = object(data.home, 'content/home.json');
  const required = {
    announcement: ['text', 'linkLabel'],
    hero: ['eyebrow', 'statementHtml', 'descriptionHtml', 'primaryLabel', 'scholarLabel', 'portraitAlt', 'role', 'affiliation', 'location', 'journeyLabel'],
    research: ['eyebrow', 'titleHtml', 'intro', 'detailLabel', 'descriptionHtml'],
    selected: ['eyebrow', 'title', 'linkLabel'], about: ['eyebrow', 'titleHtml', 'biographyHtml'],
    news: ['eyebrow', 'title', 'label', 'archiveLabel'], talks: ['eyebrow', 'title'],
    community: ['eyebrow', 'title', 'serviceHtml', 'collaboratorLabel', 'studentLabel', 'studentIntro'],
    contact: ['eyebrow', 'titleHtml', 'descriptionHtml', 'buttonLabel', 'quote', 'quoteAuthor'],
    publications: ['eyebrow', 'titleHtml', 'introHtml', 'scholarLabel', 'searchPlaceholder', 'footnote']
  };
  for (const [section, fields] of Object.entries(required)) {
    const value = object(home[section], `content/home.json.${section}`);
    for (const field of fields) {
      const where = `content/home.json.${section}.${field}`;
      text(value[field], where);
      if (field.endsWith('Html')) attempt(where, () => richText(value[field], root));
    }
  }
  for (const [section, key] of [['selected', 'limit'], ['news', 'latestCount']]) {
    if (section === 'selected' && home[section]?.[key] == null) continue;
    if (!Number.isSafeInteger(home[section]?.[key]) || home[section][key] < 1) fail(`content/home.json.${section}.${key}`, 'must be a positive integer');
  }
  text(home.hero?.heading, 'content/home.json.hero.heading', true);
  array(home.hero?.affiliations, 'content/home.json.hero.affiliations').forEach((item, i) => {
    text(item.label, `home.hero.affiliations[${i}].label`);
    attempt(`home.hero.affiliations[${i}].url`, () => validateUrl(item.url, root));
  });
  array(home.about?.education, 'content/home.json.about.education').forEach((item, i) => {
    for (const key of ['degree', 'school', 'subject']) text(item[key], `home.about.education[${i}].${key}`);
  });
  array(home.research?.topics, 'content/home.json.research.topics').forEach((topic, i) => {
    const where = `home.research.topics[${i}]`;
    if (!['understanding', 'generation', 'alignment'].includes(topic.id)) fail(where + '.id', 'choose understanding, generation, or alignment');
    if (!['blue', 'dark', 'lilac'].includes(topic.tone)) fail(where + '.tone', 'choose blue, dark, or lilac');
    text(topic.eyebrow, where + '.eyebrow'); text(topic.description, where + '.description');
    attempt(where + '.titleHtml', () => richText(topic.titleHtml, root));
  });

  const papers = array(data.papers, 'content/papers/'); unique(papers, 'content/papers/');
  papers.forEach(paper => {
    const where = paper._file || `paper ${paper.id}`;
    id(paper.id, where + '.id'); bool(paper.published, where + '.published'); bool(paper.featured, where + '.featured');
    if (paper._file && path.basename(paper._file) !== `${paper.id}.json`) fail(where, 'filename must match id + .json');
    if (paper.order !== undefined && (!Number.isSafeInteger(paper.order) || paper.order < 0)) fail(where + '.order', 'must be a nonnegative integer');
    if (paper.date !== undefined) date(paper.date, where + '.date');
    if (!Number.isSafeInteger(paper.year) || paper.year < 1000 || paper.year > 9999) fail(where + '.year', 'must be a four-digit integer');
    if (typeof paper.date === 'string' && String(paper.year) !== paper.date.slice(0, 4)) fail(where + '.date', 'date and year must agree');
    if (paper.published !== false) {
      text(paper.title, where + '.title'); text(paper.status, where + '.status');
      const authors = array(paper.authors, where + '.authors');
      if (!authors.length) fail(where + '.authors', 'add at least one author');
      authors.forEach((author, i) => text(author, `${where}.authors[${i}]`));
    }
    text(paper.summary, where + '.summary', true); text(paper.bibtex, where + '.bibtex', true);
    array(paper.links ?? [], where + '.links').forEach((link, i) => {
      text(link.label, `${where}.links[${i}].label`);
      attempt(`${where}.links[${i}].url`, () => validateUrl(link.url, root, { local: true }));
    });
    if (paper.cover !== undefined) {
      const cover = object(paper.cover, where + '.cover');
      if (cover.kind !== 'image') fail(where + '.cover.kind', 'use image, or omit cover');
      attempt(where + '.cover.image', () => assetPath(root, cover.image));
      if (!/\.(png|jpe?g|webp|gif|svg)$/i.test(cover.image || '')) fail(where + '.cover.image', 'use PNG, JPG, WebP, GIF, or SVG');
      text(cover.alt, where + '.cover.alt');
      text(cover.caption, where + '.cover.caption', true);
      if (cover.poster !== undefined) {
        attempt(where + '.cover.poster', () => assetPath(root, cover.poster));
        if (!/\.(png|jpe?g|webp|svg)$/i.test(cover.poster || '')) fail(where + '.cover.poster', 'use a static PNG, JPG, WebP, or SVG');
        if (cover.poster === cover.image) fail(where + '.cover.poster', 'use a separate static poster for the animation');
      }
    }
    if (paper.news !== undefined) {
      const news = object(paper.news, where + '.news');
      date(news.date || paper.date, where + '.news.date'); text(news.text, where + '.news.text');
    }
  });

  for (const kind of ['news', 'talks']) {
    const records = array(data[kind], `content/${kind}.json`); unique(records, `content/${kind}.json`);
    records.forEach((record, i) => {
      const where = `content/${kind}.json[${i}]`;
      id(record.id, where + '.id'); bool(record.visible, where + '.visible');
      if (kind === 'news') {
        date(record.date, where + '.date');
        if (record.url) attempt(where + '.url', () => validateUrl(record.url, root, { local: true }));
      }
      if (record.html !== undefined) attempt(where + '.html', () => richText(record.html, root));
      else text(record.text, where + '.text');
    });
  }
  const people = object(data.people, 'content/people.json');
  for (const group of ['collaborators', 'students']) {
    const records = array(people[group], `content/people.json.${group}`); unique(records, `people.${group}`);
    records.forEach((person, i) => {
      const where = `content/people.json.${group}[${i}]`;
      id(person.id, where + '.id'); text(person.name, where + '.name'); bool(person.visible, where + '.visible');
      attempt(where + '.bioHtml', () => richText(person.bioHtml, root));
      if (person.website) attempt(where + '.website', () => validateUrl(person.website, root));
    });
  }
  if (errors.length) throw new Error('Content validation failed:\n' + errors.map(error => `  • ${error}`).join('\n'));
  return data;
}

function comparePaperDates(a, b) {
  return b.year - a.year || (b.date || '').localeCompare(a.date || '') || a.id.localeCompare(b.id);
}

export function visiblePapers(papers) {
  return papers.filter(paper => paper.published !== false).sort((a, b) =>
    (a.order ?? Infinity) - (b.order ?? Infinity) || comparePaperDates(a, b));
}

export function selectedPapers(papers, { limit } = {}) {
  const selected = papers.filter(paper => paper.published !== false && paper.featured).sort(comparePaperDates);
  return limit == null ? selected : selected.slice(0, limit);
}

export function visibleNews(data) {
  const announcements = visiblePapers(data.papers).filter(paper => paper.news).map(paper => ({
    id: `paper-${paper.id}`, date: paper.news.date || paper.date,
    text: paper.news.text, url: paper.links?.[0]?.url
  }));
  return [...data.news.filter(news => news.visible !== false), ...announcements]
    .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
}
