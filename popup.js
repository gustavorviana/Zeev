// Instância global do update checker
let updateCheckerInstance = null;

// URLs do Zeev
const ZEEV_URLS = {
  ALLOWED_FORM_URLS: ['solutta.zeev.it/1.0/anonymous', 'solutta.zeev.it/1.0/request', 'solutta.zeev.it/1.0/auditt'],
  FORM_URL: 'https://solutta.zeev.it/1.0/anonymous?c=rPhXBidDIyatU65md%2BGPxwJcU1fSGyD4jw0MW9a1mdjN28skW%2FA%2FoH4PaWn9sFSoLBiVDrLWE4XAmWoOoWisprSECTjPmB0lYm8MHGLU%2BC4%3D',
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
    const data = await chrome.storage.sync.get(['formData', 'monthFormat']);

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
      args: [data.formData, monthFormat]
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

    const extractedData = results[0].result;

    if (!extractedData || Object.keys(extractedData).length === 0) {
      statusDiv.className = 'alert alert-warning';
      statusDiv.textContent = 'Nenhum dado encontrado na página!';
      return;
    }

    // Save extracted data
    await chrome.storage.sync.set({ formData: extractedData });

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
function fillFormFields(savedData, monthFormat) {
  // Verifica se está em um iframe e redireciona se necessário
  const iframe = document.querySelector("iframe");
  if (iframe) {
    if (iframe.src !== 'https://solutta.zeev.it/workflow/empty.html') {
      window.location.href = iframe.src;
      return;
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

  // Prepara os dados com valores automáticos
  const data = {
    inpnomeSolicitante: savedData.inpnomeSolicitante || "",
    inpemailDoSolicitante: savedData.inpemailDoSolicitante || "",
    inpdiretoriaCeoParecer: savedData.inpdiretoriaCeoParecer || "",
    inpdataSolicitacao: new Date().toLocaleString().split(",")[0],
    inpempresaContratante: savedData.inpempresaContratante || "",
    inptipoDeRemuneracao: document.querySelector("[xname=inptipoDeRemuneracao]")?.value || "",
    inpdiretorgerenteQueConfirmaExecucaoDoServicoPrestado: savedData.inpdiretorgerenteQueConfirmaExecucaoDoServicoPrestado || "",
    inpdiretorgerenteNoSistBpmQueConfirmaExecucaoDoServicoPrestado: savedData.inpdiretorgerenteNoSistBpmQueConfirmaExecucaoDoServicoPrestado || "",
    inparea: savedData.inparea || "",
    inpdepartamento: savedData.inpdepartamento || "",
    inpdescricaoServicoExecutado: savedData.inpdescricaoServicoExecutado || "",
    inpnomeParceiroPessoaJuridica: savedData.inpnomeParceiroPessoaJuridica || "",
    inpcodServico: savedData.inpcodServico || "",
    inpalteracaoContratual: document.querySelector("[xname=inpalteracaoContratual]")?.value || "",
    inpbanco: savedData.inpbanco || "",
    inpagencia: savedData.inpagencia || "",
    inpconta: savedData.inpconta || "",
    inpcpf: savedData.inpcpf || "",
    inpchavePix: savedData.inpchavePix || "",
    inpobs: savedData.inpobs || "",
    inpmes: formattedMonth,
    inpvalorTotalR: savedData.inpvalorTotalR || "",
    inpnrCentroDeCusto: savedData.inpnrCentroDeCusto || "",
    inpempresaPagadora: savedData.inpempresaPagadora || "",
    inpobservacao: savedData.inpobservacao || "",
    inpvalorTotalFaturadoR: savedData.inpvalorTotalFaturadoR || "",
    inpdataPrevistaParaCredito: savedData.inpdataPrevistaParaCredito || ""
  };

  let notFoundFields = [];

  // Preenche os campos usando a lógica do script original
  for (const key in data) {
    if (!data[key]) continue; // Pula campos vazios

    // Tenta preencher radio buttons
    const inputRadio = document.querySelector(`input[xname='${key}'][value='${data[key]}']`);
    if (inputRadio) {
      inputRadio.checked = true;
      inputRadio.dispatchEvent(new Event('change', { bubbles: true }));
      continue;
    }

    // Tenta preencher input ou select
    const inputSelect = document.querySelector(`input[xname='${key}'],select[xname='${key}']`);
    if (inputSelect) {
      inputSelect.value = data[key];
      inputSelect.dispatchEvent(new Event('input', { bubbles: true }));
      inputSelect.dispatchEvent(new Event('change', { bubbles: true }));
      inputSelect.dispatchEvent(new Event('blur', { bubbles: true }));
      continue;
    }

    // Campo não encontrado
    notFoundFields.push(key);
  }

  // Mostra alertas para campos não encontrados (opcional)
  if (notFoundFields.length > 0) {
    console.log('Campos não encontrados:', notFoundFields);
  }
}

// This function will be injected into the page to extract data
function extractFormData() {
  const fieldNames = [
    'inpnomeSolicitante',
    'inpemailDoSolicitante',
    'inpdiretoriaCeoParecer',
    'inpempresaContratante',
    'inpdiretorgerenteQueConfirmaExecucaoDoServicoPrestado',
    'inpdiretorgerenteNoSistBpmQueConfirmaExecucaoDoServicoPrestado',
    'inparea',
    'inpdepartamento',
    'inpdescricaoServicoExecutado',
    'inpnomeParceiroPessoaJuridica',
    'inpcodServico',
    'inpbanco',
    'inpagencia',
    'inpconta',
    'inpcpf',
    'inpchavePix',
    'inpobs',
    'inpvalorTotalR',
    'inpnrCentroDeCusto',
    'inpempresaPagadora',
    'inpobservacao',
    'inpvalorTotalFaturadoR',
    'inpdataPrevistaParaCredito'
  ];

  const extractedData = {};

  fieldNames.forEach(fieldName => {
    // Tenta pegar valor de radio button marcado
    const radioChecked = document.querySelector(`input[xname='${fieldName}']:checked`);
    if (radioChecked) {
      extractedData[fieldName] = radioChecked.value;
      return;
    }

    // Tenta pegar valor de input ou select
    const inputSelect = document.querySelector(`input[xname='${fieldName}'],select[xname='${fieldName}']`);
    if (inputSelect && inputSelect.value) {
      extractedData[fieldName] = inputSelect.value;
    }
  });

  return extractedData;
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