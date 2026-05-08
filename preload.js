const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Mostra una notifica push desktop nativa via Electron.
   * @param {string} title  - Titolo della notifica
   * @param {string} body   - Testo del corpo
   */
  showNotification: (title, body) => {
    ipcRenderer.send('show-notification', { title, body });
  },
});
