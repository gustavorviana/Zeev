// Sistema de Verificação de Atualizações
class UpdateChecker {
  constructor() {
    this.githubRepo = 'gustavorviana/Zeev';
    this.githubBranch = 'master';
    this.manifestUrl = `https://raw.githubusercontent.com/${this.githubRepo}/${this.githubBranch}/manifest.json`;
    this.repoUrl = `https://github.com/${this.githubRepo}`;
    this.checkIntervalMinutes = 30; // Verificar atualizações a cada 30 minutos
  }

  /**
   * Compara duas versões no formato "x.y.z" ou "x.y"
   * @param {string} version1 - Versão atual
   * @param {string} version2 - Versão remota
   * @returns {number} -1 se version1 < version2, 0 se igual, 1 se version1 > version2
   * @example
   * compareVersions("1.0", "1.1") => -1 (atualização disponível)
   * compareVersions("1.0", "1.0") => 0 (mesma versão)
   * compareVersions("1.1", "1.0") => 1 (versão local mais nova)
   */
  compareVersions(version1, version2) {
    // Converter para string e remover espaços
    const v1Str = String(version1).trim();
    const v2Str = String(version2).trim();

    const v1Parts = v1Str.split('.').map(Number);
    const v2Parts = v2Str.split('.').map(Number);

    const maxLength = Math.max(v1Parts.length, v2Parts.length);

    for (let i = 0; i < maxLength; i++) {
      const v1 = v1Parts[i] || 0;
      const v2 = v2Parts[i] || 0;

      if (v1 < v2) return -1;
      if (v1 > v2) return 1;
    }

    return 0;
  }

  /**
   * Obtém a versão atual da extensão do manifest
   * @returns {Promise<string>} Versão atual
   */
  async getCurrentVersion() {
    const manifestData = chrome.runtime.getManifest();
    return manifestData.version;
  }

  /**
   * Busca a versão mais recente do GitHub
   * @returns {Promise<string|null>} Versão remota ou null se houver erro
   */
  async getRemoteVersion() {
    try {
      const response = await fetch(this.manifestUrl, {
        cache: 'no-cache',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Erro ao buscar manifest remoto:', response.status);
        return null;
      }

      const data = await response.json();
      return data.version;
    } catch (error) {
      console.error('Erro ao verificar atualizações:', error);
      return null;
    }
  }

  /**
   * Verifica se há atualizações disponíveis
   * @returns {Promise<Object>} {hasUpdate: boolean, currentVersion: string, remoteVersion: string}
   */
  async checkForUpdates() {
    try {
      const currentVersion = await this.getCurrentVersion();
      const remoteVersion = await this.getRemoteVersion();

      if (!remoteVersion) {
        return {
          hasUpdate: false,
          currentVersion,
          remoteVersion: null,
          error: 'Não foi possível verificar atualizações'
        };
      }

      const comparison = this.compareVersions(currentVersion, remoteVersion);

      return {
        hasUpdate: comparison < 0,
        currentVersion,
        remoteVersion,
        repoUrl: this.repoUrl
      };
    } catch (error) {
      console.error('Erro na verificação de atualizações:', error);
      return {
        hasUpdate: false,
        currentVersion: await this.getCurrentVersion(),
        remoteVersion: null,
        error: error.message
      };
    }
  }

  /**
   * Verifica se deve realizar uma nova verificação baseado no intervalo configurado
   * @returns {Promise<boolean>} true se deve verificar, false caso contrário
   */
  async shouldCheck() {
    const result = await chrome.storage.local.get(['lastUpdateCheck']);
    const lastCheck = result.lastUpdateCheck || 0;
    const now = Date.now();
    const intervalMs = this.checkIntervalMinutes * 60 * 1000;

    return (now - lastCheck) > intervalMs;
  }

  /**
   * Salva a data/hora da última verificação
   */
  async saveLastCheck() {
    await chrome.storage.local.set({
      lastUpdateCheck: Date.now()
    });
  }

  /**
   * Salva informações sobre a atualização disponível
   * @param {Object} updateInfo - Informações da atualização
   */
  async saveUpdateInfo(updateInfo) {
    await chrome.storage.local.set({
      updateAvailable: updateInfo
    });
  }

  /**
   * Obtém informações sobre atualização salva
   * @returns {Promise<Object|null>} Informações da atualização ou null
   */
  async getUpdateInfo() {
    const result = await chrome.storage.local.get(['updateAvailable']);
    return result.updateAvailable || null;
  }

  /**
   * Limpa informações de atualização salvas
   */
  async clearUpdateInfo() {
    await chrome.storage.local.remove(['updateAvailable']);
  }

  /**
   * Verifica atualizações e salva o resultado
   * @param {boolean} force - Força a verificação mesmo que não tenha passado o intervalo
   * @returns {Promise<Object>} Resultado da verificação
   */
  async checkAndSave(force = false) {
    // Se não for forçado e ainda está no cache, retorna a última informação
    if (!force && !(await this.shouldCheck())) {
      const cachedInfo = await this.getUpdateInfo();
      if (cachedInfo) {
        return cachedInfo;
      }
    }

    // Realiza nova verificação
    const updateInfo = await this.checkForUpdates();

    // Salva timestamp da verificação
    await this.saveLastCheck();

    // Salva ou limpa informação de atualização
    if (updateInfo.hasUpdate) {
      await this.saveUpdateInfo(updateInfo);
    } else {
      await this.clearUpdateInfo();
    }

    return updateInfo;
  }
}

// Exportar para uso em outros arquivos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UpdateChecker;
}
