/**
 * Version Manager
 * Gerencia a exibição da versão da extensão a partir do manifest
 */

(function() {
  'use strict';

  // Atualizar versão no footer ao carregar
  document.addEventListener('DOMContentLoaded', () => {
    const manifest = chrome.runtime.getManifest();
    const footerVersionEl = document.getElementById('footerVersion');

    if (footerVersionEl && manifest && manifest.version) {
      footerVersionEl.textContent = manifest.version;
    }
  });
})();
