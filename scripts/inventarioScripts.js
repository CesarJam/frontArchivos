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
            cargarInventario(anioSeleccionado, seccionSeleccionada);
            cargarInventarioTurnado(anioSeleccionado, seccionSeleccionada);
        }
    };

    // Eventos para ejecutar la búsqueda cuando se selecciona un valor
    selectAnio.addEventListener("change", ejecutarBusqueda);
    selectSecciones.addEventListener("change", ejecutarBusqueda);

    //Funcion para llenar el select de dependencias de ModalInventario desde la API
     cargarSelectModalInventario();
     // Evento cuando cambia la selección
     $('#dependenciaModalInventario').on('changed.bs.select', function () {
         mostrarValorSelectModalInventario();
     });
    
});


// Cargamos las Secciones de la pantalla princial
document.addEventListener('DOMContentLoaded', cargarSeccionesInventario);

// Consulta y carga de datos a la tabla al seleccionar (Año y codigoSeccion)
async function cargarInventario(anio, codigoSeccion) {
    try {
        const url = `https://api-nijc7glupa-uc.a.run.app/inventario/ConsultaInventario/anio/${anio}/codigoSeccion/${codigoSeccion}`;
        const tbody = document.getElementById("tabla-inventario");
        const response = await fetch(url);
        const datos = await response.json();

        // Limpiar tabla anterior
        tbody.innerHTML = "";

        if (!Array.isArray(datos) || datos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center">No hay registros para el año ${anio}</td></tr>`;
            return;
        }

        // Ordenar por número de expediente
        datos.sort((a, b) => parseInt(a.numeroExpediente) - parseInt(b.numeroExpediente));

        datos.forEach((item, index) => {

            // Obtener el estado más reciente
            const status = item.status || {};
            const creado = status.creado || {};
            const tramite = status.tramite || {};
            const concluido = status.concluido || {};

            // Asegurar que las fechas no sean undefined o vacías
            const fechaConcluido = concluido.fecha && concluido.fecha.trim() !== "" ? concluido.fecha : "AAAA-MM-DD";
            const fechaTramite = tramite.fecha && tramite.fecha.trim() !== "" ? tramite.fecha : "AAAA-MM-DD";
            const fechaCreado = creado.fecha && creado.fecha.trim() !== "" ? creado.fecha : "AAAA-MM-DD";

            let estadoActual = "Sin estado";
            if (fechaConcluido !== "AAAA-MM-DD") {
                estadoActual = "Concluido";
            } else if (fechaTramite !== "AAAA-MM-DD") {
                estadoActual = "En trámite";
            } else if (fechaCreado !== "AAAA-MM-DD") {
                estadoActual = "Recepcionado";
            }

            // Determinar el color de la fila según el estado
            let filaClase = "fila-principal";
            if (estadoActual === "Concluido") {
                filaClase += " table-success"; // Verde
            } else if (estadoActual === "En trámite") {
                filaClase += " table-warning"; // Amarillo
            }
            // Fila principal con color según el estado
            const filaPrincipal = document.createElement("tr");
            filaPrincipal.className = filaClase;
            filaPrincipal.innerHTML = `
                <td colspan="1">${item.numeroExpediente}</td>
                <td colspan="2">
                    <span class="toggle-icon" data-bs-toggle="collapse" data-bs-target="#detalle-${index}">▶</span> 
                    ${item.asunto} -- ${item.dependencias}
                </td>
                <td colspan="1" class="status">
                    ${estadoActual}
                </td>
                <td colspan="1">
                    <button class="btn btn-warning btn-sm" onclick="editarRegistroInventario('${item.id}')">
                        <i class="bi bi-pencil"></i>
                    </button>
                </td>
                <td colspan="1">
                    <button class="btn btn-danger btn-sm" onclick="eliminarRegistroInventario('${item.id}','${item.numeroExpediente}','${item.asunto}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;

            // Fila de detalles (subtabla colapsable)
            const filaDetalle = document.createElement("tr");
            filaDetalle.className = "subtabla collapse";
            filaDetalle.id = `detalle-${index}`;
            filaDetalle.innerHTML = `
                <td colspan="6">
                    <div class="subtabla-content p-3">
                        <table class="table table-sm mb-0">
                            <tbody>
                                <tr class="fw-bold">
                                    <td colspan="1">Número Fojas</td>
                                    <td colspan="2">Soporte Documental</td>
                                    <td colspan="2">Condiciones Acceso</td>
                                    <td colspan="1">Años Reserva</td>
                                </tr>
                                <tr>    
                                    <td colspan="1">${item.numeroFojas}</td>
                                    <td colspan="2">${item.soporteDocumental}</td>
                                    <td colspan="2">${item.condicionesAcceso}</td>
                                    <td colspan="1">${item.aniosReserva}</td>                   
                                </tr>
                                <tr class="fw-bold">
                                    <td colspan="3">Tradición Documental</td>
                                    <td colspan="3">Inmueble</td>
                                </tr>
                                <tr>
                                    <td colspan="3">${item.tradicionDocumental}</td>
                                    <td colspan="3">${item.inmueble}</td>
                                </tr>
                                <tr class="fw-bold">
                                    <td>Ubicación</td>
                                </tr>
                                <tr>
                                    <td colspan="6"><a href="${item.ubicacion}" target="_blank">${item.ubicacion}</a></td>
                                </tr>
                                <tr class="fw-bold">
                                    <td colspan="1">Código Serie</td>
                                    <td colspan="2">Nombre Serie</td>
                                    <td colspan="1">Valor Documental</td>
                                    <td colspan="1">Años Trámite</td>
                                    <td colspan="1">Años Concentración</td>                           
                                </tr>
                                <tr>
                                    <td colspan="1">${item.codigoSubserie}</td>
                                    <td colspan="2">${item.nombreSerie}</td>
                                    <td colspan="1">${item.valorDocumental}</td>
                                    <td colspan="1">${item.aniosTramite}</td>
                                    <td colspan="1">${item.aniosConcentracion}</td>                                
                                </tr>
                                <tr class="fw-bold text-center"><td colspan="6">Historial de Estado</td></tr>
                                <tr>
                                    <td colspan="1">
                                        <strong>Creado:</strong> ${creado.fecha || "N/A"} <br>
                                        <strong>Tipo:</strong> ${creado.tipo || "N/A"} <br>
                                        <strong>Hora:</strong> ${creado.hora || "N/A"} <br>
                                        <strong>Aréa:</strong> ${creado.areaCreado || "N/A"} <br>
                                        <small>Áreas Turnadas:<br> 
                                            ${Array.isArray(creado.areaTurnado) && creado.areaTurnado.length > 0
                    ? creado.areaTurnado.map(area => `${area}<br>`).join("")
                    : "N/A"}
                                        </small>
                                        <small>${creado.observaciones || ""}</small> <br>
                                        <strong>Usuario:</strong> ${creado.usuario || "N/A"}
                                    </td>
                                    <td colspan="2">
                                        <strong>Trámite:</strong> ${tramite.fecha || "N/A"} <br>
                                        <strong>Hora:</strong> ${tramite.hora || "N/A"} <br> 
                                        <small>${tramite.observaciones}</small> <br>
                                        <strong>Usuario:</strong> ${tramite.usuario || "N/A"}
                                    </td>
                                    <td colspan="3">
                                        <strong>Concluido:</strong> ${concluido.fecha || "N/A"} <br>
                                        <strong>Hora:</strong> ${concluido.hora || "N/A"} <br> 
                                        <small>${concluido.observaciones}</small> <br>
                                        <strong>Usuario:</strong> ${concluido.usuario || "N/A"}
                                    </td>
                                </tr>
                                <tr class="fw-bold text-center"><td colspan="6">Vista Previa</td></tr>
                                <tr class="text-center">
                                    <td colspan="6">
                                        <iframe src="${item.ubicacion}" width="800" height="800"></iframe>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </td>
            `;

            // Evento para expandir/colapsar
            filaPrincipal.addEventListener('click', () => {
                const icono = filaPrincipal.querySelector('.toggle-icon');
                icono.style.transform = icono.style.transform === 'rotate(90deg)' ? 'rotate(0deg)' : 'rotate(90deg)';
                new bootstrap.Collapse(filaDetalle, { toggle: true });
            });

            tbody.appendChild(filaPrincipal);
            tbody.appendChild(filaDetalle);
        });

    } catch (error) {
        console.error("Error al cargar el inventario:", error);
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error al cargar el inventario</td></tr>`;
    }
}

//  PESTAÑA DE TURNADOS
// Consulta y carga de datos a la tablaTurnados al seleccionar (Año y codigoSeccion)
async function cargarInventarioTurnado(anio, codigoSeccion) {
    const url = `https://api-nijc7glupa-uc.a.run.app/inventario/consultaInventarioTurnado/anio/${anio}/areaTurnado/${codigoSeccion}`;
    const tbody = document.getElementById("tabla-inventarioTurnado");

    try {
        const response = await fetch(url);
        const datos = await response.json();

        // Limpiar tabla anterior
        tbody.innerHTML = "";

        if (!Array.isArray(datos) || datos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center">No hay registros para el año ${anio}</td></tr>`;
            return;
        }

        // Ordenar por número de expediente
        datos.sort((a, b) => parseInt(a.numeroExpediente) - parseInt(b.numeroExpediente));

        datos.forEach((item, index) => {
            // Obtener el estado más reciente
            const status = item.status || {};
            const creado = status.creado || {};
            const tramite = status.tramite || {};
            const concluido = status.concluido || {};

            // Asegurar que las fechas no sean undefined o vacías
            const fechaConcluido = concluido.fecha && concluido.fecha.trim() !== "" ? concluido.fecha : "AAAA-MM-DD";
            const fechaTramite = tramite.fecha && tramite.fecha.trim() !== "" ? tramite.fecha : "AAAA-MM-DD";
            const fechaCreado = creado.fecha && creado.fecha.trim() !== "" ? creado.fecha : "AAAA-MM-DD";

            let estadoActual = "Sin estado";
            if (fechaConcluido !== "AAAA-MM-DD") {
                estadoActual = "Concluido";
            } else if (fechaTramite !== "AAAA-MM-DD") {
                estadoActual = "En trámite";
            } else if (fechaCreado !== "AAAA-MM-DD") {
                estadoActual = "Recepcionado";
            }

            // Determinar el color de la fila según el estado
            let filaClase = "fila-principal";
            if (estadoActual === "Concluido") {
                filaClase += " table-success"; // Verde
            } else if (estadoActual === "En trámite") {
                filaClase += " table-warning"; // Amarillo
            }
            // Fila principal con color según el estado
            const filaPrincipal = document.createElement("tr");
            filaPrincipal.className = filaClase;
            filaPrincipal.innerHTML = `
                <td colspan="1">${item.numeroExpediente}</td>
                <td colspan="2">
                    <span class="toggle-icon" data-bs-toggle="collapse" data-bs-target="#detalle-${index}">▶</span> 
                    ${item.status.creado.areaCreado} -- ${item.asunto} -- ${item.dependencias}
                </td>
                <td colspan="1" class="status">
                    ${estadoActual}
                </td>
                <td colspan="1">
                    <button class="btn btn-warning btn-sm" onclick="editarRegistroInventario('${item.id}')">
                        <i class="bi bi-pencil"></i>
                    </button>
                </td>
                <td colspan="1">
                    <!--
                    <button class="btn btn-danger btn-sm" onclick="eliminarRegistroInventario('${item.id}','${item.numeroExpediente}','${item.asunto}')">
                        <i class="bi bi-trash"></i>
                    </button>
                    -->
                </td>
            `;

            // Fila de detalles (subtabla colapsable)
            const filaDetalle = document.createElement("tr");
            filaDetalle.className = "subtabla collapse";
            filaDetalle.id = `detalle-${index}`;
            filaDetalle.innerHTML = `
                <td colspan="6">
                    <div class="subtabla-content p-3">
                        <table class="table table-sm mb-0">
                            <tbody>
                                <tr class="fw-bold">
                                    <td colspan="1">Número Fojas</td>
                                    <td colspan="2">Soporte Documental</td>
                                    <td colspan="2">Condiciones Acceso</td>
                                    <td colspan="1">Años Reserva</td>
                                </tr>
                                <tr>
                                    <td colspan="1">${item.numeroFojas}</td>
                                    <td colspan="2">${item.soporteDocumental}</td>
                                    <td colspan="2">${item.condicionesAcceso}</td>
                                    <td colspan="1">${item.aniosReserva}</td>                   
                                </tr>
                                <tr class="fw-bold">
                                    <td colspan="3">Tradición Documental</td>
                                    <td colspan="3">Inmueble</td>   
                                </tr>
                                <tr>
                                    <td colspan="3">${item.tradicionDocumental}</td>
                                    <td colspan="3">${item.inmueble}</td>
                                </tr>
                                <tr class="fw-bold">
                                    <td>Ubicación</td>
                                </tr>
                                <tr>
                                    <td colspan="6"><a href="${item.ubicacion}" target="_blank">${item.ubicacion}</a></td>
                                </tr>
                                <tr class="fw-bold">
                                    <td colspan="1">Código Serie</td>
                                    <td colspan="2">Nombre Serie</td>
                                    <td colspan="1">Valor Documental</td>
                                    <td colspan="1">Años Trámite</td>
                                    <td colspan="1">Años Concentración</td>                           
                                </tr>
                                <tr>
                                    <td colspan="1">${item.codigoSubserie}</td>
                                    <td colspan="2">${item.nombreSerie}</td>
                                    <td colspan="1">${item.valorDocumental}</td>
                                    <td colspan="1">${item.aniosTramite}</td>
                                    <td colspan="1">${item.aniosConcentracion}</td>                                
                                </tr>
                                <tr class="fw-bold text-center"><td colspan="6">Historial de Estado</td></tr>
                                <tr>
                                    <td colspan="1">
                                        <strong>Creado:</strong> ${creado.fecha || "N/A"} <br>
                                        <strong>Tipo:</strong> ${creado.tipo || "N/A"} <br>
                                        <strong>Hora:</strong> ${creado.hora || "N/A"} <br>
                                        <strong>Aréa:</strong> ${creado.areaCreado || "N/A"} <br>
                                        <small>Áreas Turnadas:<br> 
                                            ${Array.isArray(creado.areaTurnado) && creado.areaTurnado.length > 0
                    ? creado.areaTurnado.map(area => `${area}<br>`).join("")
                    : "N/A"}
                                        </small>
                                        <small>${creado.observaciones || ""}</small> <br>
                                        <strong>Usuario:</strong> ${creado.usuario || "N/A"}
                                    </td>
                                    <td colspan="2">
                                        <strong>Trámite:</strong> ${tramite.fecha || "N/A"} <br>
                                        <strong>Hora:</strong> ${tramite.hora || "N/A"} <br> 
                                        <small>${tramite.observaciones}</small> <br>
                                        <strong>Usuario:</strong> ${tramite.usuario || "N/A"}
                                    </td>
                                    <td colspan="3">
                                        <strong>Concluido:</strong> ${concluido.fecha || "N/A"} <br>
                                        <strong>Hora:</strong> ${concluido.hora || "N/A"} <br> 
                                        <small>${concluido.observaciones}</small> <br>
                                        <strong>Usuario:</strong> ${concluido.usuario || "N/A"}
                                    </td>
                                </tr>
                                <tr class="fw-bold text-center"><td colspan="6">Vista Previa</td></tr>
                                <tr class="text-center">
                                    <td colspan="6">
                                        <iframe src="${item.ubicacion}" width="800" height="800"></iframe>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </td>
            `;

            // Evento para expandir/colapsar
            filaPrincipal.addEventListener('click', () => {
                const icono = filaPrincipal.querySelector('.toggle-icon');
                icono.style.transform = icono.style.transform === 'rotate(90deg)' ? 'rotate(0deg)' : 'rotate(90deg)';
                new bootstrap.Collapse(filaDetalle, { toggle: true });
            });

            tbody.appendChild(filaPrincipal);
            tbody.appendChild(filaDetalle);
        });

    } catch (error) {
        console.error("Error al cargar el inventario:", error);
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error al cargar el inventario</td></tr>`;
    }
}


//funcion de editar series
//Carga los datos al modal para editarlo
async function editarRegistroInventario(idInventario) {
    try {
        limpiarUIAreasModal();
        limpiarUIDependencias();
        llenarSelectAreaTurnado();
        // Obtener los datos del inventario específico
        const response = await fetch(`https://api-nijc7glupa-uc.a.run.app/inventario/inventario/${idInventario}`);
        const inventario = await response.json();
        // Llenar el formulario con los datos obtenidos
        document.getElementById('idInventario').value = inventario.id;
        document.getElementById('numeroExpedienteModalInventario').value = inventario.numeroExpediente || '';
        document.getElementById('asuntoModalInventario').value = inventario.asunto || '';
        document.getElementById('dependenciaModalInventario').value= inventario.dependencias;
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
        cargarInventario(anioSeleccionadoInventaerio, seccionSeleccionadoInventaerio);
        cargarInventarioTurnado(anioSeleccionadoInventaerio, seccionSeleccionadoInventaerio);

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
        select.innerHTML = '<option selected disabled>-- Elige una sección --</option>';

        secciones.forEach(seccion => {
            const option = document.createElement('option');
            option.value = seccion.id;
            option.textContent = seccion.id;
            option.dataset.seccion = seccion.seccion || 'No definido'; // Evita valores `undefined`
            select.appendChild(option);
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

// Carga el option de las series y subseries del modal
document.getElementById('selectSeccionesInventario').addEventListener('change', cargarSeriesInventario);

// Carga de las series y subseries del modal
async function cargarSeriesInventario() {
    try {
        const selectSecciones = document.getElementById('selectSeccionesInventario');
        const codigoSeccion = selectSecciones.value;

        const url = `https://api-nijc7glupa-uc.a.run.app/series/series/codigoSeccion/${codigoSeccion}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

        const series = await response.json();
        const selectSeries = document.getElementById('selectSeriesSubseries');

        // **Limpiar y restablecer el select**
        selectSeries.innerHTML = '<option selected disabled>-- Selecciona una subserie --</option>';
        const datosSeriesSubseries = {};

        series.forEach(serie => {
            datosSeriesSubseries[serie.id] = {
                id: serie.id,
                nombre: serie.nombre,
                valoresDocumentales: "No disponible",
                aniosTramite: "No disponible",
                aniosConcentracion: "No disponible"
            };

            const optionSerie = document.createElement('option');
            optionSerie.value = serie.id;
            optionSerie.textContent = `📂 ${serie.id} - ${serie.nombre}`;
            selectSeries.appendChild(optionSerie);

            serie.subseries.forEach(subserie => {
                datosSeriesSubseries[subserie.id] = {
                    id: subserie.id,
                    nombre: subserie.nombre,
                    valoresDocumentales: subserie.valoresDocumentales || "No disponible",
                    aniosTramite: subserie.aniosTramite || "No disponible",
                    aniosConcentracion: subserie.aniosConcentracion || "No disponible"
                };

                const optionSubserie = document.createElement('option');
                optionSubserie.value = subserie.id;
                optionSubserie.textContent = `📄 ${subserie.id} - ${subserie.nombre}`;
                optionSubserie.style.paddingLeft = "20px";
                selectSeries.appendChild(optionSubserie);
            });
        });

        // **Eliminar el evento change anterior antes de agregar uno nuevo**
        selectSeries.replaceWith(selectSeries.cloneNode(true)); // Clona el select para eliminar eventos previos
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
        console.error('Error al cargar series y subseries:', error);
    }
}

// Limpia el modal
function limpiarModalInventario() {
    // Limpiar los campos de texto
    document.getElementById('formularioInventario').reset();
    obtenerUltimoNumeroExpediente();
    limpiarUIAreasModal();
    limpiarUIDependencias();
    //deshabilitarCamposStatus();
    const buttonGuardar = document.getElementById('guardarBtnModalinventario');
    const buttonModificar = document.getElementById('modificarBtnModalInventario');
    buttonGuardar.classList.remove('d-none');//ocultar boton de Guardar 
    buttonModificar.classList.add('d-none');//Mostrar boton de modificar
}

// Registra lo que se capturo del modal
async function guardarInventario() {
    try {
        const dependenciaSelect = document.getElementById("dependenciaModalInventario").value.trim();
        console.log("dependencia es "+dependenciaSelect);
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
            console.log("datos envidiados "+ formData);
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
        cargarInventario(anioSeleccionadoInventaerio, seccionSeleccionadoInventaerio);
        cargarInventarioTurnado(anioSeleccionadoInventaerio, seccionSeleccionadoInventaerio);

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
    llenarSelectAreaTurnado();
}

//funcion de llenar areas del modal para el area turnado
async function llenarSelectAreaTurnado() {
    document.getElementById('statusCreadoAreaCreadoModalInventario').innerHTML = (document.getElementById('selectSeccionesInventario').innerHTML);
}

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

        cargarInventario(selectAnio, selectSecciones);
        cargarInventarioTurnado(selectAnio, selectSecciones);

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
    areasSeleccionadas.forEach((area, index) => {
        container.insertAdjacentHTML("beforeend", crearAreaHTML(index, area.codigo, area.nombre));
    });
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
    dependenciasSeleccionadas.splice(index, 1);
    actualizarAreasTurnadasInventarioUI();
}

function crearAreaHTML(index, codigo, nombre) {
    return `
      <div class="area-item border p-2 mb-2 rounded">
        <div class="row g-2">
          <div class="col-md-9">
            <span>${nombre} (${codigo})</span>
          </div>
          <div class="col-md-3">
            <button type="button" class="btn btn-sm btn-danger w-100" 
                    onclick="eliminarAreaInventario(${index})">Eliminar</button>
          </div>
        </div>
      </div>
    `;
}

function crearDependenciaHTML(index, dependencia) {
    return `
      <div class="area-item border p-2 mb-2 rounded">
        <div class="row g-2">
          <div class="col-md-9">
            <span>${dependencia} </span>
          </div>
          <div class="col-md-3">
            <button type="button" class="btn btn-sm btn-danger w-100" 
                    onclick="eliminarDependenciaLista(${index})">Eliminar</button>
          </div>
        </div>
      </div>
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
    document.getElementById("dependenciaModalInventario").value = "";
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
            if (fila.classList.contains("fila-principal")) {
                fila.style.display = coincide ? "" : "none";

                // Asegurar que la fila de detalles relacionada también se muestre o se oculte
                let filaDetalle = fila.nextElementSibling;
                if (filaDetalle && filaDetalle.classList.contains("fila-detalle")) {
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

//Funcion de la carga de select de Dependencias del Modal Inventario desde la API
async function cargarSelectModalInventario() {
    let select = document.getElementById("dependenciaModalInventario");

    // Mostrar mensaje de carga
    select.innerHTML = '<option value="">Cargando...</option>';
    $('#dependenciaModalInventario').selectpicker('refresh');

    try {
        // Obtener las dependencias de la API
        const response = await fetch("https://api-nijc7glupa-uc.a.run.app/dependencias/dependencias");
        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
            // Ordenar alfabéticamente
            data.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));

            // Limpiar el select antes de agregar opciones
            select.innerHTML = '<option value="">Seleccione una dependencia</option>';

            // Agregar opciones al select
            data.forEach(dependencia => {
                const option = document.createElement("option");
                option.value = dependencia.nombre || "No disponible";
                option.textContent = dependencia.nombre || "No disponible";
                option.setAttribute("data-tokens", dependencia.nombre || "No disponible");
                select.appendChild(option);
            });

            // Refrescar Bootstrap Select
            $('#dependenciaModalInventario').selectpicker('refresh');
        } else {
            throw new Error("No se encontraron dependencias.");
        }
    } catch (error) {
        console.error("Error al cargar datos:", error);
        select.innerHTML = '<option value="">Error al cargar datos</option>';
        $('#dependenciaModalInventario').selectpicker('refresh');
    }
}
//ejemplo de como se extrae la info del select Dependencias modal inventario
function mostrarValorSelectModalInventario() {
    const valor = $('#dependenciaModalInventario').val() || 'Vacío';
    $('#valorActual').text(valor);
    //console.log(valor)
}
