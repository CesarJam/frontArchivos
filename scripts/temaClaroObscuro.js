/*!
 * Color mode toggler for Bootstrap's docs (https://getbootstrap.com/)
 * Adaptado para tu proyecto.
 */

(() => {
  'use strict'

  // Función para obtener el tema guardado en el almacenamiento local del navegador
  const getStoredTheme = () => localStorage.getItem('theme')
  // Función para guardar el tema en el almacenamiento local
  const setStoredTheme = theme => localStorage.setItem('theme', theme)

  // Función para determinar qué tema usar: el guardado o el preferido por el sistema operativo
  const getPreferredTheme = () => {
    const storedTheme = getStoredTheme()
    if (storedTheme) {
      return storedTheme // Si el usuario ya eligió uno, lo respetamos.
    }

    // Si es la primera visita, usamos el tema de su sistema operativo.
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  // Función principal que aplica el tema al documento
  const setTheme = theme => {
    if (theme === 'auto') {
        // Si es 'auto', aplicamos el tema según el sistema operativo
        document.documentElement.setAttribute('data-bs-theme', (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
    } else {
        // Si no, aplicamos el tema elegido ('light' o 'dark')
        document.documentElement.setAttribute('data-bs-theme', theme)
    }
  }

  // Al cargar el script, inmediatamente establecemos el tema preferido
  setTheme(getPreferredTheme())

  // Función para mostrar visualmente cuál es el tema activo en el menú desplegable
  const showActiveTheme = (theme) => {
    const themeSwitcher = document.querySelector('#dropdownUser2')
    if (!themeSwitcher) {
      return
    }

    const activeButton = document.querySelector(`[data-bs-theme-value="${theme}"]`)
    
    // Quitamos la clase 'active' de todos los botones
    document.querySelectorAll('[data-bs-theme-value]').forEach(element => {
      element.classList.remove('active')
      element.setAttribute('aria-pressed', 'false')
    })
    
    // Añadimos la clase 'active' solo al botón que corresponde al tema actual
    if (activeButton) {
        activeButton.classList.add('active')
        activeButton.setAttribute('aria-pressed', 'true')
    }
  }

  // Listener para detectar si el usuario cambia el tema de su sistema operativo
  // Esto es para el modo 'Automático'
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const storedTheme = getStoredTheme()
    if (storedTheme !== 'light' && storedTheme !== 'dark') {
      setTheme(getPreferredTheme())
    }
  })

  // Cuando la página se haya cargado completamente, configuramos los listeners
  window.addEventListener('DOMContentLoaded', () => {
    // Mostramos cuál es el tema activo en el selector
    showActiveTheme(getPreferredTheme())

    // Añadimos un 'click' listener a cada botón del selector de tema
    document.querySelectorAll('[data-bs-theme-value]')
      .forEach(toggle => {
        toggle.addEventListener('click', () => {
          const theme = toggle.getAttribute('data-bs-theme-value')
          setStoredTheme(theme) // Guardamos la elección
          setTheme(theme)       // Aplicamos el tema
          showActiveTheme(theme)// Actualizamos la interfaz del botón
        })
      })
  })
})()