/* Generated from src/client.js and src/i18n.mjs. Run npm run build. */
const SITE_MESSAGES = {"en":{"skip":"Skip to content","mainNavigation":"Main navigation","languageNavigation":"Language","home":"home","openNavigation":"Open navigation","closeNavigation":"Close navigation","socials":"Social links","scholar":"Google Scholar","email":"Email","wechat":"WeChat","researchEducation":"Research and education","education":"Education","readPaper":"Read paper","readMore":"Read more","updates":"{count} updates","people":"{count} people","bibliography":"Selected publication bibliography","filterYear":"Filter publications by year","allWork":"All work","searchLabel":"Search publications by title, author, or venue","emptyTitle":"No matching publications.","emptyBody":"Try another keyword or choose a different year.","resetFilters":"Clear filters","publication":"{count} publication","publications":"{count} publications","filteredPublications":"{count} publications of {total}","filteredPublication":"{count} publication of {total}","exploreResearch":"Explore the research","play":"Play","pause":"Pause","playAnimation":"Play animation for {title}","pauseAnimation":"Pause animation for {title}"},"zh":{"skip":"跳转到正文","mainNavigation":"主导航","languageNavigation":"语言","home":"首页","openNavigation":"展开导航","closeNavigation":"收起导航","socials":"学术与社交链接","scholar":"Google 学术","email":"邮箱","wechat":"微信","researchEducation":"研究与教育经历","education":"教育经历","readPaper":"阅读论文","readMore":"了解更多","updates":"{count} 条动态","people":"{count} 人","bibliography":"论文列表","filterYear":"按发表年份筛选","allWork":"全部论文","searchLabel":"按中英文标题、作者或会议期刊搜索论文","emptyTitle":"没有找到匹配的论文","emptyBody":"试试其他关键词，或选择不同的年份。","resetFilters":"清除筛选","publication":"{count} 篇论文","publications":"{count} 篇论文","filteredPublications":"{count} / {total} 篇论文","filteredPublication":"{count} / {total} 篇论文","exploreResearch":"探索研究方向","play":"播放","pause":"暂停","playAnimation":"播放《{title}》的方法动图","pauseAnimation":"暂停《{title}》的方法动图"}};
/* Progressive enhancement: content and archive disclosures work without JS. */
document.documentElement.classList.add('js-enabled');
const interfaceLanguage = String(document.documentElement.lang || 'en').startsWith('zh') ? 'zh' : 'en';
const interfaceMessages = SITE_MESSAGES[interfaceLanguage];
const formatInterface = (template, values) => template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''));

// Native links keep language switching functional without JavaScript.
for (const languageLink of document.querySelectorAll('.language-link')) {
  languageLink.addEventListener('click', () => { languageLink.hash = window.location.hash; });
}

const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('#navigation-links');

if (menuButton && menu) {
  const mobileLayout = window.matchMedia('(max-width: 560px)');

  function setMenu(open, restoreFocus = false) {
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? interfaceMessages.closeNavigation : interfaceMessages.openNavigation);
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    menu.inert = mobileLayout.matches && !open;
    if (restoreFocus) menuButton.focus();
  }

  function syncMenu() {
    setMenu(false);
    menu.inert = mobileLayout.matches;
  }

  menuButton.addEventListener('click', () => {
    setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
  });
  menu.addEventListener('click', event => {
    if (event.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (menuButton.getAttribute('aria-expanded') !== 'true') return;
    if (event.key === 'Escape') {
      setMenu(false, true);
      return;
    }
    if (event.key === 'Tab' && mobileLayout.matches) {
      const links = [...menu.querySelectorAll('a')];
      const last = links[links.length - 1];
      if (event.shiftKey && document.activeElement === menuButton) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        menuButton.focus();
      }
    }
  });
  menu.addEventListener('focusout', event => {
    if (!mobileLayout.matches || !event.relatedTarget) return;
    if (!menu.contains(event.relatedTarget) && event.relatedTarget !== menuButton) setMenu(false);
  });
  mobileLayout.addEventListener('change', syncMenu);
  syncMenu();
}

const publicationList = document.querySelector('#publication-list');

if (publicationList) {
  const items = [...publicationList.querySelectorAll('.publication-entry')];
  const filterButtons = [...document.querySelectorAll('[data-year-filter]')];
  const search = document.querySelector('#publication-search');
  const count = document.querySelector('#results-count');
  const emptyState = document.querySelector('#empty-results');
  const reset = document.querySelector('#reset-filters');
  let selectedYear = 'all';
  const normalize = value => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const searchableItems = items.map(item => ({ item, text: normalize(item.textContent + ' ' + (item.dataset.searchText || '')) }));

  function updatePublications() {
    const terms = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
    let visible = 0;
    for (const { item, text } of searchableItems) {
      const matchesYear = selectedYear === 'all' || item.dataset.year === selectedYear;
      item.hidden = !(matchesYear && terms.every(term => text.includes(term)));
      if (!item.hidden) visible += 1;
    }
    for (const button of filterButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.yearFilter === selectedYear));
    }
    const countTemplate = visible !== items.length
      ? (visible === 1 ? interfaceMessages.filteredPublication : interfaceMessages.filteredPublications)
      : (visible === 1 ? interfaceMessages.publication : interfaceMessages.publications);
    count.textContent = formatInterface(countTemplate, { count: visible, total: items.length });
    emptyState.hidden = visible > 0;
    publicationList.hidden = visible === 0;
  }

  for (const button of filterButtons) {
    button.addEventListener('click', () => {
      selectedYear = button.dataset.yearFilter;
      updatePublications();
    });
  }
  search.addEventListener('input', updatePublications);
  reset.addEventListener('click', () => {
    selectedYear = 'all';
    search.value = '';
    updatePublications();
    search.focus();
  });
  document.querySelector('.publication-tools').hidden = false;
  updatePublications();
}

// Each GIF has its own static poster and independent play/pause state.
// No fetch, modules, or backend: local file previews work too.
const demoElements = [...document.querySelectorAll('[data-paper-demo]')];

if (demoElements.length) {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const observersAvailable = typeof window.IntersectionObserver === 'function';
  const players = new Map();

  function updateDemo(player) {
    const playing = player.wantsPlay && player.visible && !document.hidden && !player.failed;
    const source = playing ? player.element.dataset.animation : player.element.dataset.poster;
    if (player.image.getAttribute('src') !== source) player.image.setAttribute('src', source);
    player.element.dataset.playing = String(playing);
    player.button.setAttribute('aria-pressed', String(playing));
    player.button.setAttribute('aria-label', formatInterface(playing ? interfaceMessages.pauseAnimation : interfaceMessages.playAnimation, { title: player.element.dataset.paperTitle }));
    player.label.textContent = playing ? interfaceMessages.pause : interfaceMessages.play;
  }

  for (const element of demoElements) {
    const player = {
      element, image: element.querySelector('.paper-demo-image'),
      button: element.querySelector('.demo-toggle'), label: element.querySelector('[data-demo-label]'),
      wantsPlay: !motion.matches, manualChoice: false, visible: !observersAvailable, failed: false
    };
    if (!player.image || !player.button || !player.label) continue;
    players.set(element, player);
    player.button.hidden = false;
    player.button.addEventListener('click', () => {
      player.wantsPlay = !player.wantsPlay;
      player.manualChoice = true;
      updateDemo(player);
    });
    player.image.addEventListener('error', () => {
      if (player.failed) return;
      player.failed = true;
      player.button.hidden = true;
      updateDemo(player);
    });
    updateDemo(player);
  }

  if (observersAvailable) {
    const observer = new window.IntersectionObserver(entries => {
      for (const entry of entries) {
        const player = players.get(entry.target);
        if (!player) continue;
        player.visible = entry.isIntersecting;
        updateDemo(player);
      }
    }, { rootMargin: '0px', threshold: 0 });
    for (const element of players.keys()) observer.observe(element);
  }

  document.addEventListener('visibilitychange', () => {
    for (const player of players.values()) updateDemo(player);
  });

  motion.addEventListener('change', () => {
    for (const player of players.values()) {
      if (motion.matches) player.wantsPlay = false;
      else if (!player.manualChoice) player.wantsPlay = true;
      updateDemo(player);
    }
  });
}
