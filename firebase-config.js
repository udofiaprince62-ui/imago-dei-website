// Firebase configuration for Imago Dei website.
// Replace the placeholder values below with the real values from your Firebase project.
// Keep this file in the website root so pages like blogs.html, videos.html, and gallery.html
// can load it before they initialize Firestore.
window.firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Note:
// - Do not leave "YOUR_PROJECT" or "YOUR_API_KEY" in production.
// - Once you add your real Firebase values, the site will connect to Firestore/Storage.
// - The code checks for placeholder values and will not initialize Firebase until replaced.
