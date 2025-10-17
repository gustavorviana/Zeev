// Verificar se está no Zeev ao abrir o popup e mostrar botões apropriados
(async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const zeevOpenButtons = document.getElementById('zeevOpenButtons');
    const zeevClosedButtons = document.getElementById('zeevClosedButtons');
    const toggleSearchContainer = document.getElementById('toggleSearchContainer');
    const searchSection = document.getElementById('searchSection');
    const fillFormBtn = document.getElementById('fillForm');
    const loadFromPageBtn = document.getElementById('loadFromPage');

    // Verificar se a aba atual é do Zeev
    if (tab.url && tab.url.includes('solutta.zeev.it')) {
      // Está no Zeev, verificar se é tela de leitura
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: checkIfReadOnlyPage
        });

        const isReadOnly = results[0].result;

        if (isReadOnly) {
          // É tela de leitura (Detalhamento #), mostrar apenas "Carregar da Página"
          zeevOpenButtons.style.display = 'block';
          fillFormBtn.style.display = 'none';
          loadFromPageBtn.style.display = 'block';
        } else {
          // É tela de formulário editável, mostrar todos os botões
          zeevOpenButtons.style.display = 'block';
          fillFormBtn.style.display = 'block';
          loadFromPageBtn.style.display = 'block';
        }

        zeevClosedButtons.style.display = 'none';
        toggleSearchContainer.style.display = 'block';
        searchSection.style.display = 'none';

      } catch (checkError) {
        console.log('Erro ao verificar tipo de página:', checkError);
        // Em caso de erro, mostrar todos os botões
        zeevOpenButtons.style.display = 'block';
        zeevClosedButtons.style.display = 'none';
        toggleSearchContainer.style.display = 'block';
        searchSection.style.display = 'none';
      }
    } else {
      // Não está no Zeev, mostrar botão "Novo" e a seção de busca
      zeevOpenButtons.style.display = 'none';
      zeevClosedButtons.style.display = 'block';
      toggleSearchContainer.style.display = 'none';
      searchSection.style.display = 'block';

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

          // Mostrar feedback visual
          const statusDiv = document.getElementById('status');
          statusDiv.className = 'status success';
          statusDiv.textContent = 'Informações detectadas automaticamente!';

          setTimeout(() => {
            statusDiv.textContent = '';
            statusDiv.className = 'status';
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

// Verificar se há dados salvos e habilitar botão de exportar
(async () => {
  try {
    const data = await chrome.storage.sync.get('formData');
    const exportBtn = document.getElementById('exportConfig');

    if (data.formData && Object.keys(data.formData).length > 0) {
      exportBtn.disabled = false;
    }
  } catch (error) {
    console.error('Erro ao verificar dados salvos:', error);
  }
})();

// Botão para mostrar a seção de busca
document.getElementById('toggleSearchBtn').addEventListener('click', () => {
  const toggleSearchContainer = document.getElementById('toggleSearchContainer');
  const searchSection = document.getElementById('searchSection');

  toggleSearchContainer.style.display = 'none';
  searchSection.style.display = 'block';
});

// Botão para fechar a seção de busca
document.getElementById('closeSearchBtn').addEventListener('click', () => {
  const toggleSearchContainer = document.getElementById('toggleSearchContainer');
  const searchSection = document.getElementById('searchSection');

  searchSection.style.display = 'none';
  toggleSearchContainer.style.display = 'block';

  // Limpar campos ao fechar
  document.getElementById('processNumber').value = '';
  document.getElementById('verifier').value = '';
});


// Botão "Novo" - Abre nova aba do Zeev
document.getElementById('newForm').addEventListener('click', async () => {
  const statusDiv = document.getElementById('status');

  try {
    const url = 'https://solutta.zeev.it/1.0/anonymous?c=rPhXBidDIyatU65md%2BGPxwJcU1fSGyD4jw0MW9a1mdjN28skW%2FA%2FoH4PaWn9sFSoLBiVDrLWE4XAmWoOoWisprSECTjPmB0lYm8MHGLU%2BC4%3D';

    // Cria nova aba
    await chrome.tabs.create({
      url: url,
      active: true
    });

    window.close(); // Fecha o popup

  } catch (error) {
    statusDiv.className = 'status error';
    statusDiv.textContent = 'Erro ao abrir: ' + error.message;
  }
});

document.getElementById('fillForm').addEventListener('click', async () => {
  const statusDiv = document.getElementById('status');

  try {
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Check if it's the correct URL
    if (!tab.url.includes('solutta.zeev.it')) {
      statusDiv.className = 'status warning';
      statusDiv.textContent = 'Abra o formulário Zeev primeiro!';
      return;
    }

    // Get saved data
    const data = await chrome.storage.sync.get('formData');

    if (!data.formData) {
      statusDiv.className = 'status warning';
      statusDiv.textContent = 'Configure seus dados primeiro!';
      return;
    }

    // Inject and execute content script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: fillFormFields,
      args: [data.formData]
    });

    statusDiv.className = 'status success';
    statusDiv.textContent = 'Formulário preenchido com sucesso!';

    setTimeout(() => {
      statusDiv.textContent = '';
      statusDiv.className = 'status';
    }, 3000);

  } catch (error) {
    statusDiv.className = 'status error';
    statusDiv.textContent = 'Erro ao preencher: ' + error.message;
  }
});

document.getElementById('loadFromPage').addEventListener('click', async () => {
  const statusDiv = document.getElementById('status');

  try {
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Check if it's the correct URL
    if (!tab.url.includes('solutta.zeev.it')) {
      statusDiv.className = 'status warning';
      statusDiv.textContent = 'Abra o formulário Zeev primeiro!';
      return;
    }

    // Mostrar modal de confirmação
    const modal = document.getElementById('confirmModal');
    modal.style.display = 'block';

    // Aguardar resposta do usuário
    const userConfirmed = await new Promise((resolve) => {
      const confirmBtn = document.getElementById('modalConfirm');
      const cancelBtn = document.getElementById('modalCancel');

      const closeModal = () => {
        modal.style.display = 'none';
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
      };

      const handleConfirm = () => {
        closeModal();
        resolve(true);
      };

      const handleCancel = () => {
        closeModal();
        resolve(false);
      };

      confirmBtn.addEventListener('click', handleConfirm);
      cancelBtn.addEventListener('click', handleCancel);
    });

    // Se o usuário cancelou, não faz nada
    if (!userConfirmed) {
      statusDiv.className = 'status warning';
      statusDiv.textContent = 'Operação cancelada!';
      setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className = 'status';
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
      statusDiv.className = 'status warning';
      statusDiv.textContent = 'Nenhum dado encontrado na página!';
      return;
    }

    // Save extracted data
    await chrome.storage.sync.set({ formData: extractedData });

    statusDiv.className = 'status success';
    statusDiv.textContent = 'Dados carregados e salvos com sucesso!';

    setTimeout(() => {
      statusDiv.textContent = '';
      statusDiv.className = 'status';
    }, 3000);

  } catch (error) {
    statusDiv.className = 'status error';
    statusDiv.textContent = 'Erro ao carregar: ' + error.message;
  }
});

// Exportar configurações para JSON
document.getElementById('exportConfig').addEventListener('click', async () => {
  const statusDiv = document.getElementById('status');

  try {
    // Get saved data
    const data = await chrome.storage.sync.get('formData');

    if (!data.formData || Object.keys(data.formData).length === 0) {
      statusDiv.className = 'status warning';
      statusDiv.textContent = 'Nenhum dado salvo para exportar!';
      setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className = 'status';
      }, 2000);
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

    statusDiv.className = 'status success';
    statusDiv.textContent = 'Configurações exportadas com sucesso!';

    setTimeout(() => {
      statusDiv.textContent = '';
      statusDiv.className = 'status';
    }, 3000);

  } catch (error) {
    statusDiv.className = 'status error';
    statusDiv.textContent = 'Erro ao exportar: ' + error.message;
  }
});

// Importar configurações do JSON
document.getElementById('importConfig').addEventListener('click', () => {
  document.getElementById('fileInput').click();
});

// Buscar Info - Faz requisição para o portal Zeev
document.getElementById('searchInfo').addEventListener('click', async () => {
  const statusDiv = document.getElementById('status');
  const processNumber = document.getElementById('processNumber').value.trim();
  const verifier = document.getElementById('verifier').value.trim();

  // Validar inputs
  if (!processNumber || !verifier) {
    statusDiv.className = 'status warning';
    statusDiv.textContent = 'Preencha todos os campos!';
    setTimeout(() => {
      statusDiv.textContent = '';
      statusDiv.className = 'status';
    }, 3000);
    return;
  }

  try {
    statusDiv.className = 'status';
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
      statusDiv.className = 'status success';
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
      statusDiv.className = 'status error';
      statusDiv.textContent = data.message || 'Erro ao buscar informações. Verifique os dados informados. ' + JSON.stringify(data);

      setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className = 'status';
      }, 4000);
    }

  } catch (error) {
    statusDiv.className = 'status error';
    statusDiv.textContent = 'Erro ao buscar: ' + error.message;

    setTimeout(() => {
      statusDiv.textContent = '';
      statusDiv.className = 'status';
    }, 3000);
  }
});

document.getElementById('fileInput').addEventListener('change', async (event) => {
  const statusDiv = document.getElementById('status');
  const file = event.target.files[0];

  if (!file) return;

  try {
    // Ler arquivo JSON
    const text = await file.text();
    let importedData;

    try {
      importedData = JSON.parse(text);
    } catch (parseError) {
      statusDiv.className = 'status error';
      statusDiv.textContent = 'Arquivo JSON inválido!';
      setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className = 'status';
      }, 3000);
      return;
    }

    // Verificar se há dados válidos
    if (!importedData || typeof importedData !== 'object' || Object.keys(importedData).length === 0) {
      statusDiv.className = 'status warning';
      statusDiv.textContent = 'Arquivo JSON não contém dados válidos!';
      setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className = 'status';
      }, 3000);
      return;
    }

    // Mostrar modal de confirmação
    const modal = document.getElementById('confirmModal');
    const modalBody = modal.querySelector('.modal-body');
    const originalMessage = modalBody.innerHTML;

    modalBody.innerHTML = `
      Tem certeza que deseja importar as configurações do arquivo?<br>
      <strong>Os dados salvos anteriormente serão substituídos.</strong><br>
      <br>
      <small>Arquivo: ${file.name}</small>
    `;

    modal.style.display = 'block';

    // Aguardar resposta do usuário
    const userConfirmed = await new Promise((resolve) => {
      const confirmBtn = document.getElementById('modalConfirm');
      const cancelBtn = document.getElementById('modalCancel');

      const closeModal = () => {
        modal.style.display = 'none';
        modalBody.innerHTML = originalMessage;
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
      };

      const handleConfirm = () => {
        closeModal();
        resolve(true);
      };

      const handleCancel = () => {
        closeModal();
        resolve(false);
      };

      confirmBtn.addEventListener('click', handleConfirm);
      cancelBtn.addEventListener('click', handleCancel);
    });

    // Limpar input file
    event.target.value = '';

    // Se o usuário cancelou, não faz nada
    if (!userConfirmed) {
      statusDiv.className = 'status warning';
      statusDiv.textContent = 'Importação cancelada!';
      setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className = 'status';
      }, 2000);
      return;
    }

    // Salvar dados importados
    await chrome.storage.sync.set({ formData: importedData });

    // Habilitar botão de exportar
    document.getElementById('exportConfig').disabled = false;

    statusDiv.className = 'status success';
    statusDiv.textContent = 'Configurações importadas com sucesso!';

    setTimeout(() => {
      statusDiv.textContent = '';
      statusDiv.className = 'status';
    }, 3000);

  } catch (error) {
    statusDiv.className = 'status error';
    statusDiv.textContent = 'Erro ao importar: ' + error.message;
    event.target.value = '';
  }
});


// This function will be injected into the page
function fillFormFields(savedData) {
  // Verifica se está em um iframe e redireciona se necessário
  const iframe = document.querySelector("iframe");
  if (iframe) {
    if (iframe.src !== 'https://solutta.zeev.it/workflow/empty.html') {
      window.location.href = iframe.src;
      return;
    }
  }

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
    inpmes: (new Date().getMonth() + 1) + " - " + new Date().getFullYear(),
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