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
    const ejecutarBusqueda = () => {
        const anioSeleccionado = selectAnio.value;
        const seccionSeleccionada = selectSecciones.value;
        if (anioSeleccionado && seccionSeleccionada) {
            cargarTablaInventario(anioSeleccionado, seccionSeleccionada);
            cargarTablaInventarioTurnado(anioSeleccionado, seccionSeleccionada);
        }
    };

    // Eventos para ejecutar la búsqueda cuando se selecciona un valor
    selectAnio.addEventListener("change", ejecutarBusqueda);
    selectSecciones.addEventListener("change", ejecutarBusqueda);

    //aqui mandamos a limpiar el modal Inventario
    // Obtenemos la referencia a tu modal de Inventario por su ID
    const modalInventarioEl = document.getElementById('modalInventario');

    // Nos aseguramos de que el modal exista en la página
    if (modalInventarioEl) {
        
        // Escuchamos el evento 'show.bs.modal'
        // La función del listener es ASÍNCRONA para poder usar 'await' adentro
        modalInventarioEl.addEventListener('show.bs.modal', async (event) => {
            
            // Justo antes de que el modal se muestre, ejecutamos la limpieza y carga de datos.
            console.log('El modal de Inventario está a punto de abrirse, preparando contenido...');
            
            // Usamos 'await' para asegurarnos de que toda la preparación (incluida la carga de series)
            // se complete antes de que el modal sea visible.
            await limpiarModalInventario();
        });
    }

});


// Cargamos las Secciones de la pantalla princial
document.addEventListener('DOMContentLoaded', cargarSeccionesInventario);

/* Pestaña de inventario */
async function cargarTablaInventario(anio, codigoSeccion) {
    const tbody = document.getElementById("tabla-inventario");
    const url = `https://api-nijc7glupa-uc.a.run.app/inventario/consultaInventario/anio/${anio}/areaOrigen/${codigoSeccion}`;

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
            <button class="btn btn-danger btn-sm btn-eliminar" title="Eliminar Registro">
                <i class="bi bi-trash"></i>
            </button>
        </td>
    `;

    // --- MEJORA: Manejo de eventos con addEventListener ---
    const btnEditar = fila.querySelector(".btn-editar");
    const btnEliminar = fila.querySelector(".btn-eliminar");

    // Guardar datos en los atributos data-* del botón
    btnEditar.dataset.id = item.id;
    btnEliminar.dataset.id = item.id;
    btnEliminar.dataset.expediente = item.numeroExpediente;
    btnEliminar.dataset.asunto = item.asunto;

    // Asignar el evento de click para editar
    btnEditar.addEventListener('click', (e) => {
        e.stopPropagation(); // Evita que se active el click de la fila
        editarRegistroInventario(e.currentTarget.dataset.id);
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
            const tipoUltimoMovimiento = historial.at(-1)?.tipo ?? "";

            const filaPrincipal = crearFilaPrincipalTurnado(item, tipoUltimoMovimiento);
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
function crearFilaPrincipalTurnado(item, tipoUltimoMovimiento) {
    const fila = document.createElement("tr");
    let filaClase = "fila-principal-inventario"; // Clase unificada para estilos consistentes

    if (tipoUltimoMovimiento === "concluido") filaClase += " table-success";
    else if (tipoUltimoMovimiento === "tramite") filaClase += " table-warning";

    fila.className = filaClase;
    // Se eliminaron los 'onclick' de los botones.
    fila.innerHTML = `
        <td>${item.numeroExpediente}</td>
        <td colspan="2"><span class="toggle-icon-inventario">▶</span> ${item.asunto} - ${item.listaDeDependencias} - (${item.subserie.codigoSubserie} - ${item.subserie.nombreSubserie})</td>
        <td class="status">${tipoUltimoMovimiento}</td>
        <td>
            <button class="btn btn-warning btn-sm btn-editar" title="Editar Registro">
                <i class="bi bi-pencil"></i>
            </button>
        </td>
        <td>
            <button class="btn btn-danger btn-sm btn-eliminar" title="Eliminar Registro">
                <i class="bi bi-trash"></i>
            </button>
        </td>
    `;

    // --- MEJORA: Manejo de eventos con addEventListener ---
    const btnEditar = fila.querySelector(".btn-editar");
    btnEditar.dataset.id = item.id;
    btnEditar.addEventListener('click', (e) => {
        e.stopPropagation(); // Evita que el clic se propague a la fila
        editarRegistroInventario(e.currentTarget.dataset.id);
    });

    const btnEliminar = fila.querySelector(".btn-eliminar");
    btnEliminar.dataset.id = item.id;
    btnEliminar.dataset.expediente = item.numeroExpediente;
    btnEliminar.dataset.asunto = item.asunto;
    btnEliminar.addEventListener('click', (e) => {
        e.stopPropagation(); // Evita que el clic se propague a la fila
        const data = e.currentTarget.dataset;
        eliminarRegistroInventario(data.id, data.expediente, data.asunto);
    });

    return fila;
}

function crearFilaDetalleTurnado(item, historial) {
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



//funcion de editar series
//Carga los datos al modal para editarlo
async function editarRegistroInventario(idInventario) {
    try {
        limpiarUIAreasModal();
        limpiarUIDependencias();
        //llenarSelectAreaTurnado();
        // Obtener los datos del inventario específico
        const response = await fetch(`https://api-nijc7glupa-uc.a.run.app/inventario/inventario/${idInventario}`);
        const inventario = await response.json();
        // Llenar el formulario con los datos obtenidos
        document.getElementById('idInventario').value = inventario.id;
        document.getElementById('numeroExpedienteModalInventario').value = inventario.numeroExpediente || '';
        document.getElementById('asuntoModalInventario').value = inventario.asunto || '';
        document.getElementById('dependenciaModalInventario').value = inventario.dependencias;
        //Status Creado
        document.getElementById('tipoModalInventario').value = inventario.status.creado.tipo || 'No aplica';
        document.getElementById('statusCreadoFechaModalInventario').value = inventario.status.creado.fecha || '';
        document.getElementById('areaCreadoModalInventario').value = inventario.status.creado.areaCreado;
        areas = inventario.status.creado.areaTurnado;
        const lista = document.getElementById("listaAreasTurnadas");
        lista.innerHTML = ""; // Limpiar lista antes de agregar elementos
        areas.forEach(area => {
            if (area) {
                areasSeleccionadas.push({ codigo: area, nombre: area });
                actualizarAreasTurnadasInventarioUI();
            }
        });
        document.getElementById('statusCreadoObservacionesModalInventario').value = inventario.status.creado.observaciones || '';
        //aqui agregar los datos en variables
        //usuario
        // Obtener la hora del inventario
        document.getElementById('statusCreadoHoraModalInventario').value = inventario.status.creado.hora;

        //Status Trámite
        document.getElementById('statusTramiteFechaModalInventario').value = inventario.status.tramite.fecha || '';
        document.getElementById('statusTramiteHoraModalInventario').value = inventario.status.tramite.hora;
        document.getElementById('statusTramiteObservacionesModalInventario').value = inventario.status.tramite.observaciones || '';
        //aqui agregar los datos en variables
        //usuario

        document.getElementById('statusConcluidoFechaModalInventario').value = inventario.status.concluido.fecha || '';
        document.getElementById('statusConcluidoHoraModalInventario').value = inventario.status.concluido.hora;
        document.getElementById('statusConcluidoObservacionesModalInventario').value = inventario.status.concluido.observaciones || '';
        //aqui agregar los datos en variables
        //usuario

        document.getElementById('numeroFojasModalInventario').value = inventario.numeroFojas || '';

        // Selección de soportes documentales
        marcarSoportes(inventario.soporteDocumental);

        // Selección de condiciones de acceso
        const condicionesAcceso = inventario.condicionesAcceso || 'Pública';
        document.getElementById('condicionPublicaModalInventario').checked = condicionesAcceso === 'Pública';
        document.getElementById('condicionReservadaModalInventario').checked = condicionesAcceso === 'Reservada';
        document.getElementById('condicionConfidencialModalInventario').checked = condicionesAcceso === 'Confidencial';

        document.getElementById('aniosReservaModalInventario').value = inventario.aniosReserva || '0';

        // Tradición documental
        document.getElementById('soporteOriginalModalInventario').checked = inventario.tradicionDocumental?.includes("Original") || false;
        document.getElementById('soporteCopiaModalInventario').checked = inventario.tradicionDocumental?.includes("Copia") || false;

        document.getElementById('inmuebleModalInventario').value = inventario.inmueble || '';
        document.getElementById('ubicacionModalInventario').value = inventario.ubicacion || '';

        document.getElementById('codigoSerieInventario').value = inventario.codigoSubserie || '';
        document.getElementById('nombreSerieInventario').value = inventario.nombreSerie || '';
        document.getElementById('valorDocumentalSerieInventario').value = inventario.valorDocumental || '';
        document.getElementById('aniosTramite').value = inventario.aniosTramite || '';
        document.getElementById('aniosConcentracion').value = inventario.aniosConcentracion || '';

        //habilita el boton editar y oculta el boton guardar
        const buttonGuardar = document.getElementById('guardarBtnModalinventario');
        const buttonModificar = document.getElementById('modificarBtnModalInventario');
        buttonGuardar.classList.add('d-none');//ocultar boton de Guardar 
        buttonModificar.classList.remove('d-none');//Mostrar boton de modificar

        // Abrir el modal
        const modal = new bootstrap.Modal(document.getElementById('modalInventario'));
        modal.show();

    } catch (error) {
        console.error('Error al cargar el inventario para editar:', error);
        alert('Error al cargar el inventario para editar');
    }
}

//guardar las modificaciones mediante el update
async function modificarInventario() {
    try {
        // Recopilar valores del formulario
        const formData = {
            id: document.getElementById('idInventario').value,
            numeroExpediente: document.getElementById("numeroExpedienteModalInventario").value.trim(),
            asunto: document.getElementById("asuntoModalInventario").value.trim(),
            dependencias: document.getElementById("dependenciaModalInventario").value.trim(),
            status: {
                creado: {
                    tipo: document.getElementById("tipoModalInventario").value.trim(),
                    fecha: document.getElementById("statusCreadoFechaModalInventario").value.trim(),
                    hora: document.getElementById("statusCreadoHoraModalInventario").value.trim(),
                    areaCreado: document.getElementById('areaCreadoModalInventario').value.trim(),//lo obtenemos del formulario
                    areaTurnado: (areasSeleccionadas && areasSeleccionadas.length > 0)
                        ? areasSeleccionadas.map(area => area.codigo)
                        : ["Sin asignar"], // Listado de áreas seleccionadas
                    observaciones: document.getElementById("statusCreadoObservacionesModalInventario").value.trim(),
                    usuario: ""
                },
                tramite: {
                    fecha: document.getElementById("statusTramiteFechaModalInventario").value.trim(),
                    hora: document.getElementById("statusTramiteHoraModalInventario").value.trim() || '00:00', //falta agregar en el formulario
                    observaciones: document.getElementById("statusTramiteObservacionesModalInventario").value.trim(),
                    usuario: ""
                },
                concluido: {
                    fecha: document.getElementById("statusConcluidoFechaModalInventario").value.trim(),
                    hora: document.getElementById("statusConcluidoHoraModalInventario").value.trim() || '12:00', //falta agregar en el formulario
                    observaciones: document.getElementById("statusConcluidoObservacionesModalInventario").value.trim(),
                    usuario: ""
                }
            },
            numeroFojas: document.getElementById("numeroFojasModalInventario").value.trim(),
            inmueble: document.getElementById("inmuebleModalInventario").value.trim(),
            ubicacion: document.getElementById("ubicacionModalInventario").value.trim(),
            codigoSubserie: document.getElementById("codigoSerieInventario").value.trim(),
            nombreSerie: document.getElementById("nombreSerieInventario").value.trim(),
            valorDocumental: document.getElementById("valorDocumentalSerieInventario").value.trim(),
            aniosTramite: document.getElementById("aniosTramite").value.trim(),
            aniosConcentracion: document.getElementById("aniosConcentracion").value.trim()
        };

        // Validar campos obligatorios
        for (const [key, value] of Object.entries(formData)) {
            if (!value) {
                console.error(`Error: El campo "${key}" es obligatorio.`);
                alert(`El campo "${key}" es obligatorio.`);
                return;
            }
        }

        // Obtener valores de Soporte Documental (Checkboxes)
        formData.soporteDocumental = [
            document.getElementById("soportePapelModalInventario").checked ? "Papel" : null,
            document.getElementById("soporteElectronicoModalInventario").checked ? "Electrónico" : null
        ].filter(Boolean).join("/");

        if (!formData.soporteDocumental) {
            alert("Debe seleccionar al menos un tipo de Soporte Documental.");
            return;
        }

        // Obtener valores de Tradición Documental (Checkboxes)
        formData.tradicionDocumental = [
            document.getElementById("soporteOriginalModalInventario").checked ? "Original" : null,
            document.getElementById("soporteCopiaModalInventario").checked ? "Copia" : null
        ].filter(Boolean).join("/");

        if (!formData.tradicionDocumental) {
            alert("Debe seleccionar al menos un tipo de Tradición Documental.");
            return;
        }

        // Obtener valor de Condiciones de Acceso (Radio buttons)
        formData.condicionesAcceso = document.querySelector('input[name="condicionesAcceso"]:checked')?.value || "";

        // Si es "Reservada", obtener años de reserva
        formData.aniosReserva = formData.condicionesAcceso === "Reservada"
            ? document.getElementById("aniosReservaModalInventario").value.trim()
            : "0";

        // Enviar solicitud PUT
        const response = await fetch(`https://api-nijc7glupa-uc.a.run.app/inventario/inventario/${formData.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error(`Error en la solicitud: ${response.status} - ${response.statusText}`);
        }

        const result = await response.json();
        console.log("Registro exitoso:", result);

        // Mostrar modal de éxito
        new bootstrap.Modal(document.getElementById('successModal')).show();

        // Cerrar modal de inventario
        bootstrap.Modal.getInstance(document.getElementById('modalInventario'))?.hide();

        //ACTUALIZAR TABLA
        seccionSeleccionadoInventaerio = document.getElementById("selectSeccionesInventario").value.trim();
        anioSeleccionadoInventaerio = document.getElementById("selectAnioBusqueda").value.trim(),
            cargarTablaInventario(anioSeleccionadoInventaerio, seccionSeleccionadoInventaerio);
        ///cargarTablaInventarioTurnado(anioSeleccionadoInventaerio, seccionSeleccionadoInventaerio);

    } catch (error) {
        console.error("Error al guardar inventario:", error);
        alert("Hubo un problema al guardar el inventario. Inténtelo nuevamente.");
    }
}

// Ejecutar la función al abrir el modal (llena el campo inventario)
document.getElementById("modalRegistroInventario").addEventListener("show.bs.modal", obtenerUltimoNumeroExpediente);

// Deshabilitar/habilitar campo de años de reserva
function toggleAniosReserva() {
    let reservadaSeleccionada = document.getElementById("condicionReservadaModalInventario").checked;
    let campoAniosReserva = document.getElementById("aniosReservaModalInventario");

    if (reservadaSeleccionada) {
        document.getElementById("aniosReservaModalInventario").value = "0";
        campoAniosReserva.style.display = "block";

    } else {
        campoAniosReserva.style.display = "none";
        document.getElementById("aniosReservaModalInventario").value = ""; // Limpiar el campo
    }
}

// Cargar opciones del dropdown inicial de las Secciones
async function cargarSeccionesInventario() {
    try {
        const response = await fetch('https://api-nijc7glupa-uc.a.run.app/secciones/cuadroGeneral');
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

        const secciones = await response.json();
        const select = document.getElementById('selectSeccionesInventario');
        const selectModal = document.getElementById('statusCreadoAreaCreadoModalInventario');

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
async function cargarSeriesInventario() {
    try {
        const selectSecciones = document.getElementById('selectSeccionesInventario');
        const codigoSeccion = selectSecciones.value;
        const selectSeries = document.getElementById('selectSeriesSubseries');
        //
        console.log("el codigo seleccionado es -->"+codigoSeccion);
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
                document.getElementById('codigoSerieInventario').value = data.id;
                document.getElementById('nombreSerieInventario').value = data.nombre;
                document.getElementById('valorDocumentalSerieInventario').value = data.valoresDocumentales;
                document.getElementById('aniosTramite').value = data.aniosTramite;
                document.getElementById('aniosConcentracion').value = data.aniosConcentracion;
            }
        });

    } catch (error) {
        console.error('Error final en cargarSeriesInventario:', error);
        const selectSeries = document.getElementById('selectSeriesSubseries');
        if (selectSeries) {
            selectSeries.innerHTML = '<option selected disabled>-- Error al cargar series --</option>';
        }
    }
}

// 1. Convertimos la función a 'async' para poder usar 'await'.
async function limpiarModalInventario() {
    
    // 2. Mantenemos toda tu lógica original para limpiar y preparar el modal.
    console.log("Limpiando el modal y restableciendo campos...");
    document.getElementById('formularioInventario').reset();
    obtenerUltimoNumeroExpediente();
    limpiarUIAreasModal();
    limpiarUIDependencias();
    //deshabilitarCamposStatus();
    
    const buttonGuardar = document.getElementById('guardarBtnModalinventario');
    const buttonModificar = document.getElementById('modificarBtnModalInventario');
    buttonGuardar.classList.remove('d-none'); // Mostrar botón de Guardar
    buttonModificar.classList.add('d-none');   // Ocultar botón de modificar

    // 3. Añadimos la llamada asíncrona para cargar las series.
    //    Usamos try...catch para manejar cualquier error durante la carga.
    try {
        console.log("Iniciando la carga de series y subseries...");
        
        // Llamamos a la función y esperamos a que termine antes de continuar.
        await cargarSeriesInventario(); 
        
        console.log("Las series y subseries se cargaron correctamente.");

    } catch (error) {
        console.error("Falló la carga de datos para el modal:", error);
        // Aquí podrías mostrar una alerta al usuario si algo sale mal.
        // alert("No se pudieron cargar los datos de series. Por favor, intente de nuevo.");
    }
}

// Registra lo que se capturo del modal
async function guardarInventario() {
    try {
        const dependenciaSelect = document.getElementById("dependenciaModalInventario").value.trim();
        console.log("dependencia es " + dependenciaSelect);
        // Recopilar valores del formulario
        const formData = {
            numeroExpediente: document.getElementById("numeroExpedienteModalInventario").value.trim(),
            asunto: document.getElementById("asuntoModalInventario").value.trim(),
            dependencias: document.getElementById("dependenciaModalInventario").value.trim(),
            status: {
                creado: {
                    tipo: document.getElementById("tipoModalInventario").value.trim(),
                    fecha: document.getElementById("statusCreadoFechaModalInventario").value.trim(),
                    hora: document.getElementById("statusCreadoHoraModalInventario").value.trim(),
                    areaCreado: document.getElementById('selectSeccionesInventario').value.trim(),//lo obtenemos desde la principal
                    areaTurnado: (areasSeleccionadas && areasSeleccionadas.length > 0)
                        ? areasSeleccionadas.map(area => area.codigo)
                        : [""], // Listado de áreas seleccionadas
                    observaciones: document.getElementById("statusCreadoObservacionesModalInventario").value.trim(),
                    usuario: ""
                },
                tramite: {
                    fecha: document.getElementById("statusTramiteFechaModalInventario").value.trim(),
                    hora: document.getElementById("statusTramiteHoraModalInventario").value.trim() || '00:00', //falta agregar en el formulario
                    observaciones: document.getElementById("statusTramiteObservacionesModalInventario").value.trim(),
                    usuario: ""
                },
                concluido: {
                    fecha: document.getElementById("statusConcluidoFechaModalInventario").value.trim(),
                    hora: document.getElementById("statusConcluidoHoraModalInventario").value.trim() || '00:00', //falta agregar en el formulario
                    observaciones: document.getElementById("statusConcluidoObservacionesModalInventario").value.trim(),
                    usuario: ""
                }
            },
            numeroFojas: document.getElementById("numeroFojasModalInventario").value.trim(),
            inmueble: document.getElementById("inmuebleModalInventario").value.trim(),
            ubicacion: document.getElementById("ubicacionModalInventario").value.trim(),
            codigoSubserie: document.getElementById("codigoSerieInventario").value.trim(),
            nombreSerie: document.getElementById("nombreSerieInventario").value.trim(),
            valorDocumental: document.getElementById("valorDocumentalSerieInventario").value.trim(),
            aniosTramite: document.getElementById("aniosTramite").value.trim(),
            aniosConcentracion: document.getElementById("aniosConcentracion").value.trim()
        };

        // Validar campos obligatorios
        for (const [key, value] of Object.entries(formData)) {
            if (!value) {
                console.error(`Error: El campo "${key}" es obligatorio.`);
                alert(`El campo "${key}" es obligatorio.`);
                return;
            }
        }

        // Obtener valores de Soporte Documental (Checkboxes)
        formData.soporteDocumental = [
            document.getElementById("soportePapelModalInventario").checked ? "Papel" : null,
            document.getElementById("soporteElectronicoModalInventario").checked ? "Electrónico" : null
        ].filter(Boolean).join("/");

        if (!formData.soporteDocumental) {
            alert("Debe seleccionar al menos un tipo de Soporte Documental.");
            return;
        }

        // Obtener valores de Tradición Documental (Checkboxes)
        formData.tradicionDocumental = [
            document.getElementById("soporteOriginalModalInventario").checked ? "Original" : null,
            document.getElementById("soporteCopiaModalInventario").checked ? "Copia" : null
        ].filter(Boolean).join("/");

        if (!formData.tradicionDocumental) {
            alert("Debe seleccionar al menos un tipo de Tradición Documental.");
            return;
        }

        // Obtener valor de Condiciones de Acceso (Radio buttons)
        formData.condicionesAcceso = document.querySelector('input[name="condicionesAcceso"]:checked')?.value || "";

        // Si es "Reservada", obtener años de reserva
        formData.aniosReserva = formData.condicionesAcceso === "Reservada"
            ? document.getElementById("aniosReservaModalInventario").value.trim()
            : "0";
        console.log("datos envidiados " + formData);
        // Enviar solicitud POST 
        const response = await fetch("https://api-nijc7glupa-uc.a.run.app/inventario/inventarioStatus", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error(`Error en la solicitud: ${response.status} - ${response.statusText}`);
        }

        const result = await response.json();
        console.log("Registro exitoso:", result);

        // Mostrar modal de éxito
        new bootstrap.Modal(document.getElementById('successModal')).show();

        // Cerrar modal de inventario
        bootstrap.Modal.getInstance(document.getElementById('modalInventario'))?.hide();

        //ACTUALIZAR TABLA
        seccionSeleccionadoInventaerio = document.getElementById("selectSeccionesInventario").value.trim();
        anioSeleccionadoInventaerio = document.getElementById("selectAnioBusqueda").value.trim(),
            cargarTablaInventario(anioSeleccionadoInventaerio, seccionSeleccionadoInventaerio);
        cargarTablaInventarioTurnado(anioSeleccionadoInventaerio, seccionSeleccionadoInventaerio);

    } catch (error) {
        console.error("Error al guardar inventario:", error);
        alert("Hubo un problema al guardar el inventario. Inténtelo nuevamente.");
    }
}

// Se obtiene el ultimo número del expediente para agregarlo al modal
async function obtenerUltimoNumeroExpediente() {
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

//funcion de llenar areas del modal para el area turnado
/*
async function llenarSelectAreaTurnado() {
    document.getElementById('statusCreadoAreaCreadoModalInventario').innerHTML = (document.getElementById('selectSeccionesInventario').innerHTML);
}
*/
// Función para eliminar un registro del inventario
async function eliminarRegistroInventario(id, numeroExpediente, asunto) {
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

        // Recargar el inventario con los valores actuales del select
        const selectAnio = document.getElementById("selectAnioBusqueda").value;
        const selectSecciones = document.getElementById("selectSeccionesInventario").value;

        //cargarTablaInventario(selectAnio, selectSecciones);
        //cargarTablaInventarioTurnado(selectAnio, selectSecciones);

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

function actualizarAreasTurnadasInventarioUI() {
    const container = document.getElementById("listaAreasTurnadas");
    container.innerHTML = ""; // Limpiar antes de actualizar
    
    // Usamos un DocumentFragment para mejor rendimiento
    const fragmento = document.createDocumentFragment();

    areasSeleccionadas.forEach((area, index) => {
        // Llamamos a nuestra nueva función para crear cada <li>
        const elementoLista = crearElementoListaArea(area, index);
        fragmento.appendChild(elementoLista);
    });

    // Añadimos la lista completa al DOM de una sola vez
    container.appendChild(fragmento);
    // También añadimos la clase de Bootstrap para que se vea como una lista
    container.className = "list-group";
}

function actualizarDependenciasUI() {
    const container = document.getElementById("listaDependencias");
    container.innerHTML = ""; // Limpiar antes de actualizar

    dependenciasSeleccionadas.forEach((dependencia, index) => {
        // Aseguramos que el index se pase correctamente
        container.insertAdjacentHTML("beforeend", crearDependenciaHTML(index, dependencia.nombre));
    });
}

function eliminarDependenciaLista(index) {
    if (index === undefined || index === null) {
        console.error("Error: ID no proporcionado");
        return;
    }
    dependenciasSeleccionadas.splice(index, 1);
    actualizarDependenciasUI();
}

function agregarAreaInventario() {
    let select = document.getElementById("statusCreadoAreaCreadoModalInventario");
    let areaCodigo = select.value;
    let areaNombre = select.options[select.selectedIndex].text;
    if (areaCodigo && !areasSeleccionadas.some(area => area.codigo === areaCodigo)) {
        areasSeleccionadas.push({ codigo: areaCodigo, nombre: areaNombre });
        actualizarAreasTurnadasInventarioUI();
    }
}
function agregarDependencia() {
    let select = document.getElementById("dependenciaModalInventario");
    let dependencia = select.value;
    let dependenciaTexto = select.options[select.selectedIndex].text;

    // Verifica si el valor no está vacío y si ya existe en la lista
    if (dependencia && !dependenciasSeleccionadas.some(dep => dep.nombre === dependencia)) {
        dependenciasSeleccionadas.push({ nombre: dependenciaTexto });
        actualizarDependenciasUI();
    }
}

function eliminarAreaInventario(index) {
    // CORRECCIÓN: Apuntamos al array correcto
    areasSeleccionadas.splice(index, 1);
    
    // Volvemos a dibujar la lista actualizada
    actualizarAreasTurnadasInventarioUI();
}

/**
 * Crea un elemento <li> para la lista de áreas seleccionadas.
 * Asigna el evento de clic para el botón de eliminar.
 * @param {object} area - El objeto del área con {codigo, nombre}.
 * @param {number} index - El índice del área en el array.
 * @returns {HTMLLIElement} El elemento <li> construido.
 */
function crearElementoListaArea(area, index) {
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



function crearDependenciaHTML(index, dependencia) {
    return `
      <li class="area-item border p-2 mb-2 rounded list-group-item d-flex justify-content-between align-items-center">
    <span>${dependencia}</span>

    <button type="button" class="btn btn-danger btn-sm" 
            onclick="eliminarDependenciaLista(${index})">
        <i class="bi bi-trash"></i>
    </button> 
</li>
    `;
}


function limpiarUIAreasModal() {
    // Limpiar la lista de áreas seleccionadas
    areasSeleccionadas = [];
    actualizarAreasTurnadasInventarioUI();

    // Restablecer el valor del select
    document.getElementById("statusCreadoAreaCreadoModalInventario").value = "";
}

function limpiarUIDependencias() {
    // Limpiar la lista de áreas seleccionadas
    dependenciasSeleccionadas = [];
    actualizarDependenciasUI();

    // Restablecer el valor del select
    //document.getElementById("dependenciaModalInventario").value = "";
}

document.getElementById("btnAgregarAreaInventario").addEventListener("click", agregarAreaInventario);
document.getElementById("btnAgregarDependencias").addEventListener("click", agregarDependencia);


function deshabilitarCamposStatus() {
    document.getElementById("statusTramiteFechaModalInventario").disabled = true;
    document.getElementById("statusTramiteObservacionesModalInventario").disabled = true;
    document.getElementById("statusConcluidoFechaModalInventario").disabled = true;
    document.getElementById("statusConcluidoObservacionesModalInventario").disabled = true;
}

function habilitarCamposStatus() {
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
    if (!soporteDocumental) return;

    // Convertir la cadena en un array separándola por "/"
    const soportes = soporteDocumental.split("/").map(s => s.trim());

    // Marcar los checkboxes según la existencia de valores
    document.getElementById('soportePapelModalInventario').checked = soportes.includes("Papel");
    document.getElementById('soporteElectronicoModalInventario').checked = soportes.includes("Electrónico");
}
