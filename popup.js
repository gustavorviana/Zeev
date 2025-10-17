// Verificar se está no Zeev ao abrir o popup
(async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Se não estiver no Zeev, redireciona
    if (!tab.url.includes('solutta.zeev.it')) {
      await chrome.tabs.update(tab.id, { url: 'https://solutta.zeev.it/1.0/anonymous?c=rPhXBidDIyatU65md%2BGPxwJcU1fSGyD4jw0MW9a1mdjN28skW%2FA%2FoH4PaWn9sFSoLBiVDrLWE4XAmWoOoWisprSECTjPmB0lYm8MHGLU%2BC4%3D' });
      window.close(); // Fecha o popup
      return;
    }

    // Se estiver no Zeev, mostra o popup normalmente
  } catch (error) {
    console.error('Erro ao verificar URL:', error);
  }
})();

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

document.getElementById('openConfig').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
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