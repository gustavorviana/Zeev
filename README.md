# Zeev Form Auto Fill

Extensão para Chrome que facilita o preenchimento automático de formulários do Zeev.

## Funcionalidades

- **Preenchimento Automático**: Preenche formulários do Zeev com dados salvos
- **Carregar da Página**: Extrai dados de um formulário preenchido e salva para reutilização
- **Buscar Informações**: Busca detalhes de processos pelo número e verificador
- **Importar/Exportar**: Importa e exporta configurações em formato JSON
- **Formato Personalizável**: Configure o formato de exibição do mês conforme sua preferência

## Instalação no Navegador

### Google Chrome / Microsoft Edge / Brave

1. **Baixe ou Clone o Repositório**
   - Faça o download dos arquivos da extensão ou clone este repositório
   - Certifique-se de ter todos os arquivos necessários na mesma pasta

2. **Acesse as Extensões**
   - Abra o Chrome e digite na barra de endereços: `chrome://extensions/`
   - Ou clique no menu (três pontos) > Mais ferramentas > Extensões
   - **Para Edge**: `edge://extensions/`
   - **Para Brave**: `brave://extensions/`

3. **Ative o Modo de Desenvolvedor**
   - No canto superior direito da página de extensões, ative a opção **"Modo de desenvolvedor"** ou **"Developer mode"**

4. **Carregue a Extensão**
   - Clique no botão **"Carregar sem compactação"** ou **"Load unpacked"**
   - Navegue até a pasta onde estão os arquivos da extensão
   - Selecione a pasta e clique em **"Selecionar pasta"** ou **"Select folder"**

5. **Verifique a Instalação**
   - A extensão **Zeev Form Auto Fill** deve aparecer na lista de extensões instaladas
   - Você verá o ícone da extensão na barra de ferramentas do navegador

6. **Fixe a Extensão (Opcional)**
   - Clique no ícone de quebra-cabeça (extensões) na barra de ferramentas
   - Encontre "Zeev Form Auto Fill" e clique no ícone de alfinete para fixá-la na barra

## Estrutura de Arquivos Necessários

Certifique-se de que a pasta da extensão contém os seguintes arquivos:

```
Zeev/
├── manifest.json      # Arquivo de configuração da extensão
├── popup.html         # Interface do popup
├── popup.js           # Lógica da extensão
├── icon16.png         # Ícone 16x16
├── icon48.png         # Ícone 48x48
├── icon128.png        # Ícone 128x128
└── README.md          # Este arquivo
```

## Como Usar

### 1. Primeira Configuração

#### Opção A: Carregar de um Formulário Preenchido
1. Acesse um formulário do Zeev já preenchido
2. Clique no ícone da extensão
3. Clique em **"Carregar da Página"**
4. Confirme a ação no modal
5. Os dados serão salvos automaticamente

#### Opção B: Importar Configuração JSON
1. Clique no ícone da extensão
2. Clique em **"Importar JSON"**
3. Selecione um arquivo JSON de configuração previamente exportado
4. Confirme a importação

### 2. Preencher Formulário

1. Acesse um novo formulário do Zeev
2. Clique no ícone da extensão
3. Clique em **"Preencher Formulário"**
4. O formulário será preenchido automaticamente com os dados salvos

### 3. Buscar Informações de Processo

1. Em qualquer página, clique no ícone da extensão
2. Clique em **"Buscar Informações"**
3. Digite o **Número do Processo** e o **Verificador**
4. Clique em **"Buscar Info"**
5. Uma nova aba será aberta com os detalhes do processo

### 4. Configurar Formato do Mês

1. Clique no ícone da extensão
2. Clique em **"Opções"**
3. Configure o formato usando as variáveis:
   - `{mes}` - Número do mês (1-12)
   - `{mesNome}` - Nome do mês por extenso
   - `{ano}` - Ano (4 dígitos)
4. Exemplo: `{mes} - {mesNome}/{ano}` resulta em "10 - Outubro/2025"
5. Clique em **"Salvar Configurações"**

### 5. Exportar Configuração

1. Clique no ícone da extensão
2. Clique em **"Exportar JSON"**
3. Um arquivo JSON será baixado com suas configurações
4. Use este arquivo para backup ou para compartilhar com outros usuários

## Domínios Permitidos

A extensão funciona nos seguintes domínios:
- `https://solutta.zeev.it/*`
- `https://portal-zeev.azurewebsites.net/*`

## Permissões Utilizadas

- **storage**: Para salvar configurações localmente
- **activeTab**: Para interagir com a aba ativa
- **scripting**: Para executar scripts de preenchimento de formulário

## Solução de Problemas

### A extensão não aparece
- Verifique se o modo de desenvolvedor está ativado
- Certifique-se de que todos os arquivos estão na pasta
- Recarregue a extensão clicando no ícone de atualização na página de extensões

### Formulário não é preenchido
- Verifique se você está em uma página do Zeev (`solutta.zeev.it`)
- Certifique-se de que há dados salvos (use "Carregar da Página" primeiro)
- Verifique o console do navegador (F12) para mensagens de erro

### Botão "Exportar JSON" está desabilitado
- Este botão só fica habilitado após você salvar dados usando "Carregar da Página" ou "Importar JSON"

### Busca de informações não funciona
- Verifique se os dados (número do processo e verificador) estão corretos
- Verifique sua conexão com a internet
- Certifique-se de que o portal Zeev está acessível

## Desenvolvimento

Esta extensão foi desenvolvida usando:
- Manifest V3
- Chrome Extension APIs
- JavaScript vanilla (sem frameworks)

## Suporte

Para reportar bugs ou sugerir melhorias, entre em contato com o desenvolvedor.

## Licença

Este projeto é de uso interno. Todos os direitos reservados.
