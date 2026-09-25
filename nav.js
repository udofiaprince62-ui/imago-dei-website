(() => {
  const pages = [
    ['Home', 'index.html'], ['Videos', 'videos.html'], ['Messages', 'blogs.html'],
    ['Images', 'gallery.html'], ['Publish', 'admin.html'], ['About Us', 'about.html']
  ];

  function init() {
    document.querySelectorAll('nav[aria-label="Main navigation"]').forEach(nav => {
      const current = location.pathname.split('/').pop() || 'index.html';
      nav.innerHTML = '';

      const menu = document.createElement('div');
      menu.className = 'android-menu';
      menu.id = 'android-menu';
      menu.hidden = false;

      pages.forEach(([label, href]) => {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = label;
        if (href === current) a.className = 'active';
        menu.append(a);
      });

      nav.appendChild(menu);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
