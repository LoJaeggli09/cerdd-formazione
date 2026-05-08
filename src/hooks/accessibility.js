import { useEffect, useCallback, useState } from 'react';

// Hook per gestire la navigazione da tastiera nei menu
export const useKeyboardNavigation = (isOpen, onClose, onNavigate, menuItems) => {
  const handleKeyDown = useCallback((event) => {
    if (!isOpen) return;

    const target = event.target;
    const isTypingTarget = Boolean(
      target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      )
    );

    if (isTypingTarget && event.key !== 'Escape') {
      return;
    }

    switch (event.key) {
      case 'Escape':
        if (typeof onClose === 'function') {
          onClose();
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        // Navigazione verso il basso nei menu
        break;
      case 'ArrowUp':
        event.preventDefault();
        // Navigazione verso l'alto nei menu
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        // Attivazione dell'elemento selezionato
        break;
      default:
        break;
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Impedisci lo scroll del body quando il menu è aperto
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);
};

// Hook per gestire il focus trap nei modal
export const useFocusTrap = (containerRef, isActive) => {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);

    // Focus sul primo elemento quando il modal si apre
    if (firstElement) {
      firstElement.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [containerRef, isActive]);
};

// Hook per annunciare cambiamenti di stato agli screen reader
export const useAnnounce = () => {
  const announce = useCallback((message, priority = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';

    document.body.appendChild(announcement);
    announcement.textContent = message;

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  return announce;
};

// Hook per gestire il movimento ridotto (prefers-reduced-motion)
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

// Hook per skip link (salta al contenuto principale)
export const useSkipLink = () => {
  const skipToContent = useCallback(() => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.tabIndex = -1;
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return skipToContent;
};

// Hook per gestire font size dinamico
export const useFontResize = () => {
  const [fontSize, setFontSize] = useState(100); // percentuale

  const increaseFontSize = useCallback(() => {
    setFontSize(prev => Math.min(prev + 10, 200)); // max 200%
  }, []);

  const decreaseFontSize = useCallback(() => {
    setFontSize(prev => Math.max(prev - 10, 80)); // min 80%
  }, []);

  const resetFontSize = useCallback(() => {
    setFontSize(100);
  }, []);

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}%`;
  }, [fontSize]);

  return { fontSize, increaseFontSize, decreaseFontSize, resetFontSize };
};

// Hook per controllare contrasto colori
export const useContrastChecker = () => {
  const checkContrast = useCallback((foreground, background) => {
    // Converti hex a RGB
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    // Calcola luminanza relativa
    const getLuminance = (rgb) => {
      const rsRGB = rgb.r / 255;
      const gsRGB = rgb.g / 255;
      const bsRGB = rgb.b / 255;

      const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
      const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
      const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const fgRgb = hexToRgb(foreground);
    const bgRgb = hexToRgb(background);

    if (!fgRgb || !bgRgb) return null;

    const fgLum = getLuminance(fgRgb);
    const bgLum = getLuminance(bgRgb);

    const lighter = Math.max(fgLum, bgLum);
    const darker = Math.min(fgLum, bgLum);

    const contrast = (lighter + 0.05) / (darker + 0.05);

    return {
      ratio: contrast.toFixed(2),
      passesAA: contrast >= 4.5,  // WCAG AA per testo normale
      passesAAA: contrast >= 7,   // WCAG AAA per testo normale
      passesAALarge: contrast >= 3 // WCAG AA per testo grande
    };
  }, []);

  return checkContrast;
};

// Hook per gestire aria-live regions
export const useAriaLive = () => {
  const [announcements, setAnnouncements] = useState([]);

  const addAnnouncement = useCallback((message, priority = 'polite') => {
    const id = Date.now();
    setAnnouncements(prev => [...prev, { id, message, priority }]);

    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }, 5000);
  }, []);

  return { announcements, addAnnouncement };
};
