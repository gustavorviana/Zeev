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
    const data = await chrome.storage.sync.get(['monthFormat', 'showFieldNames']);
    const monthFormatInput = document.getElementById('monthFormat');
    const showFieldNamesCheckbox = document.getElementById('showFieldNames');

    if (data.monthFormat) {
      monthFormatInput.value = data.monthFormat;
    } else {
      // Valor padrão
      monthFormatInput.value = '{mes} - {mesNome}/{ano}';
    }
    updateMonthPreview();

    // Carregar preferência de mostrar nomes dos campos (padrão: false)
    if (showFieldNamesCheckbox) {
      showFieldNamesCheckbox.checked = data.showFieldNames === true;
    }
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
    showToast('Erro ao carregar configurações: ' + error.message, 'error');
  }
})();

// Atualizar preview quando o usuário digitar
document.getElementById('monthFormat').addEventListener('input', updateMonthPreview);

// Event listener para checkbox de mostrar nomes dos campos
document.getElementById('showFieldNames')?.addEventListener('change', async (e) => {
  try {
    await chrome.storage.sync.set({ showFieldNames: e.target.checked });
    // Recarregar campos para aplicar a mudança
    await displayGroupedFields();
  } catch (error) {
    console.error('Erro ao salvar preferência:', error);
    showToast('Erro ao salvar preferência: ' + error.message, 'error');
  }
});

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
    // Get saved data, labels and groups
    const data = await chrome.storage.sync.get(['formData', 'fieldLabels', 'fieldGroups']);

    if (!data.formData || Object.keys(data.formData).length === 0) {
      showToast('Nenhum dado salvo para exportar!', 'warning');
      return;
    }

    // Criar objeto com dados, labels e groups
    const exportData = {
      formData: data.formData,
      fieldLabels: data.fieldLabels || {},
      fieldGroups: data.fieldGroups || {}
    };

    // Criar JSON formatado
    const jsonString = JSON.stringify(exportData, null, 2);
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

    // Verificar se é formato novo (com formData e fieldLabels) ou antigo (apenas formData)
    let formData, fieldLabels, fieldGroups;
    
    if (importedData.formData) {
      // Formato novo
      formData = importedData.formData;
      fieldLabels = importedData.fieldLabels || {};
      fieldGroups = importedData.fieldGroups || {};
    } else {
      // Formato antigo (compatibilidade)
      formData = importedData;
      fieldLabels = {};
      fieldGroups = {};
    }

    // Salvar dados importados
    await chrome.storage.sync.set({ 
      formData: formData,
      fieldLabels: fieldLabels,
      fieldGroups: fieldGroups
    });

    // Atualizar status do botão exportar e lista de campos
    await checkExportStatus();
    await displayGroupedFields();

    showToast(`Configurações importadas com sucesso! ${Object.keys(formData).length} campo(s) carregado(s).`, 'success');

    // Limpar input file
    event.target.value = '';

  } catch (error) {
    console.error('Erro ao importar:', error);
    showToast('Erro ao importar: ' + error.message, 'error');
    event.target.value = '';
  }
});

// Função auxiliar para escapar HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Função para exibir e editar campos agrupados
async function displayGroupedFields() {
  const fieldsEditorContainer = document.getElementById('fieldsEditorContainer');
  const saveFieldsBtn = document.getElementById('saveFieldsBtn');
  
  try {
    const data = await chrome.storage.sync.get(['formData', 'fieldLabels', 'fieldGroups', 'showFieldNames', 'formName']);
    const showFieldNames = data.showFieldNames === true; // Padrão: false
    
    if (!data.formData || Object.keys(data.formData).length === 0) {
      fieldsEditorContainer.innerHTML = '<p class="text-muted text-center">Nenhum campo salvo ainda. Use "Carregar da Página" no popup para carregar os dados.</p>';
      saveFieldsBtn.disabled = true;
      return;
    }

    const formData = data.formData;
    const fieldLabels = data.fieldLabels || {};
    const fieldGroups = data.fieldGroups || {};
    const formName = data.formName || '';

    // Agrupar campos por groupId
    const groupedFields = {};
    
    Object.keys(formData).forEach(fieldName => {
      const groupInfo = fieldGroups[fieldName] || { groupId: 'ungrouped', groupTitle: 'Sem Grupo' };
      const groupId = groupInfo.groupId || 'ungrouped';
      const groupTitle = groupInfo.groupTitle || 'Sem Grupo';
      
      if (!groupedFields[groupId]) {
        groupedFields[groupId] = {
          title: groupTitle,
          fields: []
        };
      }
      
      groupedFields[groupId].fields.push({
        fieldName: fieldName,
        value: formData[fieldName] || '',
        label: fieldLabels[fieldName] || fieldName,
        rowIndex: groupInfo.rowIndex
      });
    });

    // Ordenar campos dentro de cada grupo por rowIndex (para campos múltiplos) ou alfabeticamente
    Object.keys(groupedFields).forEach(groupId => {
      groupedFields[groupId].fields.sort((a, b) => {
        if (a.rowIndex !== undefined && b.rowIndex !== undefined) {
          if (a.rowIndex !== b.rowIndex) {
            return a.rowIndex - b.rowIndex;
          }
        }
        return a.label.localeCompare(b.label);
      });
    });

    // Gerar HTML
    let html = '';
    
    // Exibir nome do formulário se disponível
    if (formName) {
      html += '<div class="alert alert-info mb-4">';
      html += '<div class="d-flex align-items-center">';
      html += '<i class="bi bi-file-earmark-text-fill me-2 fs-5"></i>';
      html += '<div>';
      html += '<strong>Formulário:</strong> ';
      html += `<span class="ms-1">${escapeHtml(formName)}</span>`;
      html += '</div>';
      html += '</div>';
      html += '</div>';
    }
    
    Object.keys(groupedFields).forEach(groupId => {
      const group = groupedFields[groupId];
      
      html += `<div class="card mb-4">`;
      html += `<div class="card-header bg-primary text-white">`;
      html += `<h5 class="mb-0"><i class="bi bi-folder-fill"></i> ${escapeHtml(group.title)}</h5>`;
      html += `</div>`;
      html += `<div class="card-body">`;
      
      // Verificar se é grupo de campos múltiplos (tem rowIndex)
      const hasMultipleRows = group.fields.some(f => f.rowIndex !== undefined);
      
      if (hasMultipleRows) {
        // Agrupar por rowIndex para exibir como tabela
        const rowsByIndex = {};
        group.fields.forEach(field => {
          const rowIndex = field.rowIndex || 0;
          if (!rowsByIndex[rowIndex]) {
            rowsByIndex[rowIndex] = [];
          }
          rowsByIndex[rowIndex].push(field);
        });
        
        html += `<div class="table-responsive">`;
        html += `<table class="table table-bordered table-sm">`;
        html += `<thead class="table-light">`;
        html += `<tr>`;
        rowsByIndex[Object.keys(rowsByIndex)[0]].forEach(field => {
          html += `<th>${escapeHtml(field.label)}</th>`;
        });
        html += `</tr>`;
        html += `</thead>`;
        html += `<tbody>`;
        
        Object.keys(rowsByIndex).sort((a, b) => parseInt(a) - parseInt(b)).forEach(rowIndex => {
          // Ordenar campos dentro da linha pela ordem original (usar índice no array original)
          const sortedFields = rowsByIndex[rowIndex].sort((a, b) => {
            const indexA = group.fields.findIndex(f => f.fieldName === a.fieldName);
            const indexB = group.fields.findIndex(f => f.fieldName === b.fieldName);
            return indexA - indexB;
          });
          
          html += `<tr>`;
          sortedFields.forEach(field => {
            html += `<td>`;
            html += `<input type="text" class="form-control form-control-sm" `;
            html += `data-field-name="${escapeHtml(field.fieldName)}" `;
            html += `value="${escapeHtml(field.value)}" `;
            html += `placeholder="${escapeHtml(field.label)}">`;
            if (showFieldNames) {
              html += `<small class="text-muted d-block">${escapeHtml(field.fieldName)}</small>`;
            }
            html += `</td>`;
          });
          html += `</tr>`;
        });
        
        html += `</tbody>`;
        html += `</table>`;
        html += `</div>`;
      } else {
        // Campos simples: exibir como lista de campos
        group.fields.forEach(field => {
          html += `<div class="mb-3">`;
          html += `<label for="field_${escapeHtml(field.fieldName)}" class="form-label">`;
          html += `<strong>${escapeHtml(field.label)}</strong>`;
          if (showFieldNames) {
            html += `<small class="text-muted ms-2">${escapeHtml(field.fieldName)}</small>`;
          }
          html += `</label>`;
          html += `<input type="text" class="form-control" `;
          html += `id="field_${escapeHtml(field.fieldName)}" `;
          html += `data-field-name="${escapeHtml(field.fieldName)}" `;
          html += `value="${escapeHtml(field.value)}" `;
          html += `placeholder="${escapeHtml(field.label)}">`;
          html += `</div>`;
        });
      }
      
      html += `</div>`;
      html += `</div>`;
    });

    fieldsEditorContainer.innerHTML = html;
    saveFieldsBtn.disabled = false;
    
  } catch (error) {
    console.error('Erro ao carregar campos agrupados:', error);
    fieldsEditorContainer.innerHTML = '<p class="text-danger text-center">Erro ao carregar campos salvos.</p>';
    saveFieldsBtn.disabled = true;
  }
}

// Botão para salvar alterações nos campos
document.getElementById('saveFieldsBtn')?.addEventListener('click', async () => {
  try {
    const inputs = document.querySelectorAll('#fieldsEditorContainer input[data-field-name]');
    const data = await chrome.storage.sync.get(['formData', 'fieldLabels', 'fieldGroups']);
    
    if (!data.formData) {
      showToast('Nenhum dado encontrado para salvar!', 'warning');
      return;
    }

    const updatedFormData = { ...data.formData };
    
    inputs.forEach(input => {
      const fieldName = input.getAttribute('data-field-name');
      if (fieldName) {
        updatedFormData[fieldName] = input.value;
      }
    });

    // Salvar dados atualizados
    await chrome.storage.sync.set({ 
      formData: updatedFormData,
      fieldLabels: data.fieldLabels || {},
      fieldGroups: data.fieldGroups || {}
    });

    showToast('Campos salvos com sucesso!', 'success');
    
  } catch (error) {
    console.error('Erro ao salvar campos:', error);
    showToast('Erro ao salvar: ' + error.message, 'error');
  }
});

// Verificar status ao carregar a aba de Dados e Configurações
document.addEventListener('DOMContentLoaded', () => {
  const dataTab = document.getElementById('data-tab');
  const fieldsTab = document.getElementById('fields-tab');

  if (dataTab) {
    dataTab.addEventListener('shown.bs.tab', () => {
      checkExportStatus();
    });
  }

  if (fieldsTab) {
    fieldsTab.addEventListener('shown.bs.tab', () => {
      displayGroupedFields();
    });
  }

  // Verificar status ao carregar a página (caso a aba já esteja aberta)
  checkExportStatus();
  displayGroupedFields();
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
