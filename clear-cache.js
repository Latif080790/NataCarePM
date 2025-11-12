/**
 * Clear Browser Cache and Reload Script
 * 
 * Instructions:
 * 1. Open browser Console (F12)
 * 2. Paste this entire script
 * 3. Press Enter
 * 4. Page will reload with fresh cache
 */

console.log('%c🧹 Clearing Cache...', 'color: #FFA500; font-size: 16px; font-weight: bold');

// Clear localStorage
localStorage.clear();
console.log('✅ localStorage cleared');

// Clear sessionStorage
sessionStorage.clear();
console.log('✅ sessionStorage cleared');

// Clear IndexedDB (Firebase cache)
if (window.indexedDB) {
  const dbs = await window.indexedDB.databases();
  dbs.forEach(db => {
    if (db.name) {
      window.indexedDB.deleteDatabase(db.name);
      console.log(`✅ IndexedDB cleared: ${db.name}`);
    }
  });
}

// Clear Service Workers
if ('serviceWorker' in navigator) {
  const registrations = await navigator.serviceWorker.getRegistrations();
  for (let registration of registrations) {
    await registration.unregister();
    console.log('✅ Service Worker unregistered');
  }
}

// Clear Cache Storage
if ('caches' in window) {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log(`✅ Cache Storage cleared (${cacheNames.length} caches)`);
}

console.log('%c✨ Cache cleared! Reloading...', 'color: #00FF00; font-size: 16px; font-weight: bold');

// Hard reload
setTimeout(() => {
  window.location.reload(true);
}, 1000);
