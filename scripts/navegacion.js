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

        // Actualiza la clase activa
        document.querySelectorAll('.nav-link').forEach(navLink => {
          navLink.classList.remove('active');
        });
        this.classList.add('active');
      });
    });

    // Activa la página inicial al cargar
    document.addEventListener('DOMContentLoaded', function () {
      document.getElementById('cuadro').style.display = 'block';
      document.querySelector('[data-target="cuadro"]').classList.add('active');
    });