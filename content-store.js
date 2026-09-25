<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Publish Content - Imago Dei</title>
<link rel="stylesheet" href="style.css">
<link rel="stylesheet" href="mobile-nav.css">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script><script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js"></script><script src="firebase-config.js"></script>
<script src="nav.js" defer></script>
</head>
<body>
<header><div class="container nav-container"><a href="index.html" class="logo">Imago Dei <span>Prophetic Outreach</span></a><nav aria-label="Main navigation"><a href="index.html">Home</a><a href="videos.html">Videos</a><a href="blogs.html">Messages</a><a href="gallery.html">Images</a><a href="admin.html" class="active">Publish</a><a href="about.html">About Us</a></nav></div></header>
<section class="hero page-hero"><div class="container"><h1>Publish Ministry Content</h1><p>Share prayer videos, photos, and messages with your community.</p></div></section>
<main class="content-section"><div class="container admin-page">
<div id="admin-status" class="form-status" role="status" aria-live="polite"></div>
<div class="notice warning"><strong>Current mode:</strong> <span id="mode">Checking setup...</span></div>
<div class="admin-grid">
<section class="card card-body"><h2>Upload a video</h2><p class="helper-text">MP4, WebM, or OGG. Keep files under 20 MB.</p><form id="video-form"><label for="video-title">Video title</label><input id="video-title" type="text" required><label for="video-description">Short description</label><textarea id="video-description" rows="3"></textarea><label for="video-file">Choose video</label><input id="video-file" type="file" accept="video/*" required><button type="submit">Publish video</button></form></section>
<section class="card card-body"><h2>Upload a picture</h2><p class="helper-text">JPG, PNG, GIF, or WebP. Keep files under 2 MB.</p><form id="image-form"><label for="image-title">Picture title</label><input id="image-title" type="text" required><label for="image-file">Choose image</label><input id="image-file" type="file" accept="image/*" required><button type="submit">Publish image</button></form></section>
<section class="card card-body"><h2>Post a message</h2><p class="helper-text">Share an encouragement, announcement, or prayer point.</p><form id="message-form"><label for="message-title">Message title</label><input id="message-title" type="text" required><label for="message-body">Message</label><textarea id="message-body" rows="6" required></textarea><button type="submit">Publish message</button></form></section>
</div></div></main>
<footer><div class="container"><p>&copy; Imago Dei Prophetic Outreach. All rights reserved.</p><p class="footer-sub">Reflecting the glory of God to the world</p></div></footer>
<script>
const status = message => document.getElementById('admin-status').textContent = message;
const configured = !!window.firebaseConfig && !!window.firebaseConfig.projectId && !window.firebaseConfig.projectId.includes('YOUR_PROJECT');
let db = null, storage = null;
if (configured) { firebase.initializeApp(window.firebaseConfig); db = firebase.firestore(); storage = firebase.storage(); document.getElementById('mode').textContent = 'Firebase shared mode.'; }
else { document.getElementById('mode').textContent = 'Local browser mode. Add Firebase values to enable shared publishing.'; }
const key = type => `imago-dei-${type}`;
const read = type => JSON.parse(localStorage.getItem(key(type)) || '[]');
const write = (type, value) => localStorage.setItem(key(type), JSON.stringify(value));
const readAll = () => JSON.parse(localStorage.getItem('imago-dei-content') || '[]');
const writeAll = value => localStorage.setItem('imago-dei-content', JSON.stringify(value));
const date = () => new Date().toLocaleDateString();
const dataUrl = file => new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(file); });
async function upload(file, folder) { const ref = storage.ref(`${folder}/${Date.now()}-${file.name}`); const snap = await ref.put(file); return snap.ref.getDownloadURL(); }
async function publish(type, item, file, folder) {
  const itemWithType = { ...item, type, createdAt: Date.now(), date: item.date || date() };
  if (!configured) {
    if (file) itemWithType.src = await dataUrl(file);
    const values = readAll();
    values.unshift(itemWithType);
    writeAll(values);
    return;
  }
  if (file) itemWithType.url = await upload(file, folder);
  await db.collection('content').add({ ...itemWithType, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
}
function busy(form, value) { form.querySelector('button').disabled = value; }
document.getElementById('video-form').addEventListener('submit', async e => { e.preventDefault(); const f=e.target, file=document.getElementById('video-file').files[0]; if(!file)return; busy(f,true); try { await publish('video',{title:document.getElementById('video-title').value, description:document.getElementById('video-description').value, url: '', date: date()}, file,'videos'); status('Video published.'); f.reset(); } catch (error) { status('Publish failed: ' + error.message); } finally { busy(f,false); } });
document.getElementById('image-form').addEventListener('submit', async e => { e.preventDefault(); const f=e.target, file=document.getElementById('image-file').files[0]; if(!file)return; busy(f,true); try { await publish('image',{title:document.getElementById('image-title').value, date:date()}, file,'images'); status('Image published.'); f.reset(); } catch (error) { status('Publish failed: ' + error.message); } finally { busy(f,false); } });
document.getElementById('message-form').addEventListener('submit', async e => { e.preventDefault(); const f=e.target; busy(f,true); try { await publish('message',{title:document.getElementById('message-title').value, body:document.getElementById('message-body').value, date:date()}, null,'messages'); status('Message published.'); f.reset(); } catch (error) { status('Publish failed: ' + error.message); } finally { busy(f,false); } });
</script></body></html>
