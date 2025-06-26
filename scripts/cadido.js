// Cargar opciones del dropdown inicial
async function cargarSeccionesCADIDO() {
    try {
        const response = await fetch('https://api-nijc7glupa-uc.a.run.app/secciones/cuadroGeneral');
        const secciones = await response.json();
        const select = document.getElementById('selectSeccionesCADIDO');

        select.innerHTML = '<option selected disabled>-- Elige una sección --</option>';

        secciones.forEach(seccion => {
            const option = document.createElement('option');
            option.value = seccion.id;
            option.textContent = seccion.id;
            option.dataset.seccion = seccion.seccion;
            select.appendChild(option);
        });

        // Evento para cambiar de selección
        //select.addEventListener('change', cargarSeries);
        // Event listener para cuando seleccionen una opción
        select.addEventListener('change', function () {
            const selectedOption = this.options[this.selectedIndex];
            document.getElementById('seccionObtenidaCADIDO').value = selectedOption.dataset.seccion; // <-- Mostramos la sección
            cargarSeriesCADIDO(); // Cargamos la tabla
        });

    } catch (error) {
        console.error('Error al cargar secciones:', error);
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', cargarSeccionesCADIDO);

// Llenar tabla con datos CADIDO
function cargarTablaCADIDO(series) {
    const tbody = document.getElementById('tabla-seriesCADIDO');
    tbody.innerHTML = ''; 

    series = Array.isArray(series) ? series : [];

    if (series.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">No hay registros para mostrar.</td></tr>';
        return;
    }

    const fragmento = document.createDocumentFragment();

    series.forEach(serie => {
        // 1. Llama a las funciones ayudantes para crear los elementos
        const filaPrincipal = crearFilaPrincipalCADIDO(serie);
        const filaDetalle = crearFilaDetalleCADIDO(serie);

        // 2. Conecta la lógica entre ambas filas (esto debe hacerse aquí)
        const icono = filaPrincipal.querySelector('.toggle-icon');
        filaDetalle.addEventListener('show.bs.collapse', () => icono.classList.add('rotado'));
        filaDetalle.addEventListener('hide.bs.collapse', () => icono.classList.remove('rotado'));
        
        // 3. Añade las filas al fragmento
        fragmento.appendChild(filaPrincipal);
        fragmento.appendChild(filaDetalle);
    });

    // 4. Añade todo el contenido al DOM de una sola vez para mejor rendimiento
    tbody.appendChild(fragmento);
}
function crearFilaPrincipalCADIDO(serie) {
    const fila = document.createElement('tr');
    //fila.className = 'fila-principal-CADIDO';
    fila.className = 'fila-principal-series fila-principal'; 
    
    // El ID de la fila de detalle se genera aquí para que el data-bs-target lo conozca
    const idFilaDetalle = `subseries-cadido-for-${serie.id}`;
    
    fila.innerHTML = `
        <td data-label="ID" data-bs-toggle="collapse" data-bs-target="#${idFilaDetalle}">
            <span class="toggle-icon">▶</span>
            ${serie.id}
        </td>
        <td data-label="Nombre" data-bs-toggle="collapse" data-bs-target="#${idFilaDetalle}">
            ${serie.nombre}
        </td>
        <td data-label="Código Sección" data-bs-toggle="collapse" data-bs-target="#${idFilaDetalle}">
            ${serie.codigoSeccion}
        </td>
        <td data-label="Editar">
            <button class="btn btn-warning btn-sm btn-editar-cadido" data-serie-id="${serie.id}" title="Editar Serie">
                <i class="bi bi-pencil"></i>
            </button>
        </td>
    `;

    // La lógica del botón de editar pertenece aquí, ya que solo afecta a esta fila
    const btnEditar = fila.querySelector('.btn-editar-cadido');
    btnEditar.addEventListener('click', (e) => {
        e.stopPropagation(); // Evita que el click colapse la fila
        const serieId = e.currentTarget.dataset.serieId;
        editarSeriesCADIDO(serieId); // Llama a tu función original para editar
    });

    return fila;
}

function crearFilaDetalleCADIDO(serie) {
    const fila = document.createElement('tr');
    fila.className = 'subseries collapse fila-detalle'; // Clases para el colapso de Bootstrap
    fila.id = `subseries-cadido-for-${serie.id}`; // Se le asigna el ID correspondiente

    // --- INICIO DE LA MODIFICACIÓN ---
    // Añadimos data-label a cada <td> para que el CSS sepa qué etiqueta mostrar
    const subseriesHtml = Array.isArray(serie.subseries) && serie.subseries.length > 0
        ? serie.subseries.map(sub => `
            <tr>
                <td data-label="Código">${sub.id}</td>
                <td data-label="Nombre Subserie">${sub.nombre}</td>
                <td data-label="Valor Doc.">${sub.valoresDocumentales}</td>
                <td data-label="AT">${sub.aniosTramite}</td>
                <td data-label="AC">${sub.aniosConcentracion}</td>
                <td data-label="Téc. Selección">${sub.tecnicaSeleccion}</td>
                <td data-label="Datos Personales">${sub.datosPersonales}</td>
                <td data-label="Observaciones">${sub.observaciones}</td>
            </tr>
        `).join('')
        : '<tr><td colspan="8" class="text-center">No hay subseries registradas.</td></tr>';

    fila.innerHTML = `
        <td colspan="4"> 
            <div class="subseries-content">
                <div class="p-3 border rounded"> 
                    <h6>Detalles de "${serie.nombre}"</h6>
                    <div class="table-responsive">
                        <table class="table table-striped table-nested-responsive">
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Nombre Subserie</th>
                                    <th>Valor Doc.</th>
                                    <th>AT</th>
                                    <th>AC</th>
                                    <th>Téc. Selección</th>
                                    <th>Datos Personales</th>
                                    <th>Observaciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${subseriesHtml}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </td>
    `;
    // --- FIN DE LA MODIFICACIÓN ---
    return fila;
}

// Cargar series según selección
async function cargarSeriesCADIDO() {
  const codigoSeccion = document.getElementById('selectSeccionesCADIDO').value;
  const tbody = document.getElementById("tabla-seriesCADIDO"); // Asegúrate de que esta sea la tabla donde quieres mostrar los datos
  
  try {
      const response = await fetch(`https://api-nijc7glupa-uc.a.run.app/series/series/codigoSeccion/${codigoSeccion}`);
      
      // Verificamos si la respuesta es exitosa
      if (!response.ok) {
          throw new Error(`Error al obtener datos: ${response.statusText}`);
      }

      const series = await response.json();

      // Limpiar la tabla antes de agregar los nuevos datos
      tbody.innerHTML = "";

      // Verificamos si no se encontraron series
      if (!series || series.length === 0) {
          // Crear una fila con el mensaje "No se encontraron datos"
          const fila = document.createElement("tr");
          fila.innerHTML = `<td colspan="6" class="text-center">No se encontraron datos</td>`;
          tbody.appendChild(fila);
          return;  // Salimos de la función si no hay datos
      }

      // Ordenar subseries dentro de cada serie
      ordenarSubseriesPorId(series);

      // Llenar la tabla con las series
      cargarTablaCADIDO(series);
  } catch (error) {
      //console.error('Error al cargar series:', error);
      
      // Crear una fila con el mensaje "No se encontraron datos" en caso de error
      const fila = document.createElement("tr");
      fila.innerHTML = `<td colspan="6" class="text-center text-danger">No se encontraron datos</td>`;
      tbody.innerHTML = ""; // Limpiar la tabla antes de agregar el mensaje
      tbody.appendChild(fila);
  }
}

//funcion de editar series
//Carga los datos al modal para editarlo
async function editarSeriesCADIDO(idSerie) {
    try {
        // Obtener los datos de la serie específica
        const response = await fetch(`https://api-nijc7glupa-uc.a.run.app/series/series/${idSerie}`);
        const serie = await response.json();
         // Ordenar las subseries dentro de la serie
         if (serie.subseries) {
          ordenarSubseriesPorIdModal(serie.subseries);
      }
      
        // Llenar el formulario con los datos obtenidos
        document.getElementById('codigoSerieCADIDO').value = serie.id;
        document.getElementById('nombreSerieCADIDO').value = serie.nombre;
        document.getElementById('codigoSeccionCADIDO').value = serie.codigoSeccion;

        // Llenar las subseries
        subseries = serie.subseries.map(sub => ({
            codigo: sub.id,
            nombre: sub.nombre,
            aniosConcentracion: sub.aniosConcentracion,
            aniosTramite: sub.aniosTramite,
            datosPersonales: sub.datosPersonales,
            tecnicaSeleccion:sub.tecnicaSeleccion,
            valoresDocumentales:sub.valoresDocumentales,
            observaciones:sub.observaciones
        }));
                
        actualizarSubseriesUICADIDO();

        /*
        //habilita el boton edotar y oculta el boton guardar
        const buttonGuardar = document.getElementById('guardarBtnSerie');
        const buttonModificar = document.getElementById('modificarBtnSerie');
        buttonGuardar.classList.add('d-none');//ocultar boton de Guardar 
        buttonModificar.classList.remove('d-none');//Mostrar boton de modificar
*/

        // Abrir el modal
        const modal = new bootstrap.Modal(document.getElementById('modalCADIDO'));
        modal.show();

    } catch (error) {
        console.error('Error al cargar la serie para editar:', error);
        alert('Error al cargar la serie para editar');
    }
}

function actualizarSubseriesUICADIDO() {
    const container = document.getElementById('subseriesContainerCADIDO');
    container.innerHTML = ''; // Limpiar el contenedor
  
    subseries.forEach((sub, index) => {
      // Usamos las propiedades del JSON: "id", "nombre", "aniosConcnetracion", "aniosTramite", "datosPersonales", "tencnicaSeleccion", "valoresDocumentales"
      container.insertAdjacentHTML('beforeend', crearSubserieCADIDOHTML(
        index,
        sub.codigo,
        sub.nombre,
        sub.aniosConcentracion,
        sub.aniosTramite,
        sub.datosPersonales,
        sub.tecnicaSeleccion,
        sub.valoresDocumentales,
        sub.observaciones
      ));
    });
  }

  function crearSubserieCADIDOHTML(index, codigo, nombre, aniosConcentracion, aniosTramite, datosPersonales, tecnicaSeleccion, valoresDocumentales, observaciones) {
    // Función auxiliar para asignar el atributo selected si el valor coincide
    const selectedOption = (optionValue, fieldValue) => {
      return optionValue === fieldValue ? 'selected' : '';
    };
  
    return `
      <div class="subserie-item border p-2 mb-2 rounded">
        <div class="row">
          <!-- Código Subserie (Editable) -->
          <div class="col-md-6">
            <label for="subserieCodigoCADIDO_${index}" class="form-label">Código Subserie</label>
            <input type="text" class="form-control fw-bold" id="subserieCodigoCADIDO_${index}" value="${codigo}" readonly>
          </div>
  
          <!-- Nombre de la Subserie (Editable) -->
          <div class="col-md-6">
            <label for="subserieNombreCADIDO_${index}" class="form-label">Nombre de la Subserie</label>
            <input type="text" class="form-control fw-bold" id="subserieNombreCADIDO_${index}" value="${nombre}" readonly>
          </div>
          <br>  
          <!-- Valor Documental -->
          <div class="col-md-12">
            <label for="valorDocumentalCADIDO_${index}" class="form-label">Valor Documental</label>
            <select class="form-select" id="valorDocumentalCADIDO_${index}" required>
              <option value="">Seleccione una opción</option>
              <option value="Administrativo" ${selectedOption("Administrativo", valoresDocumentales)}>Administrativo</option>
              <option value="Legal" ${selectedOption("Legal", valoresDocumentales)}>Legal</option>
              <option value="Contable" ${selectedOption("Contable", valoresDocumentales)}>Contable</option>
            </select>
          </div>
  
          <!-- Años de Trámite -->
          <div class="col-md-6">
            <label for="aniosTramiteCADIDO_${index}" class="form-label">Años de trámite</label>
            <select class="form-select" id="aniosTramiteCADIDO_${index}" required>
              <option value="">Seleccione una opción</option>
              ${[1,2,3,4,5,6,7,8,9,10]
                .map(num => `<option value="${num}" ${selectedOption(String(num), String(aniosTramite))}>${num}</option>`)
                .join('')}
            </select>
          </div>
  
          <!-- Años de Concentración -->
          <div class="col-md-6">
            <label for="aniosConcentracionCADIDO_${index}" class="form-label">Años de concentración</label>
            <select class="form-select" id="aniosConcentracionCADIDO_${index}" required>
              <option value="">Seleccione una opción</option>
              ${[1,2,3,4,5,6,7,8,9,10]
                .map(num => `<option value="${num}" ${selectedOption(String(num), String(aniosConcentracion))}>${num}</option>`)
                .join('')}
            </select>
          </div>
  
          <!-- Técnicas de Selección -->
          <div class="col-md-6">
            <label for="tecnicasSeleccionCADIDO_${index}" class="form-label">Técnicas de Selección</label>
            <select class="form-select" id="tecnicasSeleccionCADIDO_${index}" required>
              <option value="">Seleccione una opción</option>
              <option value="Baja" ${selectedOption("Baja", tecnicaSeleccion)}>Baja</option>
              <option value="Historico" ${selectedOption("Historico", tecnicaSeleccion)}>Histórico</option>
            </select>
          </div>
  
          <!-- Datos Personales -->
          <div class="col-md-6">
            <label for="datosPersonalesCADIDO_${index}" class="form-label">Datos Personales</label>
            <select class="form-select" id="datosPersonalesCADIDO_${index}" required>
              <option value="">Seleccione una opción</option>
              <option value="Si" ${selectedOption("Si", datosPersonales)}>Si</option>
              <option value="No" ${selectedOption("No", datosPersonales)}>No</option>
            </select>
          </div>
  
          <!-- Observaciones -->
          <div class="col-md-12">
            <label for="observacionesCADIDO_${index}" class="form-label">Observaciones</label>
            <input type="text" class="form-control" id="observacionesCADIDO_${index}" value="${observaciones ? observaciones : ''}">
          </div>
        </div>
      </div>
    `;
  }
  
  //guardar las modificaciones mediante el update
  async function modificarSerieCADIDO() {
    console.log("Ejecutando modificarSerieCADIDO...");

    const payload = {
        nombre: document.getElementById('nombreSerieCADIDO').value,
        codigoSeccion: document.getElementById('selectSeccionesCADIDO').value,
        subseries: []
    };

    // Obtener todas las subseries
    const subserieElements = document.querySelectorAll('.subserie-item');
    console.log(`Subseries encontradas: ${subserieElements.length}`);

    let subseriesValidas = true; // Variable para verificar si todas las subseries tienen código y nombre

    subserieElements.forEach((element, index) => {
        const codigoSubserie = document.getElementById(`subserieCodigoCADIDO_${index}`);
        const nombreSubserie = document.getElementById(`subserieNombreCADIDO_${index}`);
        const aniosTramiteField = document.getElementById(`aniosTramiteCADIDO_${index}`);
        const datosPersonalesField = document.getElementById(`datosPersonalesCADIDO_${index}`);
        const valoresDocumentalesField = document.getElementById(`valorDocumentalCADIDO_${index}`);
        const aniosConcentracionField = document.getElementById(`aniosConcentracionCADIDO_${index}`);
        const tecnicaSeleccionField = document.getElementById(`tecnicasSeleccionCADIDO_${index}`);
        const observacionesField = document.getElementById(`observacionesCADIDO_${index}`);

        console.log(`Procesando subserie ${index}...`);

        // Validación obligatoria para Código y Nombre
        if (!codigoSubserie.value.trim() || !nombreSubserie.value.trim()) {
            console.warn(`Subserie ${index} no tiene Código o Nombre. No se agregará.`);
            subseriesValidas = false;
            return; // Saltar esta subserie
        }

        // Si algún campo opcional está vacío, asignar un valor por defecto
        payload.subseries.push({
            codigo: codigoSubserie.value,
            nombre: nombreSubserie.value,
            aniosTramite: aniosTramiteField.value || "0", // Valor por defecto si está vacío
            datosPersonales: datosPersonalesField.value || "No especificado",
            valoresDocumentales: valoresDocumentalesField.value || "No especificado",
            aniosConcentracion: aniosConcentracionField.value || "0",
            tecnicaSeleccion: tecnicaSeleccionField.value || "No especificado",
            observaciones: observacionesField.value || "Sin observaciones"
        });

        console.log(`Subserie ${index} agregada al payload.`);
    });

    // Si ninguna subserie es válida, mostrar un mensaje y cancelar el envío
    if (!subseriesValidas) {
        alert("Al menos una subserie no tiene Código o Nombre. Corrige esto antes de actualizar.");
        return;
    }

    console.log("Payload final:", JSON.stringify(payload, null, 2));

    try {
        const codigoSerie = document.getElementById('codigoSerieCADIDO').value;
        const response = await fetch(`https://api-nijc7glupa-uc.a.run.app/series/seriesCADIDO/${codigoSerie}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            console.log("Actualización exitosa.");
            //alert("Serie actualizada correctamente.");
            // Mostrar modal de éxito
            const modalExito = new bootstrap.Modal(document.getElementById('successModal'));
            modalExito.show()
            //cerrar el modal del CADIDO
            const modalCADIDO = bootstrap.Modal.getInstance(document.getElementById('modalCADIDO'));
            modalCADIDO.hide();

            const codigoActualCADIDO = document.getElementById('selectSeccionesCADIDO').value;
            await cargarSeriesCADIDOManual(codigoActualCADIDO);

        } else {
            const errorData = await response.json();
            console.error("Error al modificar:", errorData);
            alert(`Error al modificar la serie: ${errorData.message || 'Error desconocido'}`);
        }
    } catch (error) {
        console.error("Error en la conexión:", error);
        alert("Error de conexión con el servidor.");
    }
}

  //Carga de nuevo la tabla despues de actualizar, de acuerdo a la seccion seleccionada con anterioridad 
async function cargarSeriesCADIDOManual(codigoSeccion) {
  try {
      const response = await fetch(`https://api-nijc7glupa-uc.a.run.app/series/series/codigoSeccion/${codigoSeccion}`);
      const series = await response.json();

      // Ordenar subseries dentro de cada serie
      ordenarSubseriesPorId(series);

      cargarTablaCADIDO(series);
  } catch (error) {
      console.error('Error al recargar series:', error);
  }
}

function exportarCADIDOExcel() {
  // 1. Obtener datos generales
  const codigoSeccion = document.getElementById('selectSeccionesCADIDO').value;
  const nombreSeccion = document.getElementById('seccionObtenidaCADIDO').value;
  
  // 2. Obtener datos de la tabla
  const filas = Array.from(document.querySelectorAll("#tabla-seriesCADIDO tr.fila-principal"));
  
  // 3. Estructurar datos para Excel
  const datos = [
      ["CATÁLOGO DE DISPOSICIÓN DOCUMENTAL"],
      ["Código Sección:", codigoSeccion],
      ["Nombre Sección:", nombreSeccion],
      [], // Fila vacía como separador
      ["ID Serie", "Nombre Serie","Valor documental", "Años de trámite","Años de concentración","Técnica de selección","Datos personales","Observaciones"] // Encabezados
  ];

  // 4. Procesar cada fila
  filas.forEach(fila => {
      const celdas = fila.cells;
      const filaDatos = [
          celdas[0].textContent.trim(),  // ID
          celdas[1].textContent.trim()  // Nombre
          //celdas[2].textContent.trim()   // Código Sección
      ];
      
      datos.push(filaDatos);

      // 5. Procesar subseries si existen
      const filaSubseries = fila.nextElementSibling;
      if (filaSubseries?.classList.contains('subseries')) {
          const subFilas = filaSubseries.querySelectorAll('tr');
          
          subFilas.forEach(subFila => {
              const subCeldas = subFila.cells;
              datos.push([
                  `→ ${subCeldas[0].textContent.trim()}`, // ID con indicador de subserie
                  subCeldas[1].textContent.trim(), // nombre de la serie y subserie
                  subCeldas[2].textContent.trim(), 
                  subCeldas[3].textContent.trim(), 
                  subCeldas[4].textContent.trim(), 
                  subCeldas[5].textContent.trim(), 
                  subCeldas[6].textContent.trim(), 
                  subCeldas[7].textContent.trim(), 
                  '' // Código sección vacío para subseries
              ]);
          });
      }
  });

  // 6. Crear archivo Excel
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(datos);
  
  // Configuración adicional
  ws["!cols"] = [
      { wch: 25 }, // Ancho columna ID
      { wch: 50 }, // Ancho columna Nombre
      { wch: 20 },  // Ancho columna Código
      { wch: 20 },  // Años de trámite
      { wch: 25 }, // Años de concentración
      { wch: 20 }, // Tecnica de selección
      { wch: 20 }, // Datos personales
      { wch: 20 } // Obsevación
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Reporte");
  XLSX.writeFile(wb, `CADIDO_${codigoSeccion}.xlsx`);
}


function ordenarSubseriesPorId(series) {
  series.forEach(serie => {
      if (serie.subseries) {
          serie.subseries.sort((a, b) => {
              const numA = extraerNumeroSubserie(a.id);
              const numB = extraerNumeroSubserie(b.id);
              return numA - numB;
          });
      }
  });
}

// Función para extraer el número final del ID de la subserie
function extraerNumeroSubserie(id) {
  const partes = id.split(".");
  return parseInt(partes[partes.length - 1], 10) || 0;
}


// Función para ordenar las subseries por ID
function ordenarSubseriesPorIdModal(subseries) {
  subseries.sort((a, b) => {
      const numA = extraerNumeroSubserie(a.id);
      const numB = extraerNumeroSubserie(b.id);
      return numA - numB;
  });
}


