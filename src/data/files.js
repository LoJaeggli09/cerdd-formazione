// Helper per salvare file di commento in `public/uploads` quando possibile.
export const saveCommentFile = (file) => {
  return new Promise((resolve) => {
    // Fallback: se siamo in Electron con nodeIntegration possiamo usare fs
    const hasNode = typeof window !== 'undefined' && window.require;
    if (hasNode) {
      try {
        const fs = window.require('fs');
        const path = window.require('path');
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

        const storedName = `${Date.now()}_${file.name}`;
        const outPath = path.join(uploadsDir, storedName);

        const reader = new FileReader();
        reader.onload = () => {
          const arrayBuffer = reader.result;
          const buffer = Buffer.from(arrayBuffer);
          fs.writeFile(outPath, buffer, (err) => {
            if (err) {
              console.error('Errore salvataggio file:', err);
              resolve({ success: false });
            } else {
              // Ritorna URL relativo alla cartella public per poter essere mostrato nell'app
              resolve({ success: true, url: `/uploads/${storedName}`, name: file.name, storedName });
            }
          });
        };
        reader.onerror = (e) => {
          console.error('FileReader error', e);
          resolve({ success: false });
        };
        reader.readAsArrayBuffer(file);
      } catch (e) {
        console.error('Errore durante il salvataggio file con fs', e);
        resolve({ success: false });
      }
    } else {
      // Browser fallback: salva come data URL in memoria (localStorage non raccomandato per grandi file)
      const reader = new FileReader();
      reader.onload = () => {
        resolve({ success: true, url: reader.result, name: file.name });
      };
      reader.onerror = (e) => {
        console.error('FileReader error', e);
        resolve({ success: false });
      };
      reader.readAsDataURL(file);
    }
  });
};

export default saveCommentFile;
