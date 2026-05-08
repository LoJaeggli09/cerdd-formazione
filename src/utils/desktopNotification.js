/**
 * Helper per notifiche push desktop via Electron Notification API.
 * Funziona solo in Electron (window.electronAPI disponibile).
 * In browser dev mode chiama la Web Notifications API come fallback.
 */

/**
 * Mostra una notifica push desktop.
 * @param {string} title
 * @param {string} body
 */
export function showDesktopNotification(title, body) {
  try {
    // Electron (via preload contextBridge)
    if (window.electronAPI?.showNotification) {
      window.electronAPI.showNotification(title, body);
      return;
    }

    // Fallback: Web Notifications API (dev browser)
    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'granted') {
        new Notification(title, { body });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            try { new Notification(title, { body }); } catch { /* ignorato */ }
          }
        }).catch(() => { /* ignorato — permission denied o browser non supportato */ });
      }
    }
  } catch {
    // Notifiche non supportate in questo contesto, ignorato silenziosamente
  }
}
