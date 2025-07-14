// Evento que se ejecuta cuando el DOM está completamente cargado
document.addEventListener("DOMContentLoaded", () => {


    const selectAnio = document.getElementById("selectAnioBusqueda");
    const selectSecciones = document.getElementById("selectSeccionesInventario");
    const anioActual = new Date().getFullYear();
    const anioInicio = 2000;

    // Función para inicializar los select con un placeholder
    const inicializarSelect = (select, placeholder) => {
        select.innerHTML = `<option disabled>-- ${placeholder} --</option>`;
    };

    // Inicializar los select con placeholders
    inicializarSelect(selectAnio, "Selecciona un año");
    inicializarSelect(selectSecciones, "Selecciona una sección");
    //inicializarSelect(selectDependencia, "Selecciona una dependencia");

    // Llenar el select de años y marcar el año actual por defecto
    for (let anio = anioActual; anio >= anioInicio; anio--) {
        let selected = anio === anioActual ? "selected" : "";
        selectAnio.innerHTML += `<option value="${anio}" ${selected}>${anio}</option>`;
    }

    // Función para cargar el inventario

    if (selectAnio) selectAnio.addEventListener('change', actualizarVistasDeInventario);
    if (selectSecciones) selectSecciones.addEventListener('change', actualizarVistasDeInventario);


    //aqui mandamos a limpiar el modal Inventario
    // Obtenemos la referencia a tu modal de Inventario por su ID
    const modalInventarioEl = document.getElementById('modalInventario');

    // Nos aseguramos de que el modal exista en la página
    if (modalInventarioEl) {

        // Escuchamos el evento 'show.bs.modal'
        // La función del listener es ASÍNCRONA para poder usar 'await' adentro
        modalInventarioEl.addEventListener('show.bs.modal', async (event) => {

            // Justo antes de que el modal se muestre, ejecutamos la limpieza y carga de datos.
            //console.log('El modal de Inventario está a punto de abrirse, preparando contenido...');

            // Usamos 'await' para asegurarnos de que toda la preparación (incluida la carga de series)
            // se complete antes de que el modal sea visible.
            await limpiarModalInventario();
        });
    }


    // Asignación de evento para el botón de Agregar Áreas dentro del Modal de Inventario
    const btnAgregarArea = document.getElementById("btnAgregarAreaModalInventario");
    if (btnAgregarArea) { // Buena práctica: comprobar si el botón existe antes de asignarle un evento
        btnAgregarArea.addEventListener("click", agregarElementoAListaAreasTurnadasModalInventario);
    }

    // Asignación de evento para el botón de agregarNuevoMovimiento - Usamos el nuevo ID del botón de guardar del modal
    const btnGuardarMovimiento = document.getElementById('btnGuardarMovimientoModalNuevoMovimiento');
    if (btnGuardarMovimiento) {
        btnGuardarMovimiento.addEventListener('click', guardarNuevoMovimiento);
    }

    // Asignación de evento para el botón de Agregar Dependencias dentro del ModalInventario
    const btnAgregarDependencia = document.getElementById("btnAgregarDependenciasModalInventario");
    if (btnAgregarDependencia) {
        btnAgregarDependencia.addEventListener("click", agregarElementoAListaDependenciaModalInventario);
    }

    //Manejo de toogle de años reserva dentro del Modal Inventario
    // 1. Seleccionamos TODOS los radio buttons del grupo 'condicionesAcceso' por su atributo 'name'.
    const radiosCondiciones = document.querySelectorAll('input[name="condicionesAcceso"]');

    // 2. A cada uno de ellos, le añadimos un listener para el evento 'change'.
    //    Este evento se dispara cuando la selección cambia.

    radiosCondiciones.forEach(radio => {
        radio.addEventListener('change', toggleAniosReserva);
    });


    // 3. Opcional pero recomendado: Llama a la función una vez al cargar la página
    //    para asegurar que el campo tenga el estado inicial correcto.
    toggleAniosReserva();
    // Cargamos las Secciones de la pantalla princial
    //document.addEventListener('DOMContentLoaded', cargarSeccionesInventario);
    cargarSeccionesInventario();


    //Fucionalidad el boton guardarInventarioExpediente
    // Seleccionamos el botón "Guardar" del modal de inventario por su ID.
    const btnGuardarInventario = document.getElementById('guardarBtnModalinventario');

    // Buena práctica: comprobamos si el botón existe antes de añadir el evento.
    if (btnGuardarInventario) {
        // Le asignamos la función 'guardarInventario' al evento 'click'.
        btnGuardarInventario.addEventListener('click', guardarInventario);
    }

    //Funcionalidad el boton modificarInventarioExpediente
    // Seleccionamos el botón "Guardar" del modal de inventario por su ID.
    const btnModificarInventario = document.getElementById('modificarBtnModalInventario');

    // Buena práctica: comprobamos si el botón existe antes de añadir el evento.
    if (btnModificarInventario) {
        // Le asignamos la función 'guardarInventario' al evento 'click'.
        btnModificarInventario.addEventListener('click', modificarInventario);
    }

});
///CARGAR TABLAS
/**
 * Lee los valores actuales de los selectores de año y sección,
 * y luego actualiza las tablas de Inventario y Turnados.
 * Es la función central para refrescar los datos de esta sección.
 */
function actualizarVistasDeInventario() {
    console.log("Iniciando actualización de las vistas de inventario...(actualizarVistasDeInventario()) OK");
    const selectAnio = document.getElementById("selectAnioBusqueda");
    const selectSecciones = document.getElementById("selectSeccionesInventario");

    // Nos aseguramos de que los elementos existan antes de continuar
    if (!selectAnio || !selectSecciones) {
        console.error("No se encontraron los selectores de año o sección.");
        return;
    }

    // Obtenemos los valores en el momento exacto de la ejecución
    const anioSeleccionado = selectAnio.value;
    const seccionSeleccionada = selectSecciones.value;

    // Validamos que se haya seleccionado una opción real y no el placeholder
    if (anioSeleccionado && seccionSeleccionada && !selectAnio.options[selectAnio.selectedIndex].disabled) {
        // Llamamos a las funciones que cargan los datos en las tablas
        cargarTablaInventario(anioSeleccionado, seccionSeleccionada);
        cargarTablaInventarioTurnado(anioSeleccionado, seccionSeleccionada);
    } else {
        console.log("No se ha seleccionado un año o sección válida. No se actualizan las tablas.");
    }
}


/* Pestaña de inventario */
async function cargarTablaInventario(anio, codigoSeccion) {
    console.log("Función (cargarTablaInventario()) OK");
    const tbody = document.getElementById("tabla-inventario");
    const url = `https://api-nijc7glupa-uc.a.run.app/inventario/consultaInventario/anio/${anio}/areaDeRegistro/${codigoSeccion}`;

    tbody.innerHTML = `<tr><td colspan="7" class="text-center">Cargando inventario...</td></tr>`;

    try {
        const response = await fetch(url);

        // --- INICIO DE LA CORRECCIÓN DEFINITIVA ---
        // Verificamos si la respuesta NO fue exitosa (ej. 404, 500).
        if (!response.ok) {
            // Si el código de estado es 404, lo tratamos como un caso especial.
            if (response.status === 404) {
                // Intentamos leer el cuerpo del error para obtener el mensaje JSON.
                const errorData = await response.json();

                // Si el cuerpo del error contiene el campo 'message', lo mostramos.
                if (errorData && errorData.message) {
                    tbody.innerHTML = `<tr><td colspan="7" class="text-center">${errorData.message}</td></tr>`;
                } else {
                    // Si por alguna razón no hay mensaje, mostramos uno genérico.
                    tbody.innerHTML = `<tr><td colspan="7" class="text-center">No se encontraron registros para la consulta.</td></tr>`;
                }
                return; // Salimos de la función, ya que manejamos el caso "no encontrado".
            }

            // Para cualquier otro código de error (500, 403, etc.), lo consideramos un error real.
            throw new Error(`Error de red: ${response.status}`);
        }
        // --- FIN DE LA CORRECCIÓN DEFINITIVA ---

        // Esta parte solo se ejecuta si la respuesta fue exitosa (200 OK).
        const datos = await response.json();
        tbody.innerHTML = "";

        if (!Array.isArray(datos) || datos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center">No hay registros para el año ${anio}</td></tr>`;
            return;
        }

        // El resto de tu lógica para mostrar los datos sigue igual.
        datos.sort((a, b) => {
            const numA = parseInt(a.numeroExpediente.match(/\d+$/)?.[0] || 0);
            const numB = parseInt(b.numeroExpediente.match(/\d+$/)?.[0] || 0);
            return numA - numB;
        });

        const fragmento = document.createDocumentFragment();

        datos.forEach((item) => {
            const historial = item.historialMovimientos ?? [];
            const ultimoMovimiento = historial[historial.length - 1] ?? {};
            const tipoUltimoMovimiento = ultimoMovimiento.tipo ?? "";

            const filaPrincipal = crearFilaPrincipalInventario(item, tipoUltimoMovimiento);
            const filaDetalle = crearFilaDetalleInventario(item, historial);

            filaPrincipal.addEventListener("click", () => {
                const icon = filaPrincipal.querySelector(".toggle-icon-inventario");
                const divExpandible = filaDetalle.querySelector(".contenido-detalle-inventario");
                const estaExpandido = divExpandible.classList.contains("expandido-inventario");

                document.querySelectorAll("#tabla-inventario .contenido-detalle-inventario.expandido-inventario").forEach(div => {
                    div.classList.remove("expandido-inventario");
                    const iconoAsociado = div.closest("tr").previousElementSibling?.querySelector(".toggle-icon-inventario");
                    if (iconoAsociado) iconoAsociado.classList.remove("rotar-inventario");
                });

                if (!estaExpandido) {
                    divExpandible.classList.add("expandido-inventario");
                    icon.classList.add("rotar-inventario");

                    const iframe = filaDetalle.querySelector("iframe");
                    if (iframe && iframe.dataset.src && !iframe.src) {
                        iframe.src = iframe.dataset.src;
                    }
                }
            });

            fragmento.appendChild(filaPrincipal);
            fragmento.appendChild(filaDetalle);
        });

        tbody.appendChild(fragmento);

    } catch (error) {
        console.error("Error al cargar el inventario:", error);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error al cargar el inventario</td></tr>`;
        }
    }
}
function crearFilaPrincipalInventario(item, tipoUltimoMovimiento) {
    console.log("Función (crearFilaPrincipalInventario()) OK");
    const fila = document.createElement("tr");
    let filaClase = "fila-principal-inventario fila-principal";

    if (tipoUltimoMovimiento === "concluido") filaClase += " table-success";
    else if (tipoUltimoMovimiento === "tramite") filaClase += " table-warning";
    fila.className = filaClase;

    // Se eliminaron los 'onclick' de los botones.
    fila.innerHTML = `
        <td data-label="No. Exp.">${item.numeroExpediente}</td>
        <td data-label="Asunto"><span class="toggle-icon-inventario">▶</span> ${item.asunto} -<br> ${item.listaDeDependencias} -<br> (${item.subserie.codigoSubserie} - ${item.subserie.nombreSubserie})</td>
        <td data-label="Status" class="status">${tipoUltimoMovimiento}</td>
        <td data-label="Acción">
            <button class="btn btn-warning btn-sm btn-editar" title="Editar Registro">
                <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-primary btn-sm btn-NuevoMovimiento" title="NuevoMovimiento">
                <i class="bi bi-plus-lg"></i>
            </button>
            <button class="btn btn-danger btn-sm btn-eliminar" title="Eliminar Registro">
                <i class="bi bi-trash"></i>
            </button>
        </td>
    `;

    // --- MEJORA: Manejo de eventos con addEventListener ---
    const btnEditar = fila.querySelector(".btn-editar");
    const btnNuevoMovimiento = fila.querySelector(".btn-NuevoMovimiento");
    const btnEliminar = fila.querySelector(".btn-eliminar");

    // Guardar datos en los atributos data-* del botón
    btnEditar.dataset.id = item.id;
    btnEliminar.dataset.id = item.id;
    btnEliminar.dataset.expediente = item.numeroExpediente;
    btnEliminar.dataset.asunto = item.asunto;

    // Asignar el evento de click para editar
    btnEditar.addEventListener('click', (e) => {
        e.stopPropagation(); // Evita que se active el click de la fila
        //editarRegistroInventario(e.currentTarget.dataset.id);
        prepararModalParaEditar(item.id);

    });

    // Asignar el evento de click para nuevo movimiento
    btnNuevoMovimiento.addEventListener('click', (e) => {
        e.stopPropagation(); // Evita que se active el click de la fila
        //editarRegistroInventario(e.currentTarget.dataset.id);
        prepararModalParaMovimiento(item.id);

    });

    // Asignar el evento de click para eliminar
    btnEliminar.addEventListener('click', (e) => {
        e.stopPropagation(); // Evita que se active el click de la fila
        const data = e.currentTarget.dataset;
        eliminarRegistroInventario(data.id, data.expediente, data.asunto);
    });

    return fila;
}

function crearFilaDetalleInventario(item, historial) {
    console.log("Función (crearFilaDetalleInventario()) OK");
    const fila = document.createElement("tr");
    fila.className = 'fila-detalle-inventario fila-detalle';

    const contenido = document.createElement("td");
    contenido.colSpan = 6; // El colspan se mantiene para la estructura de la tabla principal

    const divExpandible = document.createElement("div");
    // La clase para la animación se mantiene, el JS la controla
    divExpandible.classList.add("contenido-detalle-inventario");

    // --- INICIO DE LA REFACTORIZACIÓN DEL HTML ---

    // 1. Preparamos la tabla de Historial (que SÍ es una tabla de datos)
    // Le añadimos los data-label para hacerla responsiva
    const filasHistorial = historial.map((mov, i) => `
        <tr>
            <td data-label="Etapa">${mov.tipo ?? ""}</td>
            <td data-label="Fecha">${mov.fecha ?? ""}</td>
            <td data-label="Hora">${mov.hora ?? ""}</td>
            <td data-label="Área / Usuario">${i === 0 ? mov.areaOrigen : mov.areaCanalizado} / ${mov.usuario ?? ""}</td>
            <td data-label="Obs">${mov.observaciones ?? ""}</td>
        </tr>
    `).join("");

    const areaDestino = item.historialMovimientos?.[0]?.areaDestino ?? [];
    const filasAreasCanalizadas = areaDestino.length > 0 ? `
        <div class="mt-3">
            <h6 class="fw-bold">Áreas Destino</h6>
            <p>${areaDestino.map(a => `(${a})`).join(" - ")}</p>
        </div>
    ` : '';


    // 2. Construimos el nuevo HTML sin usar una tabla para el layout general
    divExpandible.innerHTML = `
        <div class="p-3 border rounded">
            <h5 class="mb-3">Detalles del expediente</h5>

            <div class="row g-3 mb-3">
                <div class="col-md-3">
                    <strong>Fojas:</strong>
                    <p class="mb-0">${item.datosGenerales.numeroFojas ?? "N/D"}</p>
                </div>
                <div class="col-md-3">
                    <strong>Soporte:</strong>
                    <p class="mb-0">${item.datosGenerales.soporteDocumental ?? "N/D"}</p>
                </div>
                <div class="col-md-3">
                    <strong>Acceso:</strong>
                    <p class="mb-0">${item.datosGenerales.condicionesAcceso ?? "N/D"}</p>
                </div>
                <div class="col-md-3">
                    <strong>Años Reserva:</strong>
                    <p class="mb-0">${item.datosGenerales.aniosReserva ?? "N/D"}</p>
                </div>
                <div class="col-md-12">
                    <strong>Tradición Documental:</strong>
                    <p class="mb-0">${item.datosGenerales.tradicionDocumental ?? "N/D"}</p>
                </div>
            </div>

            <div class="mb-3">
                <h6 class="fw-bold">Inmueble</h6>
                <p>${item.datosGenerales.inmueble ?? "N/D"}</p>
            </div>
            <div class="mb-3">
                <h6 class="fw-bold">Ubicación</h6>
                <p><a href="${item.datosGenerales.ubicacion}" target="_blank">${item.datosGenerales.ubicacion}</a></p>
            </div>

            <hr>

            <h6 class="fw-bold">Detalles de la Serie</h6>
            <div class="row g-3 mb-3">
                <div class="col-md-6">
                    <strong>Serie:</strong>
                    <p class="mb-0">${item.subserie.codigoSubserie} - ${item.subserie.nombreSubserie}</p>
                </div>
                <div class="col-md-2">
                    <strong>Valor Doc:</strong>
                    <p class="mb-0">${item.subserie.valorDocumental}</p>
                </div>
                <div class="col-md-2">
                    <strong>Años Trámite:</strong>
                    <p class="mb-0">${item.subserie.aniosTramite}</p>
                </div>
                <div class="col-md-2">
                    <strong>Años Concent.:</strong>
                    <p class="mb-0">${item.subserie.aniosConcentracion}</p>
                </div>
            </div>
            
            ${filasAreasCanalizadas}

            <hr>

            <h6 class="fw-bold">Historial de Estado</h6>
            <div class="table-responsive">
                <table class="table table-sm table-striped table-cadido-responsive">
                    <thead>
                        <tr>
                            <th>Etapa</th>
                            <th>Fecha</th>
                            <th>Hora</th>
                            <th>Área / Usuario</th>
                            <th>Observación</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filasHistorial}
                    </tbody>
                </table>
            </div>

            <hr>
            
            <h6 class="fw-bold">Vista Previa</h6>
            <div class="responsive-iframe">
                <iframe data-src="${item.datosGenerales.ubicacion}" loading="lazy" title="Vista Previa del Expediente"></iframe>
            </div>
        </div>
    `;
    // --- FIN DE LA REFACTORIZACIÓN DEL HTML ---

    contenido.appendChild(divExpandible);
    fila.appendChild(contenido);
    return fila;
}

/* Pestaña de turnados */
async function cargarTablaInventarioTurnado(anio, codigoSeccion) {
    console.log("Función (cargarTablaInventarioTurnado()) OK");
    const tbody = document.getElementById("tabla-inventarioTurnado");
    const url = `https://api-nijc7glupa-uc.a.run.app/inventario/consultaTurnados/anio/${anio}/areaDestino/${codigoSeccion}`;

    tbody.innerHTML = `<tr><td colspan="7" class="text-center">Cargando inventario...</td></tr>`;

    try {
        const response = await fetch(url);

        // --- INICIO DE LA CORRECCIÓN ---
        // Verificamos si la respuesta NO fue exitosa
        if (!response.ok) {
            // Si el status es 404 (No Encontrado), lo tratamos como un caso de "cero registros"
            if (response.status === 404) {
                tbody.innerHTML = `<tr><td colspan="7" class="text-center">No existen registros en el año ${anio} para la sección ${codigoSeccion}.</td></tr>`;
                return; // Salimos de la función, ya que no hay nada más que hacer.
            }
            // Para cualquier otro código de error (500, 401, etc.), lo consideramos un error real.
            throw new Error(`Error de red: ${response.status}`);
        }
        // --- FIN DE LA CORRECCIÓN ---

        const datos = await response.json();
        tbody.innerHTML = "";

        // Esta validación se mantiene por si el API devuelve 200 OK con un arreglo vacío []
        if (!Array.isArray(datos) || datos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center">No hay registros de documentos turnados a ${codigoSeccion} para el año ${anio}</td></tr>`;
            return;
        }

        datos.sort((a, b) => {
            const numA = parseInt(a.numeroExpediente.match(/\d+$/)?.[0] || 0);
            const numB = parseInt(b.numeroExpediente.match(/\d+$/)?.[0] || 0);
            return numA - numB;
        });

        const fragmento = document.createDocumentFragment();

        datos.forEach((item) => {
            const historial = item.historialMovimientos ?? [];
            //const tipoUltimoMovimiento = historial.at(-1)?.tipo ?? "";

            const filaPrincipal = crearFilaPrincipalTurnado(item);
            const filaDetalle = crearFilaDetalleTurnado(item, historial);

            filaPrincipal.addEventListener("click", () => {
                const icon = filaPrincipal.querySelector(".toggle-icon-inventario");
                const divExpandible = filaDetalle.querySelector(".contenido-detalle-inventario");
                const estaExpandido = divExpandible.classList.contains("expandido-inventario");

                document.querySelectorAll("#tabla-inventarioTurnado .contenido-detalle-inventario.expandido-inventario").forEach(div => {
                    div.classList.remove("expandido-inventario");
                    const iconoAsociado = div.closest("tr").previousElementSibling?.querySelector(".toggle-icon-inventario");
                    if (iconoAsociado) iconoAsociado.classList.remove("rotar-inventario");
                });

                if (!estaExpandido) {
                    divExpandible.classList.add("expandido-inventario");
                    icon.classList.add("rotar-inventario");

                    const iframe = filaDetalle.querySelector("iframe");
                    if (iframe && iframe.dataset.src && !iframe.src) {
                        iframe.src = iframe.dataset.src;
                    }
                }
            });

            fragmento.appendChild(filaPrincipal);
            fragmento.appendChild(filaDetalle);
        });

        tbody.appendChild(fragmento);

    } catch (error) {
        console.error("Error al cargar el inventario de documentos turnados:", error);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error al cargar el inventario.</td></tr>`;
        }
    }
}
// Se eliminó el parámetro 'index' que no se utilizaba.
function crearFilaPrincipalTurnado(item) {
    console.log("Función (crearFilaPrincipalTurnado()) OK");
    const fila = document.createElement("tr");
    let filaClase = "fila-principal-inventario"; // Clase unificada para estilos consistentes
    if (item.statusActual === 'concluido') {
        filaClase += " table-success";
    } else if (item.statusActual === 'tramite') {
        filaClase += " table-warning";
    }

    fila.className = filaClase;

    fila.innerHTML = `
        <td data-label="No Expediente">${item.numeroExpediente}</td>
        <td data-label="Asunto"><span class="toggle-icon-inventario">▶</span> ${item.asunto} - ${item.listaDeDependencias} - (${item.subserie.codigoSubserie} - ${item.subserie.nombreSubserie})</td>
        <td data-label="Status">${item.statusActual}</td>
        <td data-label="Acción">
            <button class="btn btn-primary btn-sm btn-anadir-movimiento" title="Añadir nuevo movimiento">
                <i class="bi bi-plus-lg"></i>
            </button>
        </td>

    `;

    // Asignamos el evento al botón que acabamos de crear
    fila.querySelector('.btn-anadir-movimiento').addEventListener('click', (e) => {
        e.stopPropagation(); // Evita que se active el click de la fila
        prepararModalParaMovimiento(item.id);
    });

    return fila;
}

function crearFilaDetalleTurnado(item, historial) {
    console.log("Función (crearFilaDetalleTurnado()) OK");
    const fila = document.createElement("tr");
    fila.classList.add("fila-detalle-inventario");

    const contenido = document.createElement("td");
    contenido.colSpan = 6; // El número de columnas de la fila principal

    const divExpandible = document.createElement("div");
    divExpandible.classList.add("contenido-detalle-inventario");

    const areaDestino = item.historialMovimientos?.[0]?.areaDestino ?? [];
    const filasAreasCanalizadas = `
        <tr class="fw-bold text-center bg-secondary"><td colspan="6">Áreas destino</td></tr>
        <tr><td colspan="6">${areaDestino.map(a => `(${a})`).join(" - ")}</td></tr>
    `;

    const filasHistorial = historial.map((mov, i) => `
        <tr>
            <td>${mov.tipo ?? ""}</td>
            <td>${mov.fecha ?? ""}</td>
            <td>${mov.hora ?? ""}</td>
            <td>${i === 0 ? mov.areaOrigen : mov.areaCanalizado} / ${mov.usuario ?? ""}</td>
            <td colspan="2">${mov.observaciones ?? ""}</td>
        </tr>
    `).join("");

    // --- MEJORA: Carga diferida del iframe ---
    // Se cambia 'src' por 'data-src' para controlar la carga y se añade 'loading="lazy"'.
    divExpandible.innerHTML = `
    <div class="p-3 border rounded">
      <h6 class="mb-3">Detalles del expediente</h6>
      <div class="table-responsive">
        <table class="table table-sm mb-0">
          <tbody>
            <tr>
                <td colspan="6">
                    <div class="responsive-iframe">
                        <iframe data-src="${item.datosGenerales.ubicacion}" loading="lazy" title="Vista Previa del Expediente"></iframe>
                    </div>
                </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    `;

    // Se reensambla el HTML completo para claridad
    const detallesCompletos = `
    <div class="p-3 border rounded">
      <h6 class="mb-3">Detalles del expediente</h6>
      <div class="table-responsive">
        <table class="table table-sm mb-0">
          <tbody>
            <tr class="fw-bold text-center bg-secondary text-white"><td>Fojas</td><td>Soporte</td><td>Acceso</td><td>Reserva</td><td colspan="2">Tradición Documental</td></tr>
            <tr><td>${item.datosGenerales.numeroFojas ?? ""}</td><td>${item.datosGenerales.soporteDocumental ?? ""}</td><td>${item.datosGenerales.condicionesAcceso ?? ""}</td><td>${item.datosGenerales.aniosReserva ?? ""}</td><td colspan="2">${item.datosGenerales.tradicionDocumental ?? ""}</td></tr>
            <tr class="fw-bold text-center bg-light"><td colspan="6">Inmueble</td></tr>
            <tr><td colspan="6">${item.datosGenerales.inmueble ?? ""}</td></tr>
            <tr class="fw-bold"><td colspan="6">Ubicación</td></tr>
            <tr><td colspan="6"><a href="${item.datosGenerales.ubicacion}" target="_blank">${item.datosGenerales.ubicacion}</a></td></tr>
            <tr class="fw-bold text-center bg-light"><td colspan="6">Detalles de la serie</td></tr>
            <tr class="fw-bold text-center bg-light"><td colspan="3">Serie</td><td>Valor Doc.</td><td>Años Trámite</td><td>Años Concentración</td></tr>
            <tr><td colspan="3">${item.subserie.codigoSubserie} - ${item.subserie.nombreSubserie}</td><td>${item.subserie.valorDocumental}</td><td>${item.subserie.aniosTramite}</td><td>${item.subserie.aniosConcentracion}</td></tr>
            ${filasAreasCanalizadas}
            <tr class="fw-bold text-center bg-secondary text-white"><td colspan="6">Historial de Estado</td></tr>
            <tr class="fw-bold text-center"><td>Etapa</td><td>Fecha</td><td>Hora</td><td>Área / Usuario</td><td colspan="2">Observaciones</td></tr>
            ${filasHistorial}
            <tr class="fw-bold text-center bg-light"><td colspan="6">Vista Previa</td></tr>
            <tr><td colspan="6"><div class="responsive-iframe"><iframe data-src="${item.datosGenerales.ubicacion}" loading="lazy" title="Vista Previa del Expediente"></iframe></div></td></tr>
          </tbody>
        </table>
      </div>
    </div>`;

    divExpandible.innerHTML = detallesCompletos;

    contenido.appendChild(divExpandible);
    fila.appendChild(contenido);
    return fila;
}

/**
 * Prepara y muestra el modal para EDITAR un expediente existente.
 * Versión robusta que utiliza el evento 'shown.bs.modal' para garantizar la sincronización.
 */
async function prepararModalParaEditar(expedienteId) {
    console.log("Función (prepararModalParaEditar())");
    const modalEl = document.getElementById('modalInventario');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

    // 1. Creamos un listener que se ejecutará UNA SOLA VEZ, justo cuando el modal se haya mostrado.
    //    Usamos { once: true } para que el listener se elimine automáticamente después de ejecutarse.
    modalEl.addEventListener('shown.bs.modal', async function handler() {
        try {
            // 2. Preparamos el modal (título, botones) ANTES de mostrarlo.
            document.getElementById('modalRegistroInventario').textContent = 'Editar Expediente';
            document.getElementById('guardarBtnModalinventario').classList.add('d-none');
            document.getElementById('modificarBtnModalInventario').classList.remove('d-none');
            // 3. AHORA, con el modal ya visible, obtenemos los datos.
            const response = await fetch(`https://api-nijc7glupa-uc.a.run.app/inventario/inventario/${expedienteId}`);
            if (!response.ok) {
                throw new Error('No se pudo cargar la información del expediente.');
            }
            const data = await response.json();
            //console.log("Datos recibidos, rellenando formulario:", data);
            // 4. Y rellenamos el formulario. Ahora sí funcionará.
            // Usamos el operador '??' para poner un string vacío si el dato es null/undefined.
            document.getElementById('idInventario').value = data.id ?? '';
            document.getElementById('numeroExpedienteModalInventario').value = data.numeroExpediente ?? '';
            document.getElementById('asuntoModalInventario').value = data.asunto ?? '';

            if (data.datosGenerales) {
                document.getElementById('numeroFojasModalInventario').value = data.datosGenerales.numeroFojas ?? '';
                document.getElementById('caracterComunicacionModal').value = data.datosGenerales.caracterComunicacion ?? 'No aplica';
                document.getElementById('inmuebleModalInventario').value = data.datosGenerales.inmueble ?? '';
                document.getElementById('ubicacionModalInventario').value = data.datosGenerales.ubicacion ?? '';

                // Lógica para checkboxes y radios...
                const soportes = data.datosGenerales.soporteDocumental || "";
                document.getElementById('soportePapelModalInventario').checked = soportes.includes('Papel');
                document.getElementById('soporteElectronicoModalInventario').checked = soportes.includes('Electrónico');

                //condiciones de acceso
                // --- Rellenar radio buttons (ej. Condiciones de Acceso) ---
                // Esta es la versión robusta y corregida.
                if (data.datosGenerales.condicionesAcceso) {

                    // 1. Obtenemos TODOS los radio buttons del grupo 'condicionesAcceso'
                    const radios = document.querySelectorAll('input[name="condicionesAcceso"]');

                    // 2. Recorremos cada uno de ellos
                    radios.forEach(radio => {

                        // 3. Comparamos el 'value' de cada radio button con el dato que viene de la base de datos
                        if (radio.value === data.datosGenerales.condicionesAcceso) {

                            // 4. Si coinciden, lo marcamos como seleccionado (checked)
                            radio.checked = true;
                        }
                    });
                }

                toggleAniosReserva();
                document.getElementById('aniosReservaModalInventario').value = data.datosGenerales.aniosReserva ?? '0';
                // 1. LLAMAMOS Y ESPERAMOS a que el selector se llene.
                //await actualizarSelectSeriesSubseriesModalInventario();//ya lo hacemos desde limpiarModal

                // 2. Asignamos el valor guardado.
                const codigoGuardado = data.subserie?.codigoSubserie;
                const selectSubseries = document.getElementById('selectSeriesSubseries');

                if (codigoGuardado) {
                    selectSubseries.value = codigoGuardado;

                    // 3. ¡LA CLAVE! Disparamos manualmente el evento 'change'.
                    //    Esto le dice a tu otro código: "¡Oye, el valor ha cambiado, actualiza los demás campos!".
                    selectSubseries.dispatchEvent(new Event('change'));
                }
            }

            // Rellenar listas dinámicas
            dependenciasSeleccionadas = data.listaDeDependencias?.map(nombre => ({ nombre })) || [];
            actualizarListaDependenciaModalInventario();

            // ... y la lógica para las demás listas ...

            // ==================================================================
            // INICIO: RELLENAR DATOS DEL REGISTRO INICIAL
            // ==================================================================
            // 1. Obtenemos de forma segura el primer objeto del historial
            const primerMovimiento = data.historialMovimientos?.[0];

            // 2. Nos aseguramos de que el historial exista antes de continuar
            if (primerMovimiento) {
                // 3. Rellenamos los campos de texto simples (fecha, hora, observaciones)
                document.getElementById('statusCreadoFechaModalInventario').value = primerMovimiento.fecha ?? '';
                document.getElementById('statusCreadoHoraModalInventario').value = primerMovimiento.hora ?? '';
                document.getElementById('statusCreadoObservacionesModalInventario').value = primerMovimiento.observaciones ?? '';

                // 4. Rellenamos la lista de "Áreas Destino" (la parte más elaborada)
                //console.log(primerMovimiento.areaDestino);
                //listaAreasTurnadasModalInventario.add(primerMovimiento.areaDestino);
                areasSeleccionadas = primerMovimiento.areaDestino.map(codigo => {
                    return { codigo: codigo, nombre: codigo };
                });
                actualizarListaAreasTurnadasModalInventario();//dejarlo Este acttualiza lo que trae la peticion 
            }

        } catch (error) {
            console.error("Error al rellenar el modal para edición:", error);
            alert("No se pudo cargar la información del expediente para editar.");
            modal.hide(); // Ocultamos el modal si hay un error
        }
    }, { once: true });

    // 5. Finalmente, damos la orden de mostrar el modal.
    modal.show();
}

/**
 * Recolecta los datos del modal de edición, los envía al endpoint PATCH
 * para actualizar un expediente existente.
 */
async function modificarInventario() {
    console.log("Función (modificarInventario)");
    // 1. Obtenemos el ID del expediente del campo oculto
    const expedienteId = document.getElementById('idInventario').value;

    if (!expedienteId) {
        alert("Error: No se encontró el ID del expediente a modificar.");
        return;
    }
    console.log(expedienteId);
    // 2. Recolectamos TODOS los datos del formulario (esta lógica es idéntica a la de guardar)
    console.log("Recolectando datos para modificar...");

    // --- Datos de Identificación ---
    const numeroExpediente = document.getElementById('numeroExpedienteModalInventario').value;
    const asunto = document.getElementById('asuntoModalInventario').value;
    console.log(asunto);
    //const areaDeRegistro = document.getElementById('areaCreadoModalInventario').value; // Asumiendo que este campo oculto tiene el área de registro

    // --- Dependencias y Áreas ---
    // (Asumiendo que tus arrays globales 'dependenciasSeleccionadas' y 'areasSeleccionadas' están actualizados por la interacción del usuario en el modal)
    // --- Dependencias (asumiendo que tienes un array 'dependenciasSeleccionadas') ---
    const listaDeDependencias = dependenciasSeleccionadas.map(dep => dep.nombre);

    // --- Metadatos del Expediente ---
    const caracterComunicacion = document.getElementById('caracterComunicacionModal').value;
    const numeroFojas = document.getElementById('numeroFojasModalInventario').value;

    // Lógica para los checkboxes de Soporte
    const soportes = [];
    if (document.getElementById('soportePapelModalInventario').checked) soportes.push('Papel');
    if (document.getElementById('soporteElectronicoModalInventario').checked) soportes.push('Electrónico');
    const soporteDocumental = soportes.join(' y ') || 'No especificado';

    // Lógica para los radio buttons de Tradición
    const tradicionDocumental = document.querySelector('input[name="tradicionDocumental"]:checked').value;

    // Lógica para los radio buttons de Acceso
    const condicionesAcceso = document.querySelector('input[name="condicionesAcceso"]:checked').value;
    const aniosReserva = document.getElementById('aniosReservaModalInventario').value;

    const inmueble = document.getElementById('inmuebleModalInventario').value;
    const ubicacion = document.getElementById('ubicacionModalInventario').value;

    // --- Clasificación Archivística (Subserie) ---
    // Asumimos que al seleccionar una subserie, guardas sus datos en un objeto
    // Por ejemplo: let subserieSeleccionada = { codigo: '...', nombre: '...' };
    const subserie = {
        codigoSubserie: document.getElementById('codigoSerieModalInventario').value,
        nombreSubserie: document.getElementById('nombreSerieModalInventario').value,
        valorDocumental: document.getElementById('valorDocumentalSerieModalInventario').value,
        aniosTramite: document.getElementById('aniosTramiteModalInventario').value,
        aniosConcentracion: document.getElementById('aniosConcentracionModalInventario').value
    };

    // --- Datos del Registro Inicial ---
    // Asumimos que tienes un array 'areasSeleccionadas' para las áreas a turnar
    const areaDestino = areasSeleccionadas.map(area => area.codigo);
    const fecha = document.getElementById('statusCreadoFechaModalInventario').value;
    const hora = document.getElementById('statusCreadoHoraModalInventario').value;
    const observaciones = document.getElementById('statusCreadoObservacionesModalInventario').value;
    const usuario = "usuario.logueado"; // Aquí deberías obtener el usuario real

    // --- Ensamblamos el Objeto JSON para la actualización ---
    // NOTA: Para un PATCH, podrías enviar solo los campos que cambiaron,
    // pero enviar el objeto completo es más simple desde el formulario y también funciona.
    // --- Construimos el Objeto JSON Final para la actualización ---
    const expedienteActualizado = {
        numeroExpediente,
        asunto,
        listaDeDependencias,
        datosGenerales: {
            caracterComunicacion,
            numeroFojas,
            soporteDocumental,
            condicionesAcceso,
            aniosReserva: (condicionesAcceso === "Reservada" || condicionesAcceso === "Confidencial") ? aniosReserva : "0",
            tradicionDocumental,
            inmueble,
            ubicacion
        },
        subserie,
        registro: {
            areaDestino,
            fecha,
            hora,
            observaciones,
            usuario
        }
    };

    console.log("Enviando datos de modificación:", expedienteActualizado);

    // 3. Enviamos los datos a la API con el método PATCH y el ID en la URL
    try {
        const response = await fetch(`https://api-nijc7glupa-uc.a.run.app/inventario/inventario/${expedienteId}`, { // Asegúrate que esta sea la ruta correcta a tu API
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(expedienteActualizado)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al modificar el expediente.');
        }

        //const resultado = await response.json();
        //console.log('Expediente modificado con éxito:', resultado);
        // Mostrar modal de éxito
        new bootstrap.Modal(document.getElementById('successModal')).show();

        // 4. Cerramos el modal y refrescamos la tabla principal
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalInventario'));
        modal.hide();

        actualizarVistasDeInventario(); // La función que creamos para recargar los datos
        //alert('Expediente modificado con éxito.');

    } catch (error) {
        console.error('Fallo al enviar el formulario de modificación:', error);
        alert(`Error: ${error.message}`);
    }
}

/**
 * Estructura del modal de nuevo movimiento
 */

/**
 * Prepara y abre el modal para añadir un nuevo movimiento.
 * @param {string} expedienteId - El ID del expediente a actualizar.
 * @param {string} tipoDeMovimiento - El tipo de movimiento ("tramite" o "concluido").
 */
function prepararModalParaMovimiento(expedienteId, tipoDeMovimiento) {
    console.log("Función (prepararModalParaMovimiento()) OK");
    // Obtenemos el modal de Bootstrap
    const modalEl = document.getElementById('modalNuevoMovimiento');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

    // Limpiamos el formulario
    document.getElementById('formNuevoMovimiento').reset();

    // Configuramos los valores ocultos
    document.getElementById('movimientoExpedienteId').value = expedienteId;

    // Cambiamos el título del modal dinámicamente
    const modalTitle = document.getElementById('modalMovimientoLabel');
    //obtenemos el codigo seccion del selector principal de la página
    const codigoDelArea = document.getElementById('selectSeccionesInventario').value;
    // Usamos el nuevo ID para asignar el valor al input deshabilitado
    document.getElementById('movimientoAreaCanalizadoModalNuevoMovimiento').value = codigoDelArea;

    if (tipoDeMovimiento === 'tramite') {
        modalTitle.textContent = 'Registrar Trámite';
    } else if (tipoDeMovimiento === 'concluido') {
        modalTitle.textContent = 'Concluir Expediente';
    }
    // Mostramos el modal
    modal.show();
}


/**
 * Recolecta los datos del modal de movimiento y los envía a la API,
 * usando los IDs actualizados.
 */
async function guardarNuevoMovimiento() {
    console.log("Función (guardarNuevoMovimiento()) OK");
    // Obtenemos los datos del formulario usando los nuevos IDs
    const expedienteId = document.getElementById('movimientoExpedienteId').value;
    const tipo = document.getElementById('movimientoTipoSelectModalNuevoMovimiento').value;
    const areaCanalizado = document.getElementById('movimientoAreaCanalizadoModalNuevoMovimiento').value;
    const fecha = document.getElementById('movimientoFechaModalNuevoMovimiento').value;
    const hora = document.getElementById('movimientoHoraModalNuevoMovimiento').value;
    const observaciones = document.getElementById('movimientoObservacionesModalNuevoMovimiento').value;
    const usuario = "usuario.logueado"; // Reemplazar con el usuario real

    const nuevoMovimiento = {
        tipo,
        areaCanalizado,
        fecha,
        hora,
        observaciones,
        usuario
    };

    // La lógica de envío a la API (fetch con PATCH) se mantiene igual
    try {
        console.log(nuevoMovimiento);
        const response = await fetch(`https://api-nijc7glupa-uc.a.run.app/inventario/inventarioMovimientos/${expedienteId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevoMovimiento)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al guardar el movimiento.');
        }

        const resultado = await response.json();
        console.log('Movimiento guardado con éxito:', resultado);
        // Mostrar modal de éxito
        new bootstrap.Modal(document.getElementById('successModal')).show();
        // 4. Cerramos el modal y refrescamos la tabla principal
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalNuevoMovimiento'));
        modal.hide();
        actualizarVistasDeInventario();
        //alert('Movimiento registrado con éxito.');
        
    } catch (error) {
        console.error('Fallo al guardar el movimiento:', error);
        alert(`Error: ${error.message}`);
    }
}


// Deshabilitar/habilitar campo de años de reserva
function toggleAniosReserva() {
    console.log("Función (toggleAniosReserva) OK");
    let reservadaSeleccionada = document.getElementById("condicionReservadaModalInventario").checked;

    // ¡CORRECCIÓN! Apuntamos al DIV contenedor, no solo al input.
    let contenedorCampo = document.getElementById("campoAniosReservaModalInventario");

    if (reservadaSeleccionada) {
        // Mostramos el contenedor completo (label + input)
        contenedorCampo.style.display = "block";
        document.getElementById("aniosReservaModalInventario").value = "0"; // Mantenemos tu lógica de resetear a 0
    } else {
        // Ocultamos el contenedor completo
        contenedorCampo.style.display = "none";
        document.getElementById("aniosReservaModalInventario").value = ""; // Mantenemos tu lógica de limpiar el campo
    }
}

// Cargar opciones del dropdown inicial de las Secciones
async function cargarSeccionesInventario() {
    console.log("Función (cargarSeccionesInventario()) OK");
    try {
        const response = await fetch('https://api-nijc7glupa-uc.a.run.app/secciones/cuadroGeneral');
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

        const secciones = await response.json();
        const select = document.getElementById('selectSeccionesInventario');
        const selectModal = document.getElementById('statusCreadoAreaCreadoModalInventario');//carga las secciones en el modal de Inventario

        const placeholder = '<option selected disabled>-- Elige una sección --</option>';
        select.innerHTML = placeholder;
        selectModal.innerHTML = placeholder;

        secciones.forEach(seccion => {
            const option = document.createElement('option');
            option.value = seccion.id;
            option.textContent = seccion.id;
            option.dataset.seccion = seccion.seccion || 'No definido'; // Evita valores `undefined`
            select.appendChild(option);
            selectModal.appendChild(option.cloneNode(true)); //aqui lo duplicamos para usarlo en las areas turnadas
        });

    } catch (error) {
        console.error('Error al cargar secciones:', error);
    }
}

// Carga el nombre de las secciones en la pantalla principal
document.getElementById('selectSeccionesInventario').addEventListener('change', function () {
    const selectedOption = this.options[this.selectedIndex];
    document.getElementById('seccionObtenidaInventario').value = selectedOption.dataset.seccion;
});

/**
 * VERSIÓN DEFINITIVA Y PRECISA
 * Carga las series y subseries, manejando la respuesta específica de la API cuando no hay datos.
 */
async function actualizarSelectSeriesSubseriesModalInventario() {
    console.log("Funcion (actualizarSelectSeriesSubseriesModalInventario()) OK");
    try {
        const selectSecciones = document.getElementById('selectSeccionesInventario');
        const codigoSeccion = selectSecciones.value;
        const selectSeries = document.getElementById('selectSeriesSubseries');
        //
        //console.log("el codigo seleccionado es -->" + codigoSeccion);
        ///
        if (!codigoSeccion) {
            selectSeries.innerHTML = '<option selected disabled>-- Primero selecciona una sección --</option>';
            return;
        }
        const url = `https://api-nijc7glupa-uc.a.run.app/series/series/codigoSeccion/${codigoSeccion}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error HTTP al buscar series: ${response.status}`);
        }
        const apiData = await response.json();
        if (apiData && apiData.message && Array.isArray(apiData.data)) {
            selectSeries.innerHTML = `<option selected disabled>-- ${apiData.message} --</option>`;
            return;
        }
        const series = Array.isArray(apiData) ? apiData : [apiData];
        selectSeries.innerHTML = '<option value="" selected disabled>-- Selecciona una subserie --</option>';
        const datosSeriesSubseries = {}; // Este objeto lo seguiremos usando igual
        // --- INICIO DE LA MODIFICACIÓN CON <optgroup> ---
        series.forEach(serie => {
            if (!serie || !serie.id) return;

            // Creamos el <optgroup> para la serie actual. La etiqueta (label) no es seleccionable.
            const optgroup = document.createElement('optgroup');
            optgroup.label = `📂 ${serie.id} - ${serie.nombre}`;

            // Verificamos si hay subseries para procesar
            if (serie.subseries && Array.isArray(serie.subseries)) {
                serie.subseries.forEach(subserie => {
                    // Guardamos los datos de la subserie para usarlos después
                    datosSeriesSubseries[subserie.id] = {
                        id: subserie.id,
                        nombre: subserie.nombre,
                        valoresDocumentales: subserie.valoresDocumentales ?? "No disponible",
                        aniosTramite: subserie.aniosTramite ?? "No disponible",
                        aniosConcentracion: subserie.aniosConcentracion ?? "No disponible"
                    };

                    // Creamos la <option> para la subserie
                    const optionSubserie = document.createElement('option');
                    optionSubserie.value = subserie.id;
                    optionSubserie.textContent = `📄 ${subserie.id} - ${subserie.nombre}`;

                    // Añadimos la opción de la subserie DENTRO del optgroup
                    optgroup.appendChild(optionSubserie);
                });
            }

            // Finalmente, añadimos el grupo completo (con sus subseries) al select
            selectSeries.appendChild(optgroup);
        });
        // --- FIN DE LA MODIFICACIÓN CON <optgroup> ---

        // El resto de la lógica para el listener 'change' no necesita cambios
        selectSeries.replaceWith(selectSeries.cloneNode(true));
        document.getElementById('selectSeriesSubseries').addEventListener('change', function () {
            const selectedId = this.value;
            const data = datosSeriesSubseries[selectedId];

            if (data) {
                document.getElementById('codigoSerieModalInventario').value = data.id;
                document.getElementById('nombreSerieModalInventario').value = data.nombre;
                document.getElementById('valorDocumentalSerieModalInventario').value = data.valoresDocumentales;
                document.getElementById('aniosTramiteModalInventario').value = data.aniosTramite;
                document.getElementById('aniosConcentracionModalInventario').value = data.aniosConcentracion;
            }
        });

    } catch (error) {
        console.error('Error final en actualizarSelectSeriesSubseriesModalInventario:', error);
        const selectSeries = document.getElementById('selectSeriesSubseries');
        if (selectSeries) {
            selectSeries.innerHTML = '<option selected disabled>-- Error al cargar series --</option>';
        }
    }
}

// 1. Convertimos la función a 'async' para poder usar 'await'.
async function limpiarModalInventario() {
    console.log("Función (limpiarModalInventario()) OK");
    // 2. Mantenemos toda tu lógica original para limpiar y preparar el modal.
    //console.log("Limpiando el modal y restableciendo campos...");
    document.getElementById('formularioInventario').reset();
    obtenerUltimoNumeroExpediente();
    limpiarListaAreasTurnadasModalInventario();
    limpiarListaDependenciaModalInventario();
    //deshabilitarCamposStatus();

    const buttonGuardar = document.getElementById('guardarBtnModalinventario');
    const buttonModificar = document.getElementById('modificarBtnModalInventario');
    buttonGuardar.classList.remove('d-none'); // Mostrar botón de Guardar
    buttonModificar.classList.add('d-none');   // Ocultar botón de modificar

    // 3. Añadimos la llamada asíncrona para cargar las series.
    //    Usamos try...catch para manejar cualquier error durante la carga.
    try {
        //console.log("Iniciando la carga de series y subseries...");
        // Llamamos a la función y esperamos a que termine antes de continuar.
        await actualizarSelectSeriesSubseriesModalInventario();
        //console.log("Las series y subseries se cargaron correctamente.");
    } catch (error) {
        console.error("Falló la carga de datos para el modal:", error);
        // Aquí podrías mostrar una alerta al usuario si algo sale mal.
        // alert("No se pudieron cargar los datos de series. Por favor, intente de nuevo.");
    }
}

// Registra lo que se capturo del modal
// Esta función se ejecuta cuando el usuario hace clic en "Guardar"
async function guardarInventario() {
    console.log("Función (guardarInventario()) OK");
    // Recolectamos los datos del formulario del modal

    // --- Datos de Identificación ---
    const numeroExpediente = document.getElementById('numeroExpedienteModalInventario').value;
    const asunto = document.getElementById('asuntoModalInventario').value;

    // Lo obtenemos del select de Inventario
    const areaDeRegistro = document.getElementById('selectSeccionesInventario').value;

    // --- Dependencias (asumiendo que tienes un array 'dependenciasSeleccionadas') ---
    const listaDeDependencias = dependenciasSeleccionadas.map(dep => dep.nombre);

    // --- Metadatos del Expediente ---
    const caracterComunicacion = document.getElementById('caracterComunicacionModal').value;
    const numeroFojas = document.getElementById('numeroFojasModalInventario').value;

    // Lógica para los checkboxes de Soporte
    const soportes = [];
    if (document.getElementById('soportePapelModalInventario').checked) soportes.push('Papel');
    if (document.getElementById('soporteElectronicoModalInventario').checked) soportes.push('Electrónico');
    const soporteDocumental = soportes.join(' y ') || 'No especificado';

    // Lógica para los radio buttons de Tradición
    const tradicionDocumental = document.querySelector('input[name="tradicionDocumental"]:checked').value;

    // Lógica para los radio buttons de Acceso
    const condicionesAcceso = document.querySelector('input[name="condicionesAcceso"]:checked').value;
    const aniosReserva = document.getElementById('aniosReservaModalInventario').value;

    const inmueble = document.getElementById('inmuebleModalInventario').value;
    const ubicacion = document.getElementById('ubicacionModalInventario').value;

    // --- Clasificación Archivística (Subserie) ---
    // Asumimos que al seleccionar una subserie, guardas sus datos en un objeto
    // Por ejemplo: let subserieSeleccionada = { codigo: '...', nombre: '...' };
    const subserie = {
        codigoSubserie: document.getElementById('codigoSerieModalInventario').value,
        nombreSubserie: document.getElementById('nombreSerieModalInventario').value,
        valorDocumental: document.getElementById('valorDocumentalSerieModalInventario').value,
        aniosTramite: document.getElementById('aniosTramiteModalInventario').value,
        aniosConcentracion: document.getElementById('aniosConcentracionModalInventario').value
    };

    // --- Datos del Registro Inicial ---
    // Asumimos que tienes un array 'areasSeleccionadas' para las áreas a turnar
    const areaDestino = areasSeleccionadas.map(area => area.codigo);
    const fecha = document.getElementById('statusCreadoFechaModalInventario').value;
    const hora = document.getElementById('statusCreadoHoraModalInventario').value;
    const observaciones = document.getElementById('statusCreadoObservacionesModalInventario').value;
    const usuario = "usuario.logueado"; // Aquí deberías obtener el usuario real

    // --- Construimos el Objeto JSON Final ---
    const expedienteParaEnviar = {
        numeroExpediente,
        asunto,
        areaDeRegistro,
        listaDeDependencias,
        datosGenerales: {
            caracterComunicacion,
            numeroFojas,
            soporteDocumental,
            condicionesAcceso,
            aniosReserva: (condicionesAcceso === "Reservada" || condicionesAcceso === "Confidencial") ? aniosReserva : "0",
            tradicionDocumental,
            inmueble,
            ubicacion
        },
        subserie,
        registro: {
            areaDestino,
            fecha,
            hora,
            observaciones,
            usuario
        }
    };
    // --- Enviamos a la API ---
    try {
        //console.log(expedienteParaEnviar);
        const response = await fetch('https://api-nijc7glupa-uc.a.run.app/inventario/inventario', { // Asegúrate de que la ruta sea la correcta
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(expedienteParaEnviar)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al guardar el expediente.');
        }
        const resultado = await response.json();
        //console.log('Expediente guardado con éxito:', resultado);
        // Aquí puedes cerrar el modal y recargar la tabla principal
        // Mostrar modal de éxito
        new bootstrap.Modal(document.getElementById('successModal')).show();
        // Cerrar modal de dependencias
        bootstrap.Modal.getInstance(document.getElementById('modalInventario'))?.hide();
        // Refrescar la tabla!
        actualizarVistasDeInventario();
    } catch (error) {
        console.error('Fallo al enviar el formulario:', error);
        alert(`Error: ${error.message}`);
    }
}

// Se obtiene el ultimo número del expediente para agregarlo al modal
async function obtenerUltimoNumeroExpediente() {
    console.log("Función (obtenerUltimoNumeroExpediente()) OK");
    // Obtener solo las filas principales (ignorando las subtablas colapsables)
    const rows = document.querySelectorAll("#tabla-inventario tr.fila-principal");
    let nuevoNumero;

    if (rows.length > 0) {
        // Obtener la última fila principal
        const lastRow = rows[rows.length - 1];
        // Se asume que la primera celda contiene el número de expediente
        const numeroExpedienteText = lastRow.cells[0].innerText.trim();
        let numeroExpediente = parseInt(numeroExpedienteText, 10);

        if (isNaN(numeroExpediente)) {
            numeroExpediente = 0;
        }

        // Incrementamos el número
        nuevoNumero = numeroExpediente + 1;
        // Formateamos para que tenga 3 dígitos, por ejemplo: "007"
        nuevoNumero = String(nuevoNumero).padStart(3, "0");
    } else {
        // Si no hay registros, iniciamos en "001"
        nuevoNumero = "001";
    }

    // Asignamos el nuevo número al campo del modal
    document.getElementById("numeroExpedienteModalInventario").value = nuevoNumero;
    //mandamos a traer el llenado del select de las areas para ocuparlo en area turnado
    //llenarSelectAreaTurnado();
}

// Función para eliminar un registro del inventario
async function eliminarRegistroInventario(id, numeroExpediente, asunto) {
    console.log("Función eliminarRegistroInventario()");
    if (!id) {
        console.error("Error: ID no proporcionado.");
        return;
    }
    const url = `https://api-nijc7glupa-uc.a.run.app/inventario/inventario/${id}`;
    // Confirmación con SweetAlert2
    const confirmacion = await Swal.fire({
        title: "¿Estás seguro?",
        text: `Eliminarás el registro con expediente: ${numeroExpediente} y asunto ${asunto}`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
    });

    // Si el usuario cancela, no hacer nada
    if (!confirmacion.isConfirmed) return;

    try {
        const response = await fetch(url, { method: "DELETE" });

        if (!response.ok) {
            throw new Error(`Error al eliminar: ${response.statusText}`);
        }
        // Mostrar alerta de éxito
        await Swal.fire({
            title: "Eliminado",
            text: "El registro se eliminó correctamente.",
            icon: "success",
            confirmButtonColor: "#3085d6"
        });
        //Refrescar la tabla!
        actualizarVistasDeInventario();
    } catch (error) {
        console.error("Error al eliminar el registro:", error);
        Swal.fire({
            title: "Error",
            text: "No se pudo eliminar el registro. Intenta de nuevo.",
            icon: "error",
            confirmButtonColor: "#d33"
        });
    }
}

//Las siguientes funciones manejan el listado de areas a las que se turnan en el modal
let areasSeleccionadas = [];
let dependenciasSeleccionadas = [];

function actualizarListaAreasTurnadasModalInventario() {
    console.log("Función (actualizarListaAreasTurnadasModalInventario()) OK");
    const container = document.getElementById("listaAreasTurnadasModalInventario");
    container.innerHTML = ""; // Limpiar antes de actualizar

    // Usamos un DocumentFragment para mejor rendimiento
    const fragmento = document.createDocumentFragment();

    areasSeleccionadas.forEach((area, index) => {
        // Llamamos a nuestra nueva función para crear cada <li>
        const elementoLista = crearElementoListaAreaTurnadasModalInventario(area, index);
        fragmento.appendChild(elementoLista);
    });

    // Añadimos la lista completa al DOM de una sola vez
    container.appendChild(fragmento);
    // También añadimos la clase de Bootstrap para que se vea como una lista
    container.className = "list-group";
}

/**
 * Actualiza la UI de la lista de dependencias usando el método moderno.
 */
function actualizarListaDependenciaModalInventario() {
    console.log("Función (actualizarListaDependenciaModalInventario()) OK");
    const container = document.getElementById("listaDependenciasModalInventario");
    container.innerHTML = ""; // Limpiar antes de actualizar
    // Usamos un DocumentFragment para construir la lista fuera del DOM
    const fragmento = document.createDocumentFragment();
    dependenciasSeleccionadas.forEach((dependencia, index) => {
        // Llamamos a nuestra nueva función constructora para cada elemento
        const elementoLista = crearElementoListaDependenciaModalInventario(dependencia, index);
        fragmento.appendChild(elementoLista);
    });

    // Añadimos la lista completa al DOM de una sola vez
    container.appendChild(fragmento);
    // Y le damos el estilo de lista de Bootstrap
    container.className = "list-group";
}

function eliminarDependenciaListaModalInventario(index) {
    console.log("Función (eliminarDependenciaListaModalInventario()) OK");
    if (index === undefined || index === null) {
        console.error("Error: ID no proporcionado");
        return;
    }
    dependenciasSeleccionadas.splice(index, 1);
    actualizarListaDependenciaModalInventario();
}

function agregarElementoAListaAreasTurnadasModalInventario() {
    console.log("Función (agregarElementoAListaAreasTurnadasModalInventario()) OK");
    let select = document.getElementById("statusCreadoAreaCreadoModalInventario");
    let areaCodigo = select.value;
    let areaNombre = select.options[select.selectedIndex].text;
    if (areaCodigo && !areasSeleccionadas.some(area => area.codigo === areaCodigo)) {
        areasSeleccionadas.push({ codigo: areaCodigo, nombre: areaNombre });
        actualizarListaAreasTurnadasModalInventario();
    }
}

function agregarElementoAListaDependenciaModalInventario() {
    console.log("Función (agregarElementoAListaDependenciaModalInventario()) OK");
    let select = document.getElementById("dependenciaModalInventario");
    let dependencia = select.value;
    let dependenciaTexto = select.options[select.selectedIndex].text;

    // Verifica si el valor no está vacío y si ya existe en la lista
    if (dependencia && !dependenciasSeleccionadas.some(dep => dep.nombre === dependencia)) {
        dependenciasSeleccionadas.push({ nombre: dependenciaTexto });
        actualizarListaDependenciaModalInventario();
    }
}

function eliminarAreaInventario(index) {
    console.log("Función (eliminarAreaInventario) OK");
    // CORRECCIÓN: Apuntamos al array correcto
    areasSeleccionadas.splice(index, 1);

    // Volvemos a dibujar la lista actualizada
    actualizarListaAreasTurnadasModalInventario();
}

/**
 * Crea un elemento <li> para la lista de dependencias seleccionadas.
 * Asigna el evento de clic para el botón de eliminar de forma segura.
 * @param {object} dependencia - El objeto de la dependencia con {nombre}.
 * @param {number} index - El índice de la dependencia en el array.
 * @returns {HTMLLIElement} El elemento <li> construido.
 */
function crearElementoListaDependenciaModalInventario(dependencia, index) {
    console.log("Función (crearElementoListaDependenciaModalInventario()) OK");
    // Creamos el elemento de la lista
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-center";

    // Añadimos el nombre de la dependencia y el botón de eliminar
    li.innerHTML = `
        <span>${dependencia.nombre}</span>
        <button type="button" class="btn btn-danger btn-sm" title="Eliminar Dependencia">
            <i class="bi bi-trash"></i>
        </button>
    `;

    // Asignamos el evento de clic al botón que acabamos de crear
    const btnEliminar = li.querySelector("button");
    btnEliminar.addEventListener("click", () => {
        eliminarDependenciaListaModalInventario(index); // Llama a tu función original
    });

    return li;
}

/**
 * Crea un elemento <li> para la lista de áreas seleccionadas.
 * Asigna el evento de clic para el botón de eliminar.
 * @param {object} area - El objeto del área con {codigo, nombre}.
 * @param {number} index - El índice del área en el array.
 * @returns {HTMLLIElement} El elemento <li> construido.
 */
function crearElementoListaAreaTurnadasModalInventario(area, index) {
    console.log("Función (crearElementoListaAreaTurnadasModalInventario()) OK");
    // Creamos el elemento de la lista
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-center";

    // Añadimos el nombre del área y el botón de eliminar
    li.innerHTML = `
        <span>${area.nombre}</span>
        <button type="button" class="btn btn-danger btn-sm">
            <i class="bi bi-trash"></i>
        </button>
    `;

    // Asignamos el evento de clic al botón que acabamos de crear
    const btnEliminar = li.querySelector("button");
    btnEliminar.addEventListener("click", () => {
        eliminarAreaInventario(index);
    });

    return li;
}

function limpiarListaAreasTurnadasModalInventario() {
    console.log("Función (limpiarListaAreasTurnadasModalInventario()) OK");
    // Limpiar la lista de áreas seleccionadas
    areasSeleccionadas = [];
    actualizarListaAreasTurnadasModalInventario();
    // Restablecer el valor del select
    document.getElementById("statusCreadoAreaCreadoModalInventario").value = "";
}

function limpiarListaDependenciaModalInventario() {
    console.log("Función (limpiarListaDependenciaModalInventario()) OK");
    // Limpiar la lista de áreas seleccionadas
    dependenciasSeleccionadas = [];
    actualizarListaDependenciaModalInventario();
    // Restablecer el valor del select
    //document.getElementById("dependenciaModalInventario").value = "";
}

function deshabilitarCamposStatus() {
    console.log("Función (deshabilitarCamposStatus())");
    document.getElementById("statusTramiteFechaModalInventario").disabled = true;
    document.getElementById("statusTramiteObservacionesModalInventario").disabled = true;
    document.getElementById("statusConcluidoFechaModalInventario").disabled = true;
    document.getElementById("statusConcluidoObservacionesModalInventario").disabled = true;
}

function habilitarCamposStatus() {
    console.log("Función (habilitarCamposStatus())");
    document.getElementById("statusTramiteFechaModalInventario").disabled = false;
    document.getElementById("statusTramiteObservacionesModalInventario").disabled = false;
    document.getElementById("statusConcluidoFechaModalInventario").disabled = false;
    document.getElementById("statusConcluidoObservacionesModalInventario").disabled = false;
}

//filtrar tabla por asunto
document.getElementById("filtroAsunto").addEventListener("keyup", function () {
    let filtro = this.value.toLowerCase();
    let filas = document.querySelectorAll("#tablaInventario tbody tr");

    filas.forEach(fila => {
        let celdaAsunto = fila.querySelector("td:nth-child(2)"); // Ajusta la columna según la posición
        if (celdaAsunto) {
            let texto = celdaAsunto.textContent.toLowerCase();
            let coincide = texto.includes(filtro);

            // Encuentra la fila principal y las filas de detalles (colapsables)
            if (fila.classList.contains("fila-principal-inventario")) {
                fila.style.display = coincide ? "" : "none";

                // Asegurar que la fila de detalles relacionada también se muestre o se oculte
                let filaDetalle = fila.nextElementSibling;
                if (filaDetalle && filaDetalle.classList.contains("fila-detalle-inventario")) {
                    filaDetalle.style.display = coincide ? "" : "none";
                }
            }
        }
    });
});

//filtro de tabla status
document.getElementById("selectStatusInventario").addEventListener("change", function () {
    let filtro = this.value.toLowerCase(); // Obtener el valor seleccionado en minúsculas
    let filas = document.querySelectorAll("#tablaInventario tbody tr");

    filas.forEach(fila => {
        let celdaStatus = fila.querySelector("td.status"); // Asegúrate de agregar la clase "status" a la celda del status en el HTML
        if (celdaStatus) {
            let textoStatus = celdaStatus.textContent.toLowerCase();
            let coincide = filtro === "todos" || textoStatus.includes(filtro);

            fila.style.display = coincide ? "" : "none"; // Mostrar u ocultar según el filtro

            // Asegurar que la fila de detalles relacionada también se oculte/muestre
            let filaDetalle = fila.nextElementSibling;
            if (filaDetalle && filaDetalle.classList.contains("fila-detalle")) {
                filaDetalle.style.display = coincide ? "" : "none";
            }
        }
    });
});

//metodo sub de soporte documental para editar al obtener el get por id
function marcarSoportes(soporteDocumental) {
    console.log("Función (marcarSoportes())");
    if (!soporteDocumental) return;

    // Convertir la cadena en un array separándola por "/"
    const soportes = soporteDocumental.split("/").map(s => s.trim());

    // Marcar los checkboxes según la existencia de valores
    document.getElementById('soportePapelModalInventario').checked = soportes.includes("Papel");
    document.getElementById('soporteElectronicoModalInventario').checked = soportes.includes("Electrónico");
}
