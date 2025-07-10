$(document).ready(function () {
  $('#dependenciaModalInventario').selectpicker(); // Inicializa Bootstrap Select
  cargarSelectDependenciasModalInventario(); // Luego carga datos
});
async function cargarSelectDependenciasModalInventario() {
  try {
    console.log("Función (cargarSelectDependenciasModalInventario() OK)");
    const response = await fetch("https://api-nijc7glupa-uc.a.run.app/dependencias/dependencias");
    const data = await response.json();

    //console.log("Dependencias recibidas desde manejo:", data);

    if (Array.isArray(data) && data.length > 0) {
      const $select = $('#dependenciaModalInventario');
      $select.empty().append('<option value="">Seleccione una dependencia</option>');

      data.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
      data.forEach(dep => {
        const nombre = dep.nombre || "No disponible";
        $select.append(`<option value="${nombre}" data-tokens="${nombre}">${nombre}</option>`);
      });

      $select.selectpicker('refresh');
    } else {
      throw new Error("No se encontraron dependencias.");
    }
  } catch (error) {
    console.error("Error al cargar datos:", error);
    const $select = $('#dependenciaModalInventario');
    $select.empty().append('<option value="">Error al cargar datos</option>');
    $select.selectpicker('refresh');
  }
}