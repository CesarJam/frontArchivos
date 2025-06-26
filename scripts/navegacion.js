// Este es el bloque de código que debes reemplazar en tu archivo
document.querySelectorAll('[data-target]').forEach(link => {
  link.addEventListener('click', function (e) {
    e.preventDefault();
    const targetPage = this.dataset.target;

    // Oculta todas las páginas
    document.querySelectorAll('.page').forEach(page => {
      page.style.display = 'none';
    });

    // Muestra la página seleccionada
    const activePage = document.getElementById(targetPage);
    if (activePage) {
      activePage.style.display = 'block';
    }

    // --- INICIO DE LA SOLUCIÓN ---
    // Si la página que se acaba de mostrar es la de 'inventario',
    // reseteamos sus pestañas a la primera para evitar el encimado.
    if (targetPage === 'inventario') {
      const firstTabTriggerEl = document.querySelector('#tab1-tab');
      if (firstTabTriggerEl) {
        const tab = new bootstrap.Tab(firstTabTriggerEl);
        tab.show();
      }
    }
    // --- FIN DE LA SOLUCIÓN ---

    // Actualiza la clase activa en el menú de navegación
    document.querySelectorAll('#sidebarMenu .nav-link').forEach(navLink => {
      navLink.classList.remove('active');
    });
    this.classList.add('active');
  });
});

// El resto de tu código (los listeners para 'DOMContentLoaded') puede permanecer exactamente igual.

    // Activa la página inicial al cargar
    document.addEventListener('DOMContentLoaded', function () {
      document.getElementById('cuadro').style.display = 'block';
      document.querySelector('[data-target="cuadro"]').classList.add('active');
    });

    
  document.addEventListener('DOMContentLoaded', function () {
    // Selecciona todos los enlaces dentro del sidebar colapsable
    const menuLinks = document.querySelectorAll('#sidebarMenu .nav-link');

    menuLinks.forEach(link => {
      link.addEventListener('click', () => {
        const sidebar = document.querySelector('#sidebarMenu');
        const bsCollapse = bootstrap.Collapse.getInstance(sidebar);
        if (bsCollapse) {
          bsCollapse.hide(); // Oculta el menú
        }
      });
    });
  });

  

