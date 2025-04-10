// Calendario
document.addEventListener('DOMContentLoaded', function () {
    const fechaInput = document.getElementById('fechaInput');

    const flatpickrInstance = flatpickr(fechaInput, {
      enableTime: false,
      dateFormat: "Y-m-d",
      locale: "es",
      onChange: function (selectedDates) {
        const formattedDate = flatpickr.formatDate(selectedDates[0], "d/m/Y");
        document.getElementById('fechaDisplay').textContent = formattedDate;
      }
    });

    window.mostrarCalendario = function () {
      flatpickrInstance.open();
    };
  });