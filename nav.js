(() => {
  const pages = [
    ['Home', 'index.html'],
    ['Videos', 'videos.html'],
    ['Messages', 'blogs.html'],
    ['Images', 'gallery.html'],
    ['Publish', 'admin.html'],
    ['About Us', 'about.html']
  ];

  function init() {
    document.querySelectorAll('nav[aria-label="Main navigation"]').forEach(nav => {
      const current = location.pathname.split('/').pop() || 'index.html';
      nav.innerHTML = '';

      const toggle = document.createElement('button');
      toggle.className = 'android-menu-toggle';
      toggle.type = 'button';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-controls', 'android-menu');
      toggle.innerHTML = '<span aria-hidden="true">☰</span> Menu';

      const menu = document.createElement('div');
      menu.className = 'android-menu';
      menu.id = 'android-menu';
      menu.hidden = true;

      pages.forEach(([label, href]) => {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = label;
        if (href === current) a.className = 'active';
        menu.append(a);
      });

      nav.append(toggle, menu);

      toggle.addEventListener('click', (event) => {
        event.stopPropagation();
        menu.hidden = !menu.hidden;
        toggle.setAttribute('aria-expanded', String(!menu.hidden));
      });

      document.addEventListener('click', (event) => {
        if (!nav.contains(event.target)) {
          menu.hidden = true;
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
