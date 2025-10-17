// Lista de todos os campos do formulário Zeev BPM
const fieldIds = [
  'inpnomeSolicitante',
  'inpemailDoSolicitante',
  'inpdiretoriaCeoParecer',
  'inpempresaContratante',
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
  'inpvalorTotalFaturadoR'
];

// Load saved data when page opens
document.addEventListener('DOMContentLoaded', async () => {
  const data = await chrome.storage.sync.get('formData');

  if (data.formData) {
    Object.keys(data.formData).forEach(key => {
      const element = document.getElementById(key);
      if (element) {
        element.value = data.formData[key];
      }
    });
  }
});

// Save data when form is submitted
document.getElementById('configForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = {};

  // Coleta todos os valores dos campos
  fieldIds.forEach(fieldId => {
    const element = document.getElementById(fieldId);
    if (element) {
      formData[fieldId] = element.value;
    }
  });

  try {
    await chrome.storage.sync.set({ formData });

    const statusDiv = document.getElementById('status');
    statusDiv.className = 'status success show';
    statusDiv.textContent = 'Configurações salvas com sucesso!';

    setTimeout(() => {
      statusDiv.classList.remove('show');
    }, 3000);
  } catch (error) {
    alert('Erro ao salvar: ' + error.message);
  }
});