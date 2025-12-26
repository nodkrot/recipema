import { useEffect } from "react";

/**
 * Custom hook for scroll restoration
 * Saves scroll position to sessionStorage and restores it when component remounts
 *
 * @param {string} storageKey - Unique key for storing scroll position in sessionStorage
 * @param {boolean} isReady - Whether the component is ready to restore scroll (e.g., data loaded)
 * @param {Array} dependencies - Additional dependencies to trigger scroll restoration
 */
export default function useScrollRestoration(storageKey, isReady = true, dependencies = []) {
  // Save scroll position while scrolling
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem(storageKey, window.scrollY.toString());
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [storageKey]);

  // Restore scroll position when component is ready
  useEffect(() => {
    if (isReady) {
      const savedPosition = sessionStorage.getItem(storageKey);

      if (savedPosition) {
        // Small delay to ensure DOM is fully rendered
        const timeoutId = setTimeout(() => {
          window.scrollTo({
            top: parseInt(savedPosition, 10),
            behavior: 'instant'
          });
        }, 0);

        return () => clearTimeout(timeoutId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, isReady, ...dependencies]);
}

