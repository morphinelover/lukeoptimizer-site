/* LukeOptimizer — reimagined static site. No changes are made to the visitor's PC. */
(function () {
  'use strict';
  const M = window.LukeModel;
  if (!M) return;
  const doc = document;
  const en = /^en/i.test(doc.documentElement.lang || '');
  const lang = en ? 'en' : 'pt-BR';
  const T = (pt, english) => en ? english : pt;
  const root = en ? '../' : '';
  const assets = root + 'assets/';
  const $ = selector => doc.querySelector(selector);
  const all = selector => Array.from(doc.querySelectorAll(selector));
  const setText = (id, text) => { const element = doc.getElementById(id); if (element) element.textContent = text; };
  const media = window.matchMedia ? window.matchMedia('(max-width: 800px)') : { matches: false, addEventListener() {} };
  setText('year', String(new Date().getFullYear()));

  const menu = $('#menu-toggle');
  const nav = $('#main-nav');
  function setMenu(open, returnFocus) {
    if (!menu || !nav) return;
    const expanded = media.matches && open;
    menu.setAttribute('aria-expanded', String(expanded));
    menu.setAttribute('aria-label', expanded ? T('Fechar menu', 'Close menu') : T('Abrir menu', 'Open menu'));
    nav.classList.toggle('is-open', expanded);
    nav.inert = media.matches && !expanded;
    if (media.matches && !expanded) nav.setAttribute('aria-hidden', 'true');
    else nav.removeAttribute('aria-hidden');
    if (returnFocus) menu.focus({ preventScroll: true });
  }
  if (menu && nav) {
    menu.hidden = false;
    menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
    doc.addEventListener('click', event => {
      if (!nav.contains(event.target) && !menu.contains(event.target)) setMenu(false);
    });
    doc.addEventListener('focusin', event => {
      if (!nav.contains(event.target) && !menu.contains(event.target)) setMenu(false);
    });
    doc.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
        setMenu(false, true);
      }
    });
    if (media.addEventListener) media.addEventListener('change', () => setMenu(false));
    else if (media.addListener) media.addListener(() => setMenu(false));
    setMenu(false);
  }
  const header = $('#site-header');
  if (header && window.requestAnimationFrame) {
    let pending = false;
    const updateProgress = () => {
      const max = doc.documentElement.scrollHeight - window.innerHeight;
      header.style.setProperty('--progress', String(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0));
      pending = false;
    };
    const schedule = () => { if (!pending) { pending = true; window.requestAnimationFrame(updateProgress); } };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('load', schedule);
    updateProgress();
  }

  const image = $('#hero-image');
  const tabs = all('[data-shot]');
  let shotRequest = 0;
  function applyShot(tab) {
    if (!image || !tabs.includes(tab)) return;
    const current = ++shotRequest;
    image.setAttribute('aria-busy', 'true');
    const install = () => {
      if (current !== shotRequest) return;
      image.src = tab.dataset.image;
      image.alt = tab.dataset.alt;
      tabs.forEach(button => {
        const active = button === tab;
        button.setAttribute('aria-selected', String(active));
        button.tabIndex = active ? 0 : -1;
      });
      const panel = $('#screen-panel');
      if (panel) panel.setAttribute('aria-labelledby', tab.id);
      setText('shot-caption', tab.dataset.caption);
      setText('shot-kind', tab.dataset.kind);
      image.setAttribute('aria-busy', 'false');
    };
    if (image.getAttribute('src') === tab.dataset.image && image.complete && image.naturalWidth) {
      install();
      return;
    }
    const preload = new Image();
    preload.onload = install;
    preload.onerror = () => {
      if (current !== shotRequest) return;
      image.setAttribute('aria-busy', 'false');
      setText('shot-caption', T('Não foi possível abrir esta tela. Tente outra opção.', 'This screen could not be loaded. Try another option.'));
    };
    preload.src = tab.dataset.image;
  }
  tabs.forEach((tab, index) => {
    tab.disabled = false;
    tab.addEventListener('click', () => applyShot(tab));
    tab.addEventListener('keydown', event => {
      const next = M.nextIndex(index, event.key, tabs.length);
      if (next === null) return;
      event.preventDefault();
      applyShot(tabs[next]);
      tabs[next].focus();
    });
  });
  all('[data-go-shot]').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => {
      const tab = tabs.find(t => t.dataset.shot === button.dataset.goShot);
      if (!tab) return;
      applyShot(tab);
      const target = $('#aplicativo');
      if (target) target.scrollIntoView({ block: 'start', behavior: 'auto' });
      tab.focus({ preventScroll: true });
    });
  });
  const gameDetails = {
    cs2: T('CS2: perfis e autoexec, com backup antes das alterações.', 'CS2: profiles and autoexec, with a backup before changes.'),
    valorant: T('VALORANT: organize a preparação do Windows e acompanhe as métricas disponíveis.', 'VALORANT: organize Windows preparation and follow available metrics.'),
    fortnite: T('Fortnite: prepare seu perfil e compare as medições compatíveis entre sessões.', 'Fortnite: prepare your profile and compare supported measurements between sessions.')
  };
  const gameButtons = all('[data-game]');
  gameButtons.forEach(button => {
    button.disabled = false;
    button.addEventListener('click', () => {
      if (!Object.prototype.hasOwnProperty.call(gameDetails, button.dataset.game)) return;
      gameButtons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
      setText('game-detail', gameDetails[button.dataset.game]);
    });
  });

  const flowButtons = all('[data-step]');
  let flowRequest = 0;
  function selectStep(button) {
    if (!flowButtons.includes(button)) return;
    const ticket = ++flowRequest;
    const panel = $('#flow-panel');
    const flowImage = $('#flow-image');
    if (!flowImage) return;
    if (panel) panel.setAttribute('aria-busy', 'true');
    const install = () => {
      if (ticket !== flowRequest) return;
      flowButtons.forEach(other => {
        const active = other === button;
        other.setAttribute('aria-selected', String(active));
        other.tabIndex = active ? 0 : -1;
      });
      flowImage.src = button.dataset.image;
      flowImage.alt = button.dataset.alt;
      setText('flow-label', button.dataset.label);
      setText('flow-title', button.dataset.title);
      setText('flow-description', button.dataset.description);
      const flowIcon = $('#flow-icon use');
      if (flowIcon) flowIcon.setAttribute('href', assets + 'icons.svg#' + button.dataset.icon);
      if (panel) {
        panel.setAttribute('aria-labelledby', button.id);
        panel.setAttribute('aria-busy', 'false');
      }
    };
    if (flowImage.getAttribute('src') === button.dataset.image && flowImage.complete && flowImage.naturalWidth) {
      install();
      return;
    }
    const preload = new Image();
    preload.onload = install;
    preload.onerror = () => {
      if (ticket !== flowRequest) return;
      if (panel) panel.setAttribute('aria-busy', 'false');
      setText('flow-description', T('Não foi possível carregar esta tela. Tente novamente ou escolha outra etapa.', 'This screen could not be loaded. Try again or choose another stage.'));
    };
    preload.src = button.dataset.image;
  }
  flowButtons.forEach((button, index) => {
    button.disabled = false;
    button.addEventListener('click', () => selectStep(button));
    button.addEventListener('keydown', event => {
      const next = M.nextIndex(index, event.key, flowButtons.length);
      if (next === null) return;
      event.preventDefault();
      selectStep(flowButtons[next]);
      flowButtons[next].focus();
    });
  });

  const dialogTriggers = new Map();
  function openDialog(dialog, trigger) {
    if (!dialog || typeof dialog.showModal !== 'function' || dialog.open) return;
    dialogTriggers.set(dialog, trigger);
    dialog.showModal();
    doc.body.classList.add('dialog-open');
  }
  all('dialog').forEach(dialog => {
    dialog.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => dialog.close()));
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => {
      if (!doc.querySelector('dialog[open]')) doc.body.classList.remove('dialog-open');
      const trigger = dialogTriggers.get(dialog);
      if (trigger && trigger.isConnected) trigger.focus({ preventScroll: true });
      dialogTriggers.delete(dialog);
    });
  });
  const zoom = $('#zoom-dialog');
  all('[data-zoom-open]').forEach(button => {
    if (!zoom || typeof zoom.showModal !== 'function' || !image) return;
    button.hidden = false;
    button.addEventListener('click', () => {
      const target = $('#zoom-image');
      if (!target) return;
      target.src = image.currentSrc || image.src;
      target.alt = image.alt;
      openDialog(zoom, button);
    });
  });

  async function fetchJson(url) {
    if (typeof window.fetch !== 'function') throw new Error('Fetch unavailable');
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    let timeout;
    try {
      const request = window.fetch(url, { credentials: 'omit', cache: 'no-store', ...(controller ? { signal: controller.signal } : {}) })
        .then(response => { if (!response.ok) throw new Error('Public data unavailable'); return response.json(); });
      const deadline = new Promise((_, reject) => {
        timeout = window.setTimeout(() => { if (controller) controller.abort(); reject(new Error('Request timeout')); }, 5000);
      });
      return await Promise.race([request, deadline]);
    } finally { if (timeout) window.clearTimeout(timeout); }
  }
  // Everything below is static: the site works with no server behind it.
  // releases.json lists the versions; atualizacao.json (the signed notice the app
  // reads) gives the current version, the download link and the SHA256.
  let releasesPromise;
  function getReleases(force) {
    if (force) releasesPromise = null;
    if (!releasesPromise) releasesPromise = (async () => {
      const data = await fetchJson(assets + 'releases.json');
      const versions = M.validNews(data, lang);
      if (!versions.length) throw new Error('No releases');
      return { versions, current: M.latest(data, lang) };
    })();
    return releasesPromise;
  }
  fetchJson(root + 'atualizacao.json').then(M.validUpdate).then(info => {
    if (!info) return;
    all('[data-published-version]').forEach(label => { label.textContent = info.version; });
    all('[data-release-download]').forEach(link => { link.href = info.url; });
    all('[data-release-sha]').forEach(code => { code.textContent = info.sha256; });
    all('[data-release-sha-row]').forEach(row => { row.hidden = false; });
  }).catch(() => { /* The static 9.0.0 link and label remain available. */ });

  const news = $('#news-list');
  const newsRetry = $('#news-retry');
  const el = (tag, className, text) => {
    const element = doc.createElement(tag);
    if (className) element.className = className;
    if (text != null) element.textContent = text;
    return element;
  };
  if (news) {
    let newsRequest = 0;
    let rendered = false;
    const fmt = new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'long', day: 'numeric' });
    async function loadNews(force) {
      const ticket = ++newsRequest;
      news.setAttribute('aria-busy', 'true');
      if (newsRetry) newsRetry.disabled = true;
      try {
        const result = await getReleases(force);
        if (ticket !== newsRequest) return;
        const current = result.current;
        const ordered = current ? [current, ...result.versions.filter(version => version.version !== current.version)] : result.versions;
        const entries = ordered.map(version => {
          const isCurrent = !!current && version.version === current.version;
          const article = el('article', 'news-item' + (isCurrent ? ' latest' : ''));
          const heading = el('header');
          const time = el('time', '', fmt.format(new Date(version.timestamp * 1000)));
          time.dateTime = new Date(version.timestamp * 1000).toISOString();
          heading.append(el('h2', '', 'LukeOptimizer ' + version.version), time);
          if (isCurrent) heading.append(el('span', 'news-tag', T('VERSÃO ATUAL', 'CURRENT VERSION')));
          const ul = el('ul');
          version.notes.split(/\r?\n/).map(line => line.replace(/^[•\-\s]+/, '').trim())
            .filter(line => line && line !== 'LukeOptimizer ' + version.version).slice(0, 40)
            .forEach(line => ul.append(el('li', '', line)));
          article.append(heading, ul);
          if (isCurrent && version.url) {
            const download = el('a', 'button button-primary', T('Baixar versão ', 'Download version ') + version.version);
            download.href = version.url; article.append(download);
          }
          return article;
        });
        news.replaceChildren(...entries);
        rendered = true;
        if (newsRetry) newsRetry.hidden = true;
      } catch {
        if (ticket !== newsRequest) return;
        if (!rendered) news.replaceChildren(el('p', 'news-empty', T('Não foi possível carregar as novidades. Você pode tentar novamente.', 'Release notes could not be loaded. You can try again.')));
        if (newsRetry) newsRetry.hidden = false;
      } finally {
        if (ticket === newsRequest) {
          news.setAttribute('aria-busy', 'false');
          if (newsRetry) newsRetry.disabled = false;
        }
      }
    }
    if (newsRetry) newsRetry.addEventListener('click', () => loadNews(true));
    loadNews(false);
  }
})();

