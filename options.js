// Função para obter nome do mês em português
function getMonthName(monthNumber) {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return months[monthNumber - 1] || '';
}

// Função para formatar o mês de acordo com o template
function formatMonth(template) {
  const now = new Date();
  const monthNumber = now.getMonth() + 1;
  const monthName = getMonthName(monthNumber);
  const year = now.getFullYear();

  return template
    .replace(/{mes}/g, monthNumber)
    .replace(/{mesNome}/g, monthName)
    .replace(/{ano}/g, year);
}

// Função para atualizar o preview do formato
function updateMonthPreview() {
  const monthFormatInput = document.getElementById('monthFormat');
  const preview = document.getElementById('monthPreview');

  if (monthFormatInput.value.trim()) {
    preview.textContent = formatMonth(monthFormatInput.value);
  } else {
    preview.textContent = '-';
  }
}

// Função para mostrar mensagem usando Bootstrap Toast
function showToast(message, type = 'success') {
  let toastElement, messageElement;

  switch (type) {
    case 'success':
      toastElement = document.getElementById('successToast');
      messageElement = document.getElementById('successMessage');
      break;
    case 'error':
      toastElement = document.getElementById('errorToast');
      messageElement = document.getElementById('errorMessage');
      break;
    case 'warning':
      toastElement = document.getElementById('warningToast');
      messageElement = document.getElementById('warningMessage');
      break;
    default:
      toastElement = document.getElementById('successToast');
      messageElement = document.getElementById('successMessage');
  }

  messageElement.textContent = ' ' + message;

  const toast = new bootstrap.Toast(toastElement, {
    autohide: true,
    delay: 3000
  });

  toast.show();
}

// Carregar configurações salvas ao abrir a página
(async () => {
  try {
    const data = await chrome.storage.sync.get('monthFormat');
    const monthFormatInput = document.getElementById('monthFormat');

    if (data.monthFormat) {
      monthFormatInput.value = data.monthFormat;
    } else {
      // Valor padrão
      monthFormatInput.value = '{mes} - {mesNome}/{ano}';
    }
    updateMonthPreview();
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
    showToast('Erro ao carregar configurações: ' + error.message, 'error');
  }
})();

// Atualizar preview quando o usuário digitar
document.getElementById('monthFormat').addEventListener('input', updateMonthPreview);

// Botão para salvar configurações
document.getElementById('saveOptions').addEventListener('click', async () => {
  const monthFormatInput = document.getElementById('monthFormat');

  try {
    const monthFormat = monthFormatInput.value.trim();

    if (!monthFormat) {
      showToast('Por favor, preencha o formato de mês!', 'warning');
      return;
    }

    // Salvar configuração
    await chrome.storage.sync.set({ monthFormat: monthFormat });

    showToast('Configurações salvas com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    showToast('Erro ao salvar: ' + error.message, 'error');
  }
});

// Botão para restaurar configuração padrão
document.getElementById('resetOptions').addEventListener('click', async () => {
  const monthFormatInput = document.getElementById('monthFormat');

  try {
    // Restaurar valor padrão
    const defaultFormat = '{mes} - {mesNome}/{ano}';
    monthFormatInput.value = defaultFormat;
    updateMonthPreview();

    // Salvar configuração padrão
    await chrome.storage.sync.set({ monthFormat: defaultFormat });

    showToast('Configuração restaurada para o padrão!', 'success');
  } catch (error) {
    console.error('Erro ao restaurar configuração:', error);
    showToast('Erro ao restaurar: ' + error.message, 'error');
  }
});

// ========================================
// Funcionalidades de Importar/Exportar
// ========================================

// Verificar se há dados salvos e atualizar status do botão exportar
async function checkExportStatus() {
  try {
    const data = await chrome.storage.sync.get('formData');
    const exportBtn = document.getElementById('exportConfig');
    const exportStatus = document.getElementById('exportStatus');

    if (data.formData && Object.keys(data.formData).length > 0) {
      exportBtn.disabled = false;
      exportStatus.textContent = `${Object.keys(data.formData).length} campos salvos`;
      exportStatus.classList.add('text-success');
    } else {
      exportBtn.disabled = true;
      exportStatus.textContent = 'Nenhum dado disponível para exportar';
      exportStatus.classList.remove('text-success');
    }
  } catch (error) {
    console.error('Erro ao verificar dados salvos:', error);
  }
}

// Exportar configurações para JSON
document.getElementById('exportConfig').addEventListener('click', async () => {
  try {
    // Get saved data
    const data = await chrome.storage.sync.get('formData');

    if (!data.formData || Object.keys(data.formData).length === 0) {
      showToast('Nenhum dado salvo para exportar!', 'warning');
      return;
    }

    // Criar JSON formatado
    const jsonString = JSON.stringify(data.formData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Criar link de download
    const a = document.createElement('a');
    a.href = url;
    a.download = `zeev-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Configurações exportadas com sucesso!', 'success');

  } catch (error) {
    console.error('Erro ao exportar:', error);
    showToast('Erro ao exportar: ' + error.message, 'error');
  }
});

// Importar configurações do JSON
document.getElementById('importConfig').addEventListener('click', () => {
  document.getElementById('fileInput').click();
});

// Handler para quando o arquivo é selecionado
document.getElementById('fileInput').addEventListener('change', async (event) => {
  const file = event.target.files[0];

  if (!file) return;

  try {
    // Ler arquivo JSON
    const text = await file.text();
    let importedData;

    try {
      importedData = JSON.parse(text);
    } catch (parseError) {
      showToast('Arquivo JSON inválido!', 'error');
      event.target.value = '';
      return;
    }

    // Verificar se há dados válidos
    if (!importedData || typeof importedData !== 'object' || Object.keys(importedData).length === 0) {
      showToast('Arquivo JSON não contém dados válidos!', 'warning');
      event.target.value = '';
      return;
    }

    // Salvar dados importados
    await chrome.storage.sync.set({ formData: importedData });

    // Atualizar status do botão exportar
    await checkExportStatus();

    showToast(`Configurações importadas com sucesso! ${Object.keys(importedData).length} campos carregados.`, 'success');

    // Limpar input file
    event.target.value = '';

  } catch (error) {
    console.error('Erro ao importar:', error);
    showToast('Erro ao importar: ' + error.message, 'error');
    event.target.value = '';
  }
});

// Verificar status ao carregar a aba de Dados e Configurações
document.addEventListener('DOMContentLoaded', () => {
  const dataTab = document.getElementById('data-tab');

  if (dataTab) {
    dataTab.addEventListener('shown.bs.tab', () => {
      checkExportStatus();
    });
  }

  // Verificar status ao carregar a página (caso a aba já esteja aberta)
  checkExportStatus();
});

// ========================================
// Funcionalidade de Verificação de Atualizações
// ========================================

// Instância global do update checker
let updateCheckerInstance = null;

// Botão para buscar atualizações manualmente
document.getElementById('checkUpdateBtn')?.addEventListener('click', async () => {
  const updateStatus = document.getElementById('updateStatus');
  const checkUpdateBtn = document.getElementById('checkUpdateBtn');

  try {
    // Desabilitar botão e mostrar status de carregamento
    checkUpdateBtn.disabled = true;
    checkUpdateBtn.innerHTML = '<i class="bi bi-arrow-repeat"></i> Verificando...';
    updateStatus.className = 'alert alert-info';
    updateStatus.textContent = 'Verificando atualizações...';

    // Forçar verificação de atualizações
    if (!updateCheckerInstance) {
      updateCheckerInstance = new UpdateChecker();
    }

    const updateInfo = await updateCheckerInstance.checkAndSave(true);

    // Mostrar resultado
    if (updateInfo.hasUpdate) {
      updateStatus.className = 'alert alert-success';
      updateStatus.innerHTML = `
        <strong>Nova versão ${updateInfo.remoteVersion} disponível!</strong><br>
        <a href="${updateInfo.repoUrl}" target="_blank" class="btn btn-success btn-sm mt-2">
          <i class="bi bi-download"></i> Baixar Atualização
        </a>
      `;
    } else if (updateInfo.error) {
      updateStatus.className = 'alert alert-danger';
      updateStatus.textContent = `Erro: ${updateInfo.error}`;
    } else {
      updateStatus.className = 'alert alert-success';
      updateStatus.textContent = 'Você está usando a versão mais recente!';
    }

  } catch (error) {
    updateStatus.className = 'alert alert-danger';
    updateStatus.textContent = 'Erro ao verificar: ' + error.message;
  } finally {
    // Re-habilitar botão
    checkUpdateBtn.disabled = false;
    checkUpdateBtn.innerHTML = '<i class="bi bi-arrow-repeat"></i> Buscar Atualizações';
  }
});
