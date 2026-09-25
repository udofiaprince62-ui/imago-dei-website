(function () {
  const config = window.firebaseConfig || {};
  const configured = Boolean(config.projectId && !String(config.projectId).includes('YOUR_PROJECT'));
  let db = null;
  let storage = null;

  if (configured && window.firebase) {
    if (!firebase.apps.length) firebase.initializeApp(config);
    db = firebase.firestore();
    storage = firebase.storage ? firebase.storage() : null;
  }

  const key = 'imago-dei-content';
  const resetKey = 'imago-dei-content-reset-v2';
  if (!localStorage.getItem(resetKey)) {
    [key, 'imago-dei-video', 'imago-dei-videos', 'imago-dei-image', 'imago-dei-images', 'imago-dei-message', 'imago-dei-messages'].forEach(k => localStorage.removeItem(k));
    localStorage.setItem(resetKey, 'done');
  }

  function readLocal() {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch (_) { return []; }
  }
  function writeLocal(items) { localStorage.setItem(key, JSON.stringify(items)); }
  function normalise(item) {
    const value = { ...(item || {}) };
    const types = { videos: 'video', images: 'image', messages: 'message' };
    value.type = types[value.type] || value.type || 'message';
    value.createdAt = value.createdAt || Date.now();
    value.date = value.date || 'Recently published';
    return value;
  }
  function sorted(items) { return items.map(normalise).sort((a, b) => Number(b.createdAt) - Number(a.createdAt)); }

  function subscribe(type, render, onError) {
    if (db) {
      return db.collection('content').orderBy('createdAt', 'desc').onSnapshot(
        snapshot => render(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(item => normalise(item).type === type)),
        error => { console.error(error); render([]); if (onError) onError(error); }
      );
    }
    render(sorted(readLocal().filter(item => normalise(item).type === type)));
    return () => {};
  }

  const dataUrl = file => new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file);
  });

  async function publish(type, item, file, folder) {
    const value = { ...item, type: normalise({ type }).type, date: item.date || new Date().toLocaleDateString() };
    if (db) {
      if (file && storage) {
        const path = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
        const uploaded = await storage.ref(path).put(file);
        value.url = await uploaded.ref.getDownloadURL(); value.storagePath = path;
      }
      return db.collection('content').add({ ...value, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    }
    const local = { ...value, id: `${value.type}-${Date.now()}`, createdAt: Date.now() };
    if (file) local.url = await dataUrl(file);
    writeLocal([local, ...readLocal()]); return local;
  }

  async function remove(item) {
    if (!window.confirm(`Delete “${item.title || 'this post'}”?`)) return false;
    if (db) await db.collection('content').doc(item.id).delete();
    else writeLocal(readLocal().filter(value => value.id !== item.id));
    return true;
  }

  async function removeAll() {
    if (!window.confirm('Delete every published post, video, and image? This cannot be undone.')) return false;
    if (db) {
      const snapshot = await db.collection('content').get();
      const batch = db.batch(); snapshot.docs.forEach(doc => batch.delete(doc.ref)); await batch.commit();
    }
    writeLocal([]);
    return true;
  }

  window.ContentStore = { configured, db, storage, readLocal, writeLocal, normalise, subscribe, publish, remove, removeAll };
})();
