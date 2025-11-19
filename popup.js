// Instância global do update checker
let updateCheckerInstance = null;

// URLs do Zeev
const ZEEV_URLS = {
  ALLOWED_FORM_URLS: ['solutta.zeev.it/1.0/anonymous', 'solutta.zeev.it/1.0/request', 'solutta.zeev.it/1.0/auditt'],
  FORM_URL: 'https://solutta.zeev.it/2.0/anonymous?c=MH8LCByGEtnEOcKp2Wna2oJaKG7rByIaMBNnnchzTiOKBaWOlVTAbokvpTtD8%2FBqZqTaPRkmw%2F%2FQdb%2FmKwDpzXOP69N%2F1GzLFCQ6GwdRVoo%3D#top',
  BASE_DOMAIN: 'solutta.zeev.it'
};

// Função para atualizar o banner de atualização
function showUpdateBanner(updateInfo) {
  const updateBanner = document.getElementById('updateBanner');
  const remoteVersionEl = document.getElementById('remoteVersion');
  const updateLink = document.getElementById('updateLink');

  if (updateInfo && updateInfo.hasUpdate) {
    // Mostrar banner de atualização (permanente)
    remoteVersionEl.textContent = updateInfo.remoteVersion;
    updateLink.href = updateInfo.repoUrl;
    updateBanner.classList.add('show');
  } else {
    // Ocultar banner se não houver atualização
    updateBanner.classList.remove('show');
  }
}

// Verificar atualizações ao abrir o popup
(async () => {
  try {
    updateCheckerInstance = new UpdateChecker();
    const updateInfo = await updateCheckerInstance.checkAndSave(false);
    showUpdateBanner(updateInfo);
  } catch (error) {
    console.error('Erro ao verificar atualizações:', error);
  }
})();

// Verificar se está no Zeev ao abrir o popup e mostrar botões apropriados
(async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const zeevOpenSection = document.getElementById('zeevOpenSection');
    const zeevClosedSection = document.getElementById('zeevClosedSection');
    const searchSection = document.getElementById('searchSection');
    const fillFormBtn = document.getElementById('fillForm');
    const loadFromPageBtn = document.getElementById('loadFromPage');

    // Verificar se a aba atual é do formulário Zeev (URL específica ou contém o domínio base)
    const isZeevFormPage = isZeevForm(tab.url);

    if (isZeevFormPage) {
      // Está no Zeev, verificar se é tela de leitura
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: checkIfReadOnlyPage
        });

        const isReadOnly = results[0].result;

        if (isReadOnly) {
          // É tela de leitura (Detalhamento #), mostrar apenas "Carregar da Página"
          zeevOpenSection.style.display = 'block';
          fillFormBtn.style.display = 'none';
          loadFromPageBtn.style.display = 'block';
        } else {
          // É tela de formulário editável, mostrar todos os botões
          zeevOpenSection.style.display = 'block';
          fillFormBtn.style.display = 'block';
          loadFromPageBtn.style.display = 'block';
        }

        zeevClosedSection.style.display = 'none';
        searchSection.style.display = 'none';

      } catch (checkError) {
        console.log('Erro ao verificar tipo de página:', checkError);
        // Em caso de erro, mostrar todos os botões
        zeevOpenSection.style.display = 'block';
        fillFormBtn.style.display = 'block';
        loadFromPageBtn.style.display = 'block';
        zeevClosedSection.style.display = 'none';
        searchSection.style.display = 'none';
      }
    } else {
      // Não está no Zeev, mostrar botões "Buscar" e "Novo"
      zeevOpenSection.style.display = 'none';
      fillFormBtn.style.display = 'none';
      loadFromPageBtn.style.display = 'none';
      zeevClosedSection.style.display = 'block';
      searchSection.style.display = 'none';

      // Tentar extrair informações da página automaticamente
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: extractProcessInfoFromPage
        });

        const extractedInfo = results[0].result;

        if (extractedInfo && extractedInfo.processNumber && extractedInfo.verifier) {
          // Preencher os campos automaticamente
          document.getElementById('processNumber').value = extractedInfo.processNumber;
          document.getElementById('verifier').value = extractedInfo.verifier;

          // Mostrar a seção de busca já que as informações foram encontradas
          searchSection.style.display = 'block';

          // Ocultar o botão "Buscar" e expandir "Novo"
          const toggleSearchBtn = document.getElementById('toggleSearchBtn2');
          const newFormBtn = document.getElementById('newForm');
          toggleSearchBtn.style.display = 'none';
          newFormBtn.classList.remove('flex-fill');
          zeevClosedButtons.classList.remove('d-flex', 'flex-row');
          zeevClosedButtons.classList.add('d-grid');

          // Mostrar feedback visual
          const statusDiv = document.getElementById('status');
          statusDiv.className = 'status-message alert alert-success show';
          statusDiv.textContent = 'Informações detectadas automaticamente!';

          setTimeout(() => {
            statusDiv.textContent = '';
            statusDiv.className = 'status-message';
          }, 3000);
        }
      } catch (extractError) {
        console.log('Não foi possível extrair informações da página:', extractError);
      }
    }
  } catch (error) {
    console.error('Erro ao verificar URL:', error);
  }
})();



// Link para abrir a página de opções
document.getElementById('optionsLink').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});


// Botão para mostrar a seção de busca (quando não está no Zeev)
document.getElementById('toggleSearchBtn2').addEventListener('click', async () => {
  const searchSection = document.getElementById('searchSection');
  const toggleSearchBtn = document.getElementById('toggleSearchBtn2');
  const newFormBtn = document.getElementById('newForm');

  // Mostrar a seção de busca
  searchSection.style.display = 'block';
  // Ocultar apenas o botão "Buscar"
  toggleSearchBtn.style.display = 'none';
  // Fazer o botão "Novo" ocupar toda a largura
  newFormBtn.classList.remove('flex-fill');
  newFormBtn.parentElement.classList.remove('d-flex', 'flex-row');
  newFormBtn.parentElement.classList.add('d-grid');

  // Tentar extrair informações da página automaticamente
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: extractProcessInfoFromPage
    });

    const extractedInfo = results[0].result;

    if (extractedInfo && extractedInfo.processNumber && extractedInfo.verifier) {
      // Preencher os campos automaticamente
      document.getElementById('processNumber').value = extractedInfo.processNumber;
      document.getElementById('verifier').value = extractedInfo.verifier;

      // Mostrar feedback visual
      const statusDiv = document.getElementById('status');
      statusDiv.className = 'status-message alert alert-success show';
      statusDiv.textContent = 'Informações detectadas automaticamente!';

      setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className = 'status-message';
      }, 3000);
    }
  } catch (extractError) {
    console.log('Não foi possível extrair informações da página:', extractError);
  }
});

// Botão para fechar a seção de busca
document.getElementById('closeSearchBtn').addEventListener('click', async () => {
  const searchSection = document.getElementById('searchSection');
  const toggleSearchBtn = document.getElementById('toggleSearchBtn2');
  const newFormBtn = document.getElementById('newForm');
  const zeevClosedButtons = document.getElementById('zeevClosedButtons');

  searchSection.style.display = 'none';

  // Restaurar os botões "Buscar" e "Novo" lado a lado
  toggleSearchBtn.style.display = 'block';
  newFormBtn.classList.add('flex-fill');
  zeevClosedButtons.classList.remove('d-grid');
  zeevClosedButtons.classList.add('d-flex', 'flex-row');

  // Limpar campos ao fechar
  document.getElementById('processNumber').value = '';
  document.getElementById('verifier').value = '';
});


// Botão "Novo" - Abre nova aba do Zeev
document.getElementById('newForm').addEventListener('click', async () => {
  const statusDiv = document.getElementById('status');

  try {
    // Cria nova aba
    await chrome.tabs.create({
      url: ZEEV_URLS.FORM_URL,
      active: true
    });

    window.close(); // Fecha o popup

  } catch (error) {
    statusDiv.className = 'status-message alert alert-danger show';
    statusDiv.textContent = 'Erro ao abrir: ' + error.message;
  }
});

document.getElementById('fillForm').addEventListener('click', async () => {
  const statusDiv = document.getElementById('status');

  try {
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Check if it's the correct URL
    const isZeevFormPage = isZeevForm(tab.url);

    if (!isZeevFormPage) {
      statusDiv.className = 'status-message alert alert-warning show';
      statusDiv.textContent = 'Abra o formulário Zeev primeiro!';
      setTimeout(() => {
        statusDiv.className = 'status-message';
        statusDiv.textContent = '';
      }, 3000);
      return;
    }

    // Get saved data and month format
    const data = await chrome.storage.sync.get(['formData', 'monthFormat', 'formName']);

    if (!data.formData) {
      statusDiv.className = 'status-message alert alert-warning show';
      statusDiv.textContent = 'Configure seus dados primeiro!';
      setTimeout(() => {
        statusDiv.className = 'status-message';
        statusDiv.textContent = '';
      }, 3000);
      return;
    }

    // Usar formato padrão se não houver configuração
    const monthFormat = data.monthFormat || '{mes} - {mesNome}/{ano}';

    // Inject and execute content script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: fillFormFields,
      args: [data.formData, monthFormat, data.formName || '']
    });

    statusDiv.className = 'status-message alert alert-success show';
    statusDiv.textContent = 'Formulário preenchido com sucesso!';

    setTimeout(() => {
      statusDiv.className = 'status-message';
      statusDiv.textContent = '';
    }, 3000);

  } catch (error) {
    statusDiv.className = 'status-message alert alert-danger show';
    statusDiv.textContent = 'Erro ao preencher: ' + error.message;
  }
});


/**
 * 
 * @param {string} url 
 */
function isZeevForm(url) {
  return url && (ZEEV_URLS.ALLOWED_FORM_URLS.findIndex(x => url.includes(x)) >= 0 ||
    url.startsWith(ZEEV_URLS.FORM_URL) ||
    (url.includes(ZEEV_URLS.BASE_DOMAIN) && url.includes('/workflow/'))
  )
}

document.getElementById('loadFromPage').addEventListener('click', async () => {
  const statusDiv = document.getElementById('status');

  try {
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Check if it's the correct URL
    const isZeevFormPage = isZeevForm(tab.url);

    if (!isZeevFormPage) {
      statusDiv.className = 'alert alert-warning';
      statusDiv.textContent = 'Abra o formulário Zeev primeiro!';
      setTimeout(() => {
        statusDiv.className = 'd-none';
      }, 3000);
      return;
    }

    // Verificar se o Bootstrap está disponível
    if (typeof bootstrap === 'undefined') {
      statusDiv.className = 'alert alert-danger';
      statusDiv.textContent = 'Erro: Bootstrap não carregado. Recarregue a extensão.';
      console.error('Bootstrap não está disponível');
      return;
    }

    // Mostrar modal de confirmação usando Bootstrap
    const modalElement = document.getElementById('confirmModal');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();

    // Aguardar resposta do usuário
    const userConfirmed = await new Promise((resolve) => {
      const confirmBtn = document.getElementById('modalConfirm');
      const cancelBtn = document.getElementById('modalCancel');
      const closeButtons = modalElement.querySelectorAll('[data-bs-dismiss="modal"]');

      const handleConfirm = () => {
        modal.hide();
        cleanup();
        resolve(true);
      };

      const handleCancel = () => {
        modal.hide();
        cleanup();
        resolve(false);
      };

      const cleanup = () => {
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        closeButtons.forEach(btn => btn.removeEventListener('click', handleCancel));
      };

      confirmBtn.addEventListener('click', handleConfirm);
      cancelBtn.addEventListener('click', handleCancel);
      closeButtons.forEach(btn => btn.addEventListener('click', handleCancel));
    });

    // Se o usuário cancelou, não faz nada
    if (!userConfirmed) {
      statusDiv.className = 'alert alert-warning';
      statusDiv.textContent = 'Operação cancelada!';
      setTimeout(() => {
        statusDiv.className = 'd-none';
      }, 2000);
      return;
    }

    // Inject and execute content script to extract data
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: extractFormData
    });

    const extractedResult = results[0].result;

    if (!extractedResult || !extractedResult.formData || Object.keys(extractedResult.formData).length === 0) {
      statusDiv.className = 'alert alert-warning';
      statusDiv.textContent = 'Nenhum dado encontrado na página!';
      return;
    }

    // Save extracted data, labels, groups and form name
    await chrome.storage.sync.set({
      formData: extractedResult.formData,
      fieldLabels: extractedResult.fieldLabels || {},
      fieldGroups: extractedResult.fieldGroups || {},
      formName: extractedResult.formName || ''
    });

    statusDiv.className = 'status-message alert alert-success show';
    statusDiv.textContent = 'Dados carregados e salvos com sucesso!';

    setTimeout(() => {
      statusDiv.className = 'status-message';
      statusDiv.textContent = '';
    }, 3000);

  } catch (error) {
    statusDiv.className = 'alert alert-danger';
    statusDiv.textContent = 'Erro ao carregar: ' + error.message;
  }
});

// Buscar Info - Faz requisição para o portal Zeev
document.getElementById('searchInfo').addEventListener('click', async () => {
  const statusDiv = document.getElementById('status');
  const processNumber = document.getElementById('processNumber').value.trim();
  const verifier = document.getElementById('verifier').value.trim();

  // Validar inputs
  if (!processNumber || !verifier) {
    statusDiv.className = 'alert alert-warning';
    statusDiv.textContent = 'Preencha todos os campos!';
    setTimeout(() => {
      statusDiv.className = 'd-none';
      statusDiv.textContent = '';
    }, 3000);
    return;
  }

  try {
    statusDiv.className = 'alert alert-info';
    statusDiv.textContent = 'Buscando informações...';

    // Fazer requisição para o endpoint
    const response = await fetch("https://portal-zeev.azurewebsites.net/ConfirmationNumber/Access", {
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "sec-ch-ua": "\"Google Chrome\";v=\"141\", \"Not?A_Brand\";v=\"8\", \"Chromium\";v=\"141\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "x-requested-with": "XMLHttpRequest"
      },
      referrer: "https://portal-zeev.azurewebsites.net/?c=eyJhcHBDb2RlIjoiIiwibGFuZ3VhZ2UiOiJwdC1CUiIsIm9yaWdpbiI6Imh0dHBzOi8vc29sdXR0YS56ZWV2Lml0LyIsInVybFJlZGlyZWN0IjoiIiwiZmVlZGJhY2siOiIiLCJjb2RTeXN0ZW0iOjE0NDZ9",
      body: JSON.stringify({
        confirmationCode: verifier,
        captcha: "gkqd2w",
        codFlowExecute: processNumber,
        origin: "https://solutta.zeev.it/"
      }),
      method: "POST",
      mode: "cors",
      credentials: "omit"
    });

    const data = await response.json();

    // Verificar se a resposta foi bem-sucedida
    if (data.statusResult === 'success' && data.urlToReport) {
      statusDiv.className = 'alert alert-success';
      statusDiv.textContent = 'Informações encontradas! Abrindo relatório...';

      // Abrir URL em nova guia
      await chrome.tabs.create({
        url: 'https://solutta.zeev.it' + data.urlToReport,
        active: true
      });

      setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className = 'status';
        // Limpar campos
        document.getElementById('processNumber').value = '';
        document.getElementById('verifier').value = '';
      }, 2000);
    } else {
      statusDiv.className = 'alert alert-danger';
      statusDiv.textContent = data.message || 'Erro ao buscar informações. Verifique os dados informados. ' + JSON.stringify(data);

      setTimeout(() => {
        statusDiv.className = 'd-none';
        statusDiv.textContent = '';
      }, 4000);
    }

  } catch (error) {
    statusDiv.className = 'alert alert-danger';
    statusDiv.textContent = 'Erro ao buscar: ' + error.message;

    setTimeout(() => {
      statusDiv.className = 'd-none';
      statusDiv.textContent = '';
    }, 3000);
  }
});

// This function will be injected into the page
function fillFormFields(savedData, monthFormat, savedFormName) {
  // Verifica se está em um iframe e redireciona se necessário
  const iframe = document.querySelector("iframe");
  if (iframe) {
    if (iframe.src !== 'https://solutta.zeev.it/workflow/empty.html') {
      window.location.href = iframe.src;
      return;
    }
  }

  // Verificar se o nome do formulário é diferente do salvo
  if (savedFormName) {
    const currentFormNameElement = document.querySelector('h5.small.d-inline.text-dark');
    if (currentFormNameElement) {
      const currentFormName = currentFormNameElement.textContent.trim();
      if (currentFormName && currentFormName !== savedFormName) {
        // Mostrar alerta informando que está em um form diferente
        const message = `⚠️ ATENÇÃO: Você está em um formulário diferente!\n\n` +
          `Formulário salvo: "${savedFormName}"\n` +
          `Formulário atual: "${currentFormName}"\n\n` +
          `Os campos podem não corresponder corretamente. Deseja continuar mesmo assim?`;
        
        const userConfirmed = confirm(message);
        if (!userConfirmed) {
          return;
        }
      }
    }
  }

  // Função para formatar o mês de acordo com o template
  function formatMonth(template) {
    const now = new Date();
    const monthNumber = now.getMonth() + 1;
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const monthName = monthNames[monthNumber - 1];
    const year = now.getFullYear();

    return template
      .replace(/{mes}/g, monthNumber)
      .replace(/{mesNome}/g, monthName)
      .replace(/{ano}/g, year);
  }

  // Formatar o mês usando o template configurado
  const formattedMonth = monthFormat ? formatMonth(monthFormat) : ((new Date().getMonth() + 1) + " - " + new Date().getFullYear());

  // Função auxiliar para preencher um campo
  function fillField(fieldName, value) {
    if (!value) return false;

    // Verificar se é campo múltiplo (tem formato: fieldName_groupId_rowIndex)
    const fieldParts = fieldName.split('_');
    const isMultipleField = fieldParts.length >= 3;
    const baseFieldName = fieldParts[0];
    const groupId = isMultipleField ? fieldParts[1] : null;
    const rowIndex = isMultipleField ? parseInt(fieldParts[2]) : null;

    // Tentar encontrar o campo por diferentes seletores
    const selectors = [
      `input[xname='${fieldName}']`,
      `input[xname='${baseFieldName}']`,
      `input[id='${fieldName}']`,
      `input[id='${baseFieldName}']`,
      `input[name='${fieldName}']`,
      `input[name='${baseFieldName}']`,
      `input[data-name='${fieldName}']`,
      `input[data-name='${baseFieldName}']`,
      `select[xname='${fieldName}']`,
      `select[xname='${baseFieldName}']`,
      `select[id='${fieldName}']`,
      `select[id='${baseFieldName}']`,
      `textarea[xname='${fieldName}']`,
      `textarea[xname='${baseFieldName}']`
    ];

    // Primeiro, tentar radio buttons - buscar por xname, id, name e data-name
    const radioSelectors = [
      `input[type="radio"][xname='${fieldName}']`,
      `input[type="radio"][xname='${baseFieldName}']`,
      `input[type="radio"][id='${fieldName}']`,
      `input[type="radio"][id='${baseFieldName}']`,
      `input[type="radio"][name='${fieldName}']`,
      `input[type="radio"][name='${baseFieldName}']`,
      `input[type="radio"][data-name='${fieldName}']`,
      `input[type="radio"][data-name='${baseFieldName}']`
    ];

    for (const selector of radioSelectors) {
      const radioInputs = document.querySelectorAll(selector);
      for (const radio of radioInputs) {
        // Comparar valor normalizado (remover espaços, converter para string)
        const radioValue = String(radio.value || '').trim();
        const searchValue = String(value || '').trim();

        if (radioValue === searchValue || radioValue.toLowerCase() === searchValue.toLowerCase()) {
          // Desmarcar outros radios do mesmo grupo primeiro
          const radioName = radio.name || radio.getAttribute('xname') || radio.getAttribute('data-name');
          if (radioName) {
            const groupRadios = document.querySelectorAll(`input[type="radio"][name="${radioName}"], input[type="radio"][xname="${radioName}"], input[type="radio"][data-name="${radioName}"]`);
            groupRadios.forEach(r => r.checked = false);
          }

          radio.checked = true;
          radio.dispatchEvent(new Event('click', { bubbles: true }));
          radio.dispatchEvent(new Event('change', { bubbles: true }));
          radio.dispatchEvent(new Event('input', { bubbles: true }));
          return true;
        }
      }
    }

    // Se for campo múltiplo, buscar na linha específica da tabela
    if (isMultipleField && groupId !== null && rowIndex !== null) {
      const table = document.querySelector(`table[data-groupid="${groupId}"]`);
      if (table) {
        const tbody = table.querySelector('tbody');
        if (tbody) {
          const rows = Array.from(tbody.querySelectorAll('tr:not(.header)'));
          if (rows[rowIndex]) {
            const row = rows[rowIndex];
            // Buscar input na linha específica
            const inputs = row.querySelectorAll('input, select, textarea');
            for (const input of inputs) {
              const inputName = input.getAttribute('data-name') || input.id || input.name;
              const inputBaseName = inputName ? inputName.split('_')[0] : '';

              // Normalizar nomes removendo prefixo 'inp' para comparação (mesma lógica da leitura)
              const normalizeFieldName = (name) => {
                if (!name) return '';
                // Remover prefixo 'inp' se presente
                return name.startsWith('inp') ? name.substring(3) : name;
              };

              const normalizedBaseFieldName = normalizeFieldName(baseFieldName);
              const normalizedInputBaseName = normalizeFieldName(inputBaseName);
              const normalizedInputName = normalizeFieldName(inputName);

              // Comparar nomes normalizados (com e sem prefixo 'inp')
              if (normalizedInputBaseName === normalizedBaseFieldName || 
                  normalizedInputName === normalizedBaseFieldName ||
                  inputBaseName === baseFieldName || 
                  inputName === baseFieldName) {
                return fillInputElement(input, value);
              }
            }
          }
        }
      }
    }

    // Depois, tentar inputs normais, selects e textareas
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.type !== 'radio' && element.type !== 'hidden') {
        return fillInputElement(element, value);
      }
    }

    return false;
  }

  // Função auxiliar para normalizar valor numérico para máscara decimal
  // Remove TODA pontuação e mantém apenas números, deixando a máscara formatar
  function normalizeDecimalValue(value) {
    if (!value) return '';

    // Converter para string
    let strValue = String(value).trim();

    // Remover TODA formatação: R$, espaços, pontos, vírgulas - manter apenas números
    // Isso garante que "7200" fique como "7200" e não "72.00"
    strValue = strValue.replace(/[^\d]/g, '');

    // Se o valor está vazio após remover formatação, retornar vazio
    if (!strValue) return '';

    // Retornar apenas os dígitos (ex: "7200" permanece "7200")
    // A máscara vai formatar corretamente depois
    return strValue;
  }

  // Função auxiliar para preencher um elemento input/select/textarea
  function fillInputElement(element, value) {
    if (!element) return false;

    let valueStr = String(value);
    
    // Substituir {mesAtual} pelo mês formatado se presente
    if (valueStr.includes('{mesAtual}')) {
      const formattedMonth = monthFormat ? formatMonth(monthFormat) : ((new Date().getMonth() + 1) + " - " + new Date().getFullYear());
      valueStr = formattedMonth;
    }

    // Para inputs de texto e textarea, simular paste
    if ((element.tagName === 'INPUT' && element.type !== 'radio' && element.type !== 'checkbox' && element.type !== 'hidden') || element.tagName === 'TEXTAREA') {
      // Focar no elemento
      element.focus();
      
      // Selecionar todo o conteúdo (Ctrl+A)
      element.select();
      
      // Criar objeto clipboardData para o evento paste
      let clipboardData;
      try {
        clipboardData = new DataTransfer();
        clipboardData.setData('text/plain', valueStr);
      } catch (e) {
        // Fallback: criar objeto clipboardData manualmente
        clipboardData = {
          getData: function(type) {
            return type === 'text/plain' ? valueStr : '';
          },
          setData: function(type, data) {
            // Armazenar o valor
            this._data = data;
          },
          types: ['text/plain'],
          _data: valueStr
        };
      }
      
      // Simular paste usando ClipboardEvent
      const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData: clipboardData
      });
      
      // Disparar o evento paste
      const pasteHandled = element.dispatchEvent(pasteEvent);
      
      // Se o evento não foi cancelado e o valor mudou, o paste funcionou
      // Caso contrário, definir o valor diretamente
      if (!pasteHandled || element.value === '') {
        // Tentar definir valor diretamente após um pequeno delay para permitir processamento do paste
        setTimeout(() => {
          if (element.value !== valueStr) {
            element.value = valueStr;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }, 10);
      } else {
        // Disparar eventos de input e change para garantir
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } else if (element.tagName === 'SELECT') {
      // Para select, definir valor diretamente
      element.value = valueStr;
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      // Para outros tipos, definir valor diretamente
      element.value = valueStr;
    }

    return true;
  }

  // Preencher campos de data automáticos
  const autoFields = {
    inpdataSolicitacao: new Date().toLocaleString('pt-BR').split(',')[0],
    inpmes: formattedMonth
  };

  // Adicionar campos automáticos aos dados salvos
  const allData = { ...savedData, ...autoFields };

  let filledCount = 0;
  let notFoundFields = [];

  // Preencher todos os campos salvos
  for (const fieldName in allData) {
    const value = allData[fieldName];
    if (!value) continue;

    if (fillField(fieldName, value)) {
      filledCount++;
    } else {
      notFoundFields.push(fieldName);
    }
  }

  // Mostra alertas para campos não encontrados (opcional)
  if (notFoundFields.length > 0) {
    console.log('Campos não encontrados:', notFoundFields);
  }

  console.log(`Preenchidos: ${filledCount} de ${Object.keys(allData).length} campos`);
}

// This function will be injected into the page to extract data
function extractFormData() {
  const extractedData = {};
  const fieldLabels = {};
  const fieldGroups = {};

  // Buscar todas as tables com data-groupid
  const tables = document.querySelectorAll('table[data-groupid]');

  tables.forEach(table => {
    const groupId = table.getAttribute('data-groupid');
    const tbody = table.querySelector('tbody');

    if (!tbody) return;

    // Buscar título do grupo: caption da table ou tr.group acima
    let groupTitle = '';
    const caption = table.querySelector('caption');
    if (caption) {
      groupTitle = caption.textContent.trim();
    } else {
      // Buscar tr.group que contém o groupId
      const groupRow = document.querySelector(`tr.group b[data-key="${groupId}"]`);
      if (groupRow) {
        groupTitle = groupRow.textContent.trim();
      }
    }

    const rows = Array.from(tbody.querySelectorAll('tr'));

    // Verificar se é formato múltiplo (tem linha com class="header")
    const hasHeaderRow = rows.some(row => row.classList.contains('header'));

    if (hasHeaderRow) {
      // Formato múltiplo: linha header tem os nomes, linhas seguintes têm os valores
      const headerRow = rows.find(row => row.classList.contains('header'));
      if (!headerRow) return;

      // Extrair nomes das colunas do header (ignorar primeira coluna que geralmente tem botões)
      const headerCells = Array.from(headerRow.querySelectorAll('td'));
      const columnInfo = [];

      headerCells.forEach((cell, index) => {
        // Pular primeira coluna se tiver botão
        if (index === 0 && cell.querySelector('button')) {
          return;
        }

        const columnName = cell.getAttribute('column-name');
        const label = cell.textContent.trim();

        if (columnName && label) {
          columnInfo.push({
            columnName: columnName,
            label: label,
            index: index
          });
        }
      });

      // Processar linhas de dados (ignorar linha header)
      // Filtrar apenas linhas de dados para calcular o índice correto
      const dataRows = rows.filter(row => !row.classList.contains('header'));
      
      dataRows.forEach((row, dataRowIndex) => {
        const dataCells = Array.from(row.querySelectorAll('td'));

        // Pular primeira coluna se tiver botão
        let cellIndex = 0;
        if (dataCells[0] && dataCells[0].querySelector('button')) {
          cellIndex = 1;
        }

        columnInfo.forEach((colInfo) => {
          if (cellIndex >= dataCells.length) return;

          const cell = dataCells[cellIndex];
          const input = cell.querySelector('input, select, textarea');

          if (input) {
            // Ignorar campos hidden (mesma lógica da aplicação)
            if (input.type === 'hidden') {
              cellIndex++;
              return;
            }

            // Obter valores originais antes de normalizar
            const originalDataName = input.getAttribute('data-name') || '';
            const originalId = input.id || '';
            const originalName = input.name || '';

            // Verificar se o campo contém "mesReferencia" ANTES de normalizar
            const isMesReferencia = 
              originalDataName.toLowerCase().includes('mesreferencia') ||
              originalDataName.toLowerCase().includes('mes_referencia') ||
              originalId.toLowerCase().includes('mesreferencia') ||
              originalId.toLowerCase().includes('mes_referencia') ||
              originalName.toLowerCase().includes('mesreferencia') ||
              originalName.toLowerCase().includes('mes_referencia');

            // Usar data-name, id ou name como identificador do campo
            let fieldName = originalDataName || originalId || originalName;

            // Se não encontrou nome, tentar derivar do column-name
            if (!fieldName) {
              fieldName = colInfo.columnName.replace('col', 'inp');
            }

            // Garantir que tenha prefixo 'inp' se necessário
            if (fieldName && !fieldName.startsWith('inp')) {
              fieldName = `inp${fieldName}`;
            }

            let value = input.value || '';
            const label = colInfo.label || '';

            // Se for campo mesReferencia, salvar como {mesAtual}
            if (isMesReferencia) {
              value = '{mesAtual}';
            }

            if (fieldName) {
              // Para campos múltiplos, usar uma chave única por linha
              // Usar dataRowIndex que corresponde à posição real na lista de linhas de dados
              const uniqueKey = `${fieldName}_${groupId}_${dataRowIndex}`;
              extractedData[uniqueKey] = value;
              fieldLabels[uniqueKey] = label;
              fieldGroups[uniqueKey] = {
                groupId: groupId,
                groupTitle: groupTitle,
                rowIndex: dataRowIndex
              };
            }
          }

          cellIndex++;
        });
      });
    } else {
      // Formato simples: 2 TDs - primeiro tem nome, segundo tem valor
      rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td'));

        if (cells.length >= 2) {
          const nameCell = cells[0];
          const valueCell = cells[1];

          // Verificar se a célula de valor tem input
          const input = valueCell.querySelector('input, select, textarea');

          if (input) {
            // Ignorar campos hidden (mesma lógica da aplicação)
            if (input.type === 'hidden') {
              return;
            }

            // Obter valores originais antes de normalizar
            const originalDataName = input.getAttribute('data-name') || '';
            const originalId = input.id || '';
            const originalName = input.name || '';

            // Verificar se o campo contém "mesReferencia" ANTES de normalizar
            const isMesReferencia = 
              originalDataName.toLowerCase().includes('mesreferencia') ||
              originalDataName.toLowerCase().includes('mes_referencia') ||
              originalId.toLowerCase().includes('mesreferencia') ||
              originalId.toLowerCase().includes('mes_referencia') ||
              originalName.toLowerCase().includes('mesreferencia') ||
              originalName.toLowerCase().includes('mes_referencia');

            // Usar data-name, id ou name como identificador do campo
            let fieldName = originalDataName || originalId || originalName;
            let value = input.value || '';
            const label = nameCell.textContent.trim();

            // Se for campo mesReferencia, salvar como {mesAtual}
            if (isMesReferencia) {
              value = '{mesAtual}';
            }

            if (fieldName) {
              // Adicionar prefixo 'inp' se não tiver
              const normalizedFieldName = fieldName.startsWith('inp') ? fieldName : `inp${fieldName}`;
              extractedData[normalizedFieldName] = value;
              fieldLabels[normalizedFieldName] = label;
              fieldGroups[normalizedFieldName] = {
                groupId: groupId,
                groupTitle: groupTitle
              };
            }
          }
        }
      });
    }
  });

  // Buscar o nome do formulário (h5 com classe "small d-inline text-dark")
  let formName = '';
  const formNameElement = document.querySelector('h5.small.d-inline.text-dark');
  if (formNameElement) {
    formName = formNameElement.textContent.trim();
  }

  // Retornar dados com labels, grupos e nome do formulário
  return {
    formData: extractedData,
    fieldLabels: fieldLabels,
    fieldGroups: fieldGroups,
    formName: formName
  };
}

// This function will be injected into the page to extract process info
function extractProcessInfoFromPage() {
  try {
    // Obter todo o texto da página
    const pageText = document.body.innerText || document.body.textContent;

    // Procurar pelo padrão de texto que contém as informações
    // Padrão: "nr. do processo, que é 10405 e também o nr. verificador que é UC7TNS"

    // Regex para capturar número do processo (geralmente números)
    const processNumberMatch = pageText.match(/nr\.\s*do\s*processo[,\s]+que\s+é\s+(\w+)/i);

    // Regex para capturar verificador (geralmente alfanumérico)
    const verifierMatch = pageText.match(/nr\.\s*verificador\s+que\s+é\s+(\w+)/i);

    const result = {
      processNumber: null,
      verifier: null
    };

    if (processNumberMatch && processNumberMatch[1]) {
      result.processNumber = processNumberMatch[1].trim();
    }

    if (verifierMatch && verifierMatch[1]) {
      result.verifier = verifierMatch[1].trim();
    }

    // Se não encontrou com o padrão acima, tentar padrões alternativos
    if (!result.processNumber || !result.verifier) {
      // Tentar padrão alternativo: "processo: 10405" ou "verificador: UC7TNS"
      if (!result.processNumber) {
        const altProcessMatch = pageText.match(/processo[:\s]+(\d+)/i);
        if (altProcessMatch && altProcessMatch[1]) {
          result.processNumber = altProcessMatch[1].trim();
        }
      }

      if (!result.verifier) {
        const altVerifierMatch = pageText.match(/verificador[:\s]+([A-Z0-9]+)/i);
        if (altVerifierMatch && altVerifierMatch[1]) {
          result.verifier = altVerifierMatch[1].trim();
        }
      }
    }

    return result;
  } catch (error) {
    console.error('Erro ao extrair informações da página:', error);
    return { processNumber: null, verifier: null };
  }
}

// This function will be injected into the page to check if it's a read-only page
function checkIfReadOnlyPage() {
  try {
    // Procurar por h1 com texto "Detalhamento #"
    const h1Elements = document.querySelectorAll('h1');

    for (let h1 of h1Elements) {
      const text = h1.innerText || h1.textContent;
      if (text && text.includes('Detalhamento #')) {
        return true; // É uma tela de leitura
      }
    }

    return false; // Não é uma tela de leitura
  } catch (error) {
    console.error('Erro ao verificar se é página de leitura:', error);
    return false;
  }
}