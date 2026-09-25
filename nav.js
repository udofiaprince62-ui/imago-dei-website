/* Responsive navigation shared by every page. Existing page colours remain unchanged. */
(() => {
  const links = [
    ['Home', 'index.html'],
    ['Videos', 'videos.html'],
    ['Messages', 'blogs.html'],
    ['Images', 'gallery.html'],
    ['Publish', 'admin.html'],
    ['About Us', 'about.html']
  ];

  function buildNavigation() {
    document.querySelectorAll('nav[aria-label="Main navigation"]').forEach(nav => {
      const current = new URL(window.location.href).pathname.split('/').pop() || 'index.html';
      nav.innerHTML = '';

      const selectButton = document.createElement('button');
      selectButton.type = 'button';
      selectButton.className = 'mobile-nav-toggle';
      selectButton.setAttribute('aria-expanded', 'false');
      selectButton.setAttribute('aria-controls', 'mobile-nav-menu');
      selectButton.innerHTML = '<span class="menu-icon" aria-hidden="true">☰</span> Menu';

      const menu = document.createElement('div');
      menu.className = 'mobile-nav-menu';
      menu.id = 'mobile-nav-menu';
      menu.hidden = true;

      links.forEach(([label, href]) => {
        const link = document.createElement('a');
        link.href = href;
        link.textContent = label;
        if (href === current) link.className = 'active';
        menu.appendChild(link);
      });

      const desktopLinks = document.createElement('div');
      desktopLinks.className = 'desktop-nav-links';
      links.forEach(([label, href]) => {
        const link = document.createElement('a');
        link.href = href;
        link.textContent = label;
        if (href === current) link.className = 'active';
        desktopLinks.appendChild(link);
      });

      nav.append(selectButton, menu, desktopLinks);
      selectButton.addEventListener('click', () => {
        menu.hidden = !menu.hidden;
        selectButton.setAttribute('aria-expanded', String(!menu.hidden));
      });
      document.addEventListener('click', event => {
        if (!nav.contains(event.target)) {
          menu.hidden = true;
          selectButton.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildNavigation);
  else buildNavigation();
})();
