/* Shared content store, routing, publishing, editing, and deletion. */
(function () {
  const configured = Boolean(window.firebaseConfig && window.firebaseConfig.projectId && !window.firebaseConfig.projectId.includes('YOUR_PROJECT'));
  let db = null;
  let storage = null;
  let auth = null;
  if (configured) {
    if (!firebase.apps.length) firebase.initializeApp(window.firebaseConfig);
    db = firebase.firestore();
    storage = firebase.storage ? firebase.storage() : null;
    auth = firebase.auth ? firebase.auth() : null;
  }

  const localKey = 'imago-dei-content';
  const readLocal = () => JSON.parse(localStorage.getItem(localKey) || '[]');
  const writeLocal = value => localStorage.setItem(localKey, JSON.stringify(value));
  const normalise = item => ({ ...item, type: item.type === 'videos' ? 'video' : item.type === 'images' ? 'image' : item.type === 'messages' ? 'message' : item.type });

  if (!localStorage.getItem(localKey)) {
    const migrated = [];
    ['videos', 'images', 'messages', 'message'].forEach(key => {
      JSON.parse(localStorage.getItem(`imago-dei-${key}`) || '[]').forEach(item => migrated.push(normalise({ ...item, id: item.id || `${key}-${Date.now()}-${migrated.length}`, createdAt: item.createdAt || Date.now() })));
    });
    if (migrated.length) writeLocal(migrated);
  }

  function subscribe(type, render) {
    if (db) return db.collection('content').orderBy('createdAt', 'desc').onSnapshot(snapshot => render(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(item => normalise(item).type === type)));
    render(readLocal().map(normalise).filter(item => item.type === type).sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)));
    return () => {};
  }

  const dataUrl = file => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });

  async function publish(type, item, file, folder) {
    const contentType = normalise({ type }).type;
    if (db) {
      const data = { ...item, type: contentType, createdAt: firebase.firestore.FieldValue.serverTimestamp() };
      if (file && storage) {
        const path = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
        const snapshot = await storage.ref(path).put(file);
        data.url = await snapshot.ref.getDownloadURL();
        data.storagePath = path;
      }
      return db.collection('content').add(data);
    }
    const localItem = { ...item, type: contentType, id: `${contentType}-${Date.now()}-${Math.random().toString(36).slice(2)}`, createdAt: Date.now() };
    if (file) localItem.src = await dataUrl(file);
    const items = readLocal();
    items.unshift(localItem);
    writeLocal(items);
    return localItem;
  }

  async function save(item) {
    if (db) return db.collection('content').doc(item.id).set({ ...item, type: normalise(item).type, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
    writeLocal(readLocal().map(existing => existing.id === item.id ? { ...existing, ...item } : existing));
  }

  async function remove(item) {
    if (!window.confirm(`Delete “${item.title || 'this post'}”? This cannot be undone.`)) return false;
    if (db) {
      await db.collection('content').doc(item.id).delete();
      if (item.storagePath && storage) try { await storage.ref(item.storagePath).delete(); } catch (error) { console.warn(error); }
    } else writeLocal(readLocal().filter(existing => existing.id !== item.id));
    return true;
  }

  function isHost() { return Boolean(sessionStorage.getItem('imago-dei-host') || (auth && auth.currentUser)); }
  function hostLogin() {
    if (auth) return Promise.reject(new Error('Use Firebase authentication on the Publish page.'));
    const code = window.prompt('Host access code');
    if (code !== (window.LOCAL_HOST_CODE || 'change-me')) throw new Error('Invalid host access code.');
    sessionStorage.setItem('imago-dei-host', 'true');
    return Promise.resolve(true);
  }
  window.ContentStore = { configured, db, storage, auth, subscribe, publish, save, remove, isHost, hostLogin, readLocal, writeLocal, normalise };
})();
