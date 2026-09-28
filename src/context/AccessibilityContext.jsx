import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AccessibilityContext = createContext(null);
const SIZES = [14, 16, 18, 20];

/** Accessibility toolbar state (PUB-01 header, LOC-05): text size and high contrast. */
export function AccessibilityProvider({ children }) {
  const [sizeIdx, setSizeIdx] = useState(1);
  const [contrast, setContrast] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty('--base-font-size', `${SIZES[sizeIdx]}px`);
  }, [sizeIdx]);
  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', contrast);
  }, [contrast]);

  const value = useMemo(() => ({
    sizeIdx,
    increase: () => setSizeIdx((i) => Math.min(SIZES.length - 1, i + 1)),
    decrease: () => setSizeIdx((i) => Math.max(0, i - 1)),
    reset: () => setSizeIdx(1),
    contrast,
    toggleContrast: () => setContrast((c) => !c),
  }), [sizeIdx, contrast]);

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export const useAccessibility = () => useContext(AccessibilityContext);
