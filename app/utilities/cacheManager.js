/**
 * Cache Manager Utility
 * Provides functions to interact with the Service Worker cache
 * Works with vite-plugin-pwa and Workbox-generated caches
 */

/**
 * Clear all caches managed by the service worker
 * @returns {Promise<boolean>} Success status
 */
export async function clearAllCaches() {
  if ("caches" in window) {
    try {
      const cacheNames = await caches.keys();
      console.log("Found caches:", cacheNames);

      // Delete all caches
      await Promise.all(
        cacheNames.map((cacheName) => {
          console.log("Deleting cache:", cacheName);
          return caches.delete(cacheName);
        })
      );

      console.log("All caches cleared successfully");

      // Unregister service worker to force re-registration on reload
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((reg) => reg.unregister()));
        console.log("Service worker unregistered");
      }

      return true;
    } catch (error) {
      console.error("Failed to clear caches:", error);
      return false;
    }
  } else {
    console.warn("Cache API not available");
    return false;
  }
}

/**
 * Get cache storage usage information
 * @returns {Promise<Object>} Storage estimate
 */
export async function getCacheInfo() {
  if ("storage" in navigator && "estimate" in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage,
      quota: estimate.quota,
      usageInMB: (estimate.usage / (1024 * 1024)).toFixed(2),
      quotaInMB: (estimate.quota / (1024 * 1024)).toFixed(2),
      percentUsed: ((estimate.usage / estimate.quota) * 100).toFixed(2)
    };
  }
  return null;
}

/**
 * Check if service worker is active
 * @returns {boolean}
 */
export function isServiceWorkerActive() {
  return "serviceWorker" in navigator && navigator.serviceWorker.controller !== null;
}

/**
 * Preload images for better caching
 * @param {Array<string>} imageUrls - Array of image URLs to preload
 * @returns {Promise<Array>} Array of results
 */
export async function preloadImages(imageUrls) {
  const promises = imageUrls.map(
    (url) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ url, success: true });
        img.onerror = () => resolve({ url, success: false });
        img.src = url;
      })
  );

  return Promise.all(promises);
}

