/* Shared publishing, routing, and deletion helpers. */
(function () {
  const configured = Boolean(window.firebaseConfig && window.firebaseConfig.projectId && !window.firebaseConfig.projectId.includes('YOUR_PROJECT'));
  let db = null;
  let storage = null;

  if (configured) {
    if (!firebase.apps.length) firebase.initializeApp(window.firebaseConfig);
    db = firebase.firestore();
    storage = firebase.storage();
  }

  const localKey = 'imago-dei-content';
  const readLocal = () => JSON.parse(localStorage.getItem(localKey) || '[]');
  const writeLocal = items => localStorage.setItem(localKey, JSON.stringify(items));

  // Migrate content saved by the previous local-only implementation.
  if (!localStorage.getItem(localKey)) {
    const migrated = [];
    ['videos', 'images', 'messages', 'message'].forEach(type => {
      const old = JSON.parse(localStorage.getItem(`imago-dei-${type}`) || '[]');
      old.forEach(item => migrated.push({ ...item, type: type === 'videos' ? 'video' : type === 'images' ? 'image' : 'message', id: item.id || `${type}-${Date.now()}-${migrated.length}` }));
    });
    if (migrated.length) writeLocal(migrated);
  }

  function subscribe(type, render) {
    if (db) {
      return db.collection('content').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
        render(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(item => item.type === type));
      });
    }
    render(readLocal().filter(item => item.type === type));
    return () => {};
  }

  async function remove(item) {
    if (!window.confirm(`Delete “${item.title || 'this item'}”? This cannot be undone.`)) return false;
    if (db) {
      await db.collection('content').doc(item.id).delete();
      if (item.storagePath && storage) {
        try { await storage.ref(item.storagePath).delete(); } catch (error) { console.warn('Media file could not be removed:', error); }
      }
    } else {
      writeLocal(readLocal().filter(existing => existing.id !== item.id));
    }
    return true;
  }

  window.ContentStore = { configured, db, storage, subscribe, remove, readLocal, writeLocal };
})();
