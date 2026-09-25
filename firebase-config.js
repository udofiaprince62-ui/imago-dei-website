(function () {
  const configPresent = !!window.firebaseConfig && !!window.firebaseConfig.projectId && !String(window.firebaseConfig.projectId).includes('YOUR_PROJECT');
  let db = null;
  let storage = null;
  let auth = null;

  if (configPresent && window.firebase) {
    if (!firebase.apps.length) {
      firebase.initializeApp(window.firebaseConfig);
    }
    db = firebase.firestore();
    storage = firebase.storage ? firebase.storage() : null;
    auth = firebase.auth ? firebase.auth() : null;
  }

  const localKey = 'imago-dei-content';

  const readLocal = () => {
    try {
      return JSON.parse(localStorage.getItem(localKey) || '[]');
    } catch (error) {
      return [];
    }
  };

  const writeLocal = (value) => {
    localStorage.setItem(localKey, JSON.stringify(value));
  };

  const normalise = (item) => {
    if (!item) return item;
    const typeMap = {
      videos: 'video',
      images: 'image',
      messages: 'message',
      video: 'video',
      image: 'image',
      message: 'message'
    };

    const next = { ...item };
    next.type = typeMap[String(item.type || '').toLowerCase()] || item.type || 'message';
    if (!next.createdAt) next.createdAt = Date.now();
    if (!next.date) next.date = new Date().toLocaleDateString();
    return next;
  };

  const seedLocal = () => {
    const existing = readLocal();
    if (existing.length) return existing;

    const demo = [
      {
        id: 'seed-message-1',
        type: 'message',
        title: 'Weekly Encouragement',
        body: 'Let your light shine in every season. God is still at work in your life and in this community.',
        date: 'Today',
        createdAt: Date.now() - 3600000
      },
      {
        id: 'seed-video-1',
        type: 'video',
        title: 'Prayer Night Session',
        description: 'A short prayer and worship moment for the congregation.',
        url: 'https://www.w3schools.com/html/mov_bbb.mp4',
        date: 'Today',
        createdAt: Date.now() - 7200000
      },
      {
        id: 'seed-image-1',
        type: 'image',
        title: 'Ministry Gathering',
        url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
        date: 'Today',
        createdAt: Date.now() - 10800000
      }
    ];

    writeLocal(demo);
    return demo;
  };

  const sortByCreated = (items) =>
    [...items].sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

  const filterByType = (items, expectedType) =>
    sortByCreated(items.map(normalise).filter(item => item.type === expectedType));

  function subscribe(type, render) {
    if (db) {
      return db.collection('content').orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        render(filterByType(items, type));
      });
    }

    const items = filterByType(seedLocal(), type);
    render(items);
    return () => {};
  }

  const dataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  async function publish(type, item, file, folder) {
    const contentType = normalise({ type }).type;

    if (db) {
      const payload = {
        ...item,
        type: contentType,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        date: item.date || new Date().toLocaleDateString()
      };

      if (file && storage) {
        const path = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
        const snapshot = await storage.ref(path).put(file);
        payload.url = await snapshot.ref.getDownloadURL();
        payload.storagePath = path;
      }

      return db.collection('content').add(payload);
    }

    const localItem = {
      ...item,
      type: contentType,
      id: `${contentType}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      createdAt: Date.now(),
      date: item.date || new Date().toLocaleDateString()
    };

    if (file) localItem.src = await dataUrl(file);

    const items = readLocal();
    items.unshift(localItem);
    writeLocal(items);
    return localItem;
  }

  async function save(item) {
    if (db) {
      return db.collection('content').doc(item.id).set(
        { ...item, type: normalise(item).type, updatedAt: firebase.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );
    }

    const items = readLocal().map(existing => existing.id === item.id ? { ...existing, ...item } : existing);
    writeLocal(items);
  }

  async function remove(item) {
    if (!window.confirm(`Delete “${item.title || 'this post'}”? This cannot be undone.`)) return false;

    if (db) {
      await db.collection('content').doc(item.id).delete();
      if (item.storagePath && storage) {
        try {
          await storage.ref(item.storagePath).delete();
        } catch (error) {
          console.warn(error);
        }
      }
    } else {
      const items = readLocal().filter(existing => existing.id !== item.id);
      writeLocal(items);
    }

    return true;
  }

  function isHost() {
    return Boolean(sessionStorage.getItem('imago-dei-host') || (auth && auth.currentUser));
  }

  function hostLogin() {
    if (auth) return Promise.reject(new Error('Use Firebase authentication on the Publish page.'));
    const code = window.prompt('Host access code');
    if (code !== (window.LOCAL_HOST_CODE || 'change-me')) throw new Error('Invalid host access code.');
    sessionStorage.setItem('imago-dei-host', 'true');
    return Promise.resolve(true);
  }

  window.ContentStore = {
    configured: configPresent,
    db,
    storage,
    auth,
    subscribe,
    publish,
    save,
    remove,
    isHost,
    hostLogin,
    readLocal,
    writeLocal,
    normalise,
    seedLocal
  };
})();
