/* Pure presentation model. Never starts downloads or changes the visitor's PC. */
(function (root, factory) {
  'use strict';
  var model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else if (root) root.LukeModel = model;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function english(lang) { return typeof lang === 'string' && /^en(?:-|$)/i.test(lang); }
  function nextIndex(index, key, count) {
    if (!Number.isInteger(count) || count < 1) return null;
    var current = Number.isInteger(index) && index >= 0 && index < count ? index : 0;
    if (key === 'ArrowRight' || key === 'ArrowDown') return (current + 1) % count;
    if (key === 'ArrowLeft' || key === 'ArrowUp') return (current + count - 1) % count;
    if (key === 'Home') return 0;
    if (key === 'End') return count - 1;
    return null;
  }

  function officialUrl(value) {
    // URL.port normalizes :443 to an empty string. Check the original authority
    // first, so explicit ports, credentials and backslash normalization fail.
    if (typeof value !== 'string' || value.length > 4096
      || /[\\\u0000- \u007f]/.test(value)
      || !/^https:\/\/lukeoptimizer\.online(?=\/|[?#]|$)/i.test(value)) return null;
    try {
      var url = new URL(value);
      return url.protocol === 'https:' && url.hostname === 'lukeoptimizer.online'
        && !url.port && !url.username && !url.password ? url.href : null;
    } catch (error) { return null; }
  }
  // The download must be an .exe in /downloads/ of the official site.
  function downloadUrl(value) {
    var url = officialUrl(value);
    return url && /^https:\/\/lukeoptimizer\.online\/downloads\/[A-Za-z0-9._-]+\.exe$/.test(url) ? url : null;
  }

  function localizedNotes(item, lang) {
    if (english(lang) && typeof item.notas_en === 'string' && item.notas_en.trim()) return item.notas_en;
    return item.notas;
  }
  function validNews(data, lang) {
    if (!data || !Array.isArray(data.versoes)) return [];
    return data.versoes.filter(function (item) {
      return item && typeof item.versao === 'string' && item.versao.length <= 80
        && item.versao.trim() === item.versao
        && /^v?\d+\.\d+(?:\.\d+)?(?:[-+][a-z\d.-]+)?$/i.test(item.versao)
        && typeof item.publicada_em === 'number' && Number.isFinite(item.publicada_em)
        && item.publicada_em > 0 && item.publicada_em * 1000 <= 8640000000000000
        && typeof item.notas === 'string';
    }).map(function (item) {
      // Notes are plain text. Callers must render them with textContent.
      return {
        version: item.versao,
        timestamp: item.publicada_em,
        notes: localizedNotes(item, lang).slice(0, 12000),
        url: downloadUrl(item.url)
      };
    }).sort(function (a, b) { return b.timestamp - a.timestamp; }).slice(0, 30);
  }
  function latest(data, lang) {
    if (!data || !Array.isArray(data.versoes)) return null;
    // The file's original order identifies the current release: only it carries
    // the download link. History is sorted by date separately.
    for (var index = 0; index < data.versoes.length; index++) {
      var releases = validNews({ versoes: [data.versoes[index]] }, lang);
      if (releases.length && releases[0].url) return releases[0];
    }
    return null;
  }
  // atualizacao.json is the signed update notice the app reads. The site only uses
  // its readable copy ("leia") to show the version, the link and the SHA256; the app
  // checks the signature itself before offering anything.
  function validUpdate(data) {
    var info = data && data.formato === 'luke-atualizacao' ? data.leia : null;
    if (!info || typeof info.versao !== 'string' || !/^\d{1,4}(?:\.\d{1,4}){1,3}$/.test(info.versao)) return null;
    var url = downloadUrl(info.url);
    if (!url || typeof info.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(info.sha256)) return null;
    return { version: info.versao, url: url, sha256: info.sha256 };
  }
  return Object.freeze({
    nextIndex: nextIndex,
    validNews: validNews,
    latest: latest,
    validUpdate: validUpdate
  });
}));
