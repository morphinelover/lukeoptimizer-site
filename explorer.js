/* Explore the website's real controls. No PC actions, network or storage. */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else if (root) { root.LukeExplorer = api; api.install(root); }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var RESOURCES = Object.freeze([
    { id: 'inicio', selector: '[data-shot="inicio"]', kind: 'click', pt: ['Início do aplicativo', 'Veja a Otimização total, as ações principais e as leituras do PC.'], en: ['App Home', 'See Total optimization, the main actions and your PC readings.'], tags: 'inicio home painel dashboard hardware cpu gpu memoria ram leituras' },
    { id: 'total', selector: '[data-shot="total"]', kind: 'click', pt: ['Otimização total', 'Veja o plano lido do Windows: o que muda, com uma confirmação só.'], en: ['Total optimization', 'See the plan read from Windows: what changes, with a single confirmation.'], tags: 'otimizacao total otimizar ajustes analise scan plano optimization optimize settings' },
    { id: 'resultado', selector: '[data-shot="resultado"]', kind: 'click', pt: ['Resultado conferido', 'Veja cada ajuste relido no Windows, com desfazer num clique.'], en: ['Verified result', 'See each setting read back from Windows, with one-click undo.'], tags: 'resultado relatorio conferido verificado desfazer result report verified undo' },
    { id: 'claro', selector: '[data-shot="claro"]', kind: 'click', pt: ['Tema claro do app', 'Veja como o aplicativo fica no tema claro. O site continua escuro.'], en: ['App light theme', 'See the app’s light appearance. The website stays dark.'], tags: 'tema claro personalizacao light appearance' },
    { id: 'cores', selector: '[data-shot="cores"]', kind: 'click', pt: ['Cores de destaque', 'Seis cores de destaque, ou a cor do seu Windows.'], en: ['Accent colors', 'Six accent colors, or your Windows color.'], tags: 'cores cor destaque windows personalizacao accent color colors' },
    { id: 'historico', selector: '[data-step="2"]', kind: 'click', pt: ['Acompanhar e desfazer', 'Entenda a etapa de resultados e o histórico dos ajustes reversíveis.'], en: ['Follow up and undo', 'Understand results and the history of reversible adjustments.'], tags: 'historico restaurar desfazer backup undo restore history' },
    { id: 'recursos', selector: '#recursos', kind: 'anchor', pt: ['Jogos, rede e ferramentas', 'Explore os recursos disponíveis para jogos, hardware e Windows.'], en: ['Games, networking and tools', 'Explore the features for games, hardware and Windows.'], tags: 'jogos rede dns ping games gaming network tools ferramentas' },
    { id: 'baixar', selector: '#baixar', kind: 'anchor', pt: ['Baixar grátis', 'Baixe o LukeOptimizer para Windows 10 e 11, sem conta e sem pagamento.'], en: ['Download free', 'Download LukeOptimizer for Windows 10 and 11, with no account and no payment.'], tags: 'baixar download gratis gratuito free exe instalar install versao version' }
  ].map(function (item) { Object.freeze(item.pt); Object.freeze(item.en); return Object.freeze(item); }));
  function normalized(value) {
    var text = typeof value === 'string' ? value : '';
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }
  function resources(lang) {
    var en = typeof lang === 'string' && /^en(?:-|$)/i.test(lang);
    return RESOURCES.map(function (item) {
      var copy = en ? item.en : item.pt;
      return { id: item.id, selector: item.selector, kind: item.kind, name: copy[0], description: copy[1], tags: item.tags };
    });
  }
  function search(query, lang) {
    var terms = normalized(query).split(/\s+/).filter(Boolean);
    return resources(lang).filter(function (item) {
      var haystack = normalized(item.name + ' ' + item.description + ' ' + item.tags);
      return terms.every(function (term) { return haystack.indexOf(term) !== -1; });
    });
  }
  function install(win) {
    if (!win || !win.document) return null;
    var doc = win.document;
    var dialog = doc.querySelector('#explorer-dialog');
    var input = doc.querySelector('#explorer-input');
    var results = doc.querySelector('#explorer-results');
    var status = doc.querySelector('#explorer-status');
    var empty = doc.querySelector('#explorer-empty');
    var triggers = Array.prototype.slice.call(doc.querySelectorAll('[data-explorer-open]'));
    if (!dialog || typeof dialog.showModal !== 'function' || !input || !results || !status || !empty || !triggers.length) return null;
    if (dialog.dataset.explorerReady === 'true') return null;
    var lang = doc.documentElement.lang || 'pt-BR';
    var en = /^en(?:-|$)/i.test(lang);
    var T = function (pt, english) { return en ? english : pt; };
    var available = resources(lang).filter(function (item) { return !!doc.querySelector(item.selector); });
    if (!available.length) return null;
    dialog.dataset.explorerReady = 'true';
    var lastTrigger = null;
    var selectedTarget = null;
    var buttons = [];

    function choose(item) {
      var target = doc.querySelector(item.selector);
      if (!target || (item.kind === 'click' && target.disabled)) {
        status.textContent = T('Esta opção está indisponível. Escolha outro recurso.', 'This option is unavailable. Choose another feature.');
        return;
      }
      selectedTarget = target;
      dialog.close();
      if (item.kind === 'click') target.click();
      if (item.kind === 'anchor' && !target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      if (typeof target.scrollIntoView === 'function') target.scrollIntoView({ block: item.kind === 'anchor' ? 'start' : 'center', behavior: 'auto' });
      target.focus({ preventScroll: true });
    }
    function render() {
      var ids = available.map(function (item) { return item.id; });
      var matched = search(input.value, lang).filter(function (item) { return ids.indexOf(item.id) !== -1; });
      buttons = matched.map(function (item) {
        var button = doc.createElement('button');
        button.type = 'button';
        button.className = 'explorer-result';
        button.dataset.explorerResult = item.id;
        var name = doc.createElement('strong');
        name.className = 'explorer-result-title'; name.textContent = item.name;
        var description = doc.createElement('span');
        description.className = 'explorer-result-description'; description.textContent = item.description;
        button.append(name, description);
        button.addEventListener('click', function () { choose(item); });
        button.addEventListener('keydown', navigate);
        return button;
      });
      results.replaceChildren.apply(results, buttons);
      empty.hidden = buttons.length > 0;
      status.textContent = buttons.length + (buttons.length === 1
        ? T(' recurso encontrado.', ' feature found.') : T(' recursos encontrados.', ' features found.'));
    }
    function navigate(event) {
      if (event.target === input && event.key === 'Enter') {
        if (buttons.length) { event.preventDefault(); buttons[0].click(); }
        return;
      }
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      if (!buttons.length) return;
      event.preventDefault();
      var current = event.target === input ? -1 : buttons.indexOf(event.target);
      var next = current + (event.key === 'ArrowDown' ? 1 : -1);
      if (next < -1) next = buttons.length - 1;
      if (next >= buttons.length) next = -1;
      (next === -1 ? input : buttons[next]).focus({ preventScroll: true });
    }
    input.addEventListener('input', render);
    input.addEventListener('keydown', navigate);
    triggers.forEach(function (trigger) {
      trigger.hidden = false;
      trigger.addEventListener('click', function () {
        if (dialog.open) return;
        lastTrigger = trigger; selectedTarget = null;
        input.value = ''; render();
        dialog.showModal();
        doc.body.classList.add('dialog-open');
        input.focus({ preventScroll: true });
      });
    });
    dialog.querySelectorAll('[data-close-dialog]').forEach(function (button) {
      button.addEventListener('click', function () { dialog.close(); });
    });
    dialog.addEventListener('keydown', function (event) {
      // A search input can consume the first Escape to clear its text before
      // native dialog cancellation. Handle Escape within this modal so the
      // visible promise to close works with either search or result focus.
      if (event.key === 'Escape' && dialog.open) {
        event.preventDefault();
        dialog.close();
      }
    });
    dialog.addEventListener('click', function (event) { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close', function () {
      if (!doc.querySelector('dialog[open]')) doc.body.classList.remove('dialog-open');
      var target = selectedTarget || lastTrigger;
      if (target && target.isConnected) target.focus({ preventScroll: true });
      lastTrigger = null; selectedTarget = null;
    });
    return { render: render };
  }
  return Object.freeze({ resources: resources, search: search, install: install });
}));
