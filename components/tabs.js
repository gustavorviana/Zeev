// ========================================
// Componente de Gerenciamento de Tabs
// ========================================

/**
 * Inicializa o sistema de tabs na página
 * Identifica automaticamente todas as tabs e configura os eventos de clique
 */
function initializeTabs() {
  // Selecionar todos os botões de tab
  const tabButtons = document.querySelectorAll('[data-bs-toggle="tab"]');

  tabButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();

      // Obter o target da tab
      const targetId = this.getAttribute('data-bs-target');
      const targetPanel = document.querySelector(targetId);

      if (!targetPanel) {
        console.error('Panel não encontrado:', targetId);
        return;
      }

      // Remover classe active de todos os botões de tab
      const allTabButtons = this.closest('[role="tablist"]').querySelectorAll('[data-bs-toggle="tab"]');
      allTabButtons.forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      });

      // Adicionar classe active ao botão clicado
      this.classList.add('active');
      this.setAttribute('aria-selected', 'true');

      // Remover classes active e show de todos os painéis
      const tabContent = targetPanel.closest('.tab-content');
      const allPanels = tabContent.querySelectorAll('.tab-pane');
      allPanels.forEach(panel => {
        panel.classList.remove('show', 'active');
      });

      // Adicionar classes active e show ao painel alvo
      targetPanel.classList.add('show', 'active');

      // Disparar evento customizado quando a tab for mostrada
      const showEvent = new CustomEvent('shown.bs.tab', {
        detail: { target: targetPanel, relatedTarget: this }
      });
      this.dispatchEvent(showEvent);
    });
  });
}

// Inicializar tabs quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeTabs);
} else {
  initializeTabs();
}
