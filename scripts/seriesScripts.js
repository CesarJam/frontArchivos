// Cargar opciones del dropdown inicial
async function cargarSecciones() {
    try {
        const response = await fetch('https://api-nijc7glupa-uc.a.run.app/secciones/cuadroGeneral');
        const secciones = await response.json();
        const select = document.getElementById('selectSecciones');

        select.innerHTML = '<option selected disabled>-- Elige una sección --</option>';

        secciones.forEach(seccion => {
            const option = document.createElement('option');
            option.value = seccion.id;
            option.textContent = seccion.id;
            option.dataset.seccion = seccion.seccion;
            select.appendChild(option);
        });

        // Evento para cambiar de selección
        select.addEventListener('change', cargarSeries);
        // Event listener para cuando seleccionen una opción
        select.addEventListener('change', function () {
            //const selectedItem = data.find(item => item.id === this.value);
            const selectedOption = this.options[this.selectedIndex];
            //document.getElementById('seccionObtenida').value = selectedItem.seccion;
            //document.getElementById('funcionObtenida').value = selectedItem.funcion;
            document.getElementById('seccionObtenida').value = selectedOption.dataset.seccion; // <-- Mostramos la sección
            cargarSeries(); // Cargamos la tabla
        });

    } catch (error) {
        console.error('Error al cargar secciones:', error);
    }
}

// Cargar series según selección
async function cargarSeries() {
    const codigoSeccion = document.getElementById('selectSecciones').value;
    const tbody = document.getElementById("tabla-series"); // Asegúrate de que esta sea la tabla correcta

    try {
        const response = await fetch(`https://api-nijc7glupa-uc.a.run.app/series/series/codigoSeccion/${codigoSeccion}`);

        if (!response.ok) {
            throw new Error(`Error al obtener datos: ${response.statusText}`);
        }

        const series = await response.json();

        // Limpiar la tabla antes de agregar los nuevos datos
        tbody.innerHTML = "";

        // Verificar si la consulta no devolvió resultados
        if (!series || series.length === 0) {
            const fila = document.createElement("tr");
            fila.innerHTML = `<td colspan="6" class="text-center">No se encontraron datos</td>`;
            tbody.appendChild(fila);
            return;
        }

        // Ordenar subseries dentro de cada serie
        ordenarSubseriesPorId(series);

        // Llenar la tabla con las series
        llenarTabla(series);
    } catch (error) {
        //console.error('Error al cargar series:', error);

        // Limpiar la tabla antes de mostrar el mensaje de error
        tbody.innerHTML = "";
        
        // Crear una fila con el mensaje "No se encontraron datos"
        const fila = document.createElement("tr");
        fila.innerHTML = `<td colspan="6" class="text-center text-danger">No se encontraron datos</td>`;
        tbody.appendChild(fila);
    }
}

// Llenar tabla con datos
function llenarTabla(series) {
    const tbody = document.getElementById('tabla-series');
    tbody.innerHTML = ''; // Limpiar tabla anterior

    // Asegurarse de que series sea un array, incluso si es null o undefined
    series = Array.isArray(series) ? series : [];

    series.forEach(serie => {
        // Fila principal
        const filaPrincipal = document.createElement('tr');
        filaPrincipal.className = 'fila-principal';
        filaPrincipal.innerHTML = `
            <td>
                <span class="toggle-icon">▶</span>
                ${serie.id}
            </td>
            <td>${serie.nombre}</td>
            <td>${serie.codigoSeccion}</td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="editarSeries('${serie.id}')"><i class="bi bi-pencil"></i></button>
            </td>     
            <td>
                <button class="btn btn-danger btn-sm" onclick="eliminarDatos('${serie.id}')"><i class="bi bi-trash"></i></button>
            </td>
        `;

        // Fila de subseries
        const filaSubseries = document.createElement('tr');
        filaSubseries.className = 'subseries collapse';
        filaSubseries.innerHTML = `
            <td colspan="3">
                <div class="subseries-content">
                    <table class="table table-sm mb-0">
                        <tbody>
                            ${serie.subseries.map(sub => `
                                <tr>
                                    <td style="width: 10%">${sub.id}</td>
                                    <td style="width: 80%">${sub.nombre}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </td>
        `;

        // Evento para expandir/colapsar
        filaPrincipal.addEventListener('click', () => {
            const icono = filaPrincipal.querySelector('.toggle-icon');
            icono.style.transform = icono.style.transform === 'rotate(90deg)'
                ? 'rotate(0deg)'
                : 'rotate(90deg)';

            new bootstrap.Collapse(filaSubseries, { toggle: true });
        });

        tbody.appendChild(filaPrincipal);
        tbody.appendChild(filaSubseries);
    });
}

// Inicialización
document.addEventListener('DOMContentLoaded', cargarSecciones);

// Estilos
const style = document.createElement('style');
style.textContent = `
    .fila-principal { 
        cursor: pointer; 
        background-color: #fff;
    }
    .fila-principal:hover {
        background-color: #f8f9fa;
    }
    .toggle-icon {
        transition: transform 0.3s ease;
        display: inline-block;
        margin-right: 8px;
    }
    .subseries td {
        padding: 0 !important;
        background-color: #e9ecef;
    }
    .subseries-content {
        padding: 12px;
    }
`;
document.head.appendChild(style);

//Datos de las subseries que se manejan en el modal
// Variables
let subseries = [];

// Guardar datos

async function guardarSerie() {
    // Obtener valores principales
    const payload = {
        codigo: document.getElementById('codigoSerie').value,
        nombre: document.getElementById('nombreSerie').value,
        codigoSeccion: document.getElementById('selectSecciones').value,
        subseries: []
    };

    // Recoger subseries
    subseries.forEach((_, index) => {
        payload.subseries.push({
            codigo: document.getElementById(`subserieCodigo${index}`).value,
            nombre: document.getElementById(`subserieNombre${index}`).value
        });
    });

    try {
        const response = await fetch('https://api-nijc7glupa-uc.a.run.app/series/series', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            //alert('Serie guardada exitosamente!');

            let modalExito = new bootstrap.Modal(document.getElementById('successModal'));
            modalExito.show();

            const modal = bootstrap.Modal.getInstance(document.getElementById('modalSeries'));
            modal.hide();

            limpiarFormularioSeries();

            // Obtener código de sección actual
            const codigoActual = document.getElementById('selectSecciones').value;

            // Recargar datos
            await cargarSeriesManual(codigoActual);
        } else {
            alert('Error al guardar la serie');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
}

//Carga de nuevo la tabla de acuerdo a la seccion seleccionada con anterioridad 
async function cargarSeriesManual(codigoSeccion) {
    try {
        const response = await fetch(`https://api-nijc7glupa-uc.a.run.app/series/series/codigoSeccion/${codigoSeccion}`);
        const series = await response.json();
        // Ordenar subseries dentro de cada serie
        ordenarSubseriesPorId(series);

        llenarTabla(series);
    } catch (error) {
        console.error('Error al recargar series:', error);
    }
}
// Actualizar código sección en el modal
document.getElementById('selectSecciones').addEventListener('change', function () {
    document.getElementById('codigoSeccion').value = this.value;
});

// Resetear formulario al cerrar
function limpiarFormularioSeries() {
    //document.getElementById('id').disabled = false; // Habilitar
    //document.getElementById('id').value = "";
    document.getElementById('codigoSerie').value = "";
    document.getElementById('nombreSerie').value = "";
    //document.getElementById('codigoSeccion').value = "";
    // Limpiar subseries
    subseries = []; // Vaciar el array
    document.getElementById('subseriesContainer').innerHTML = ""; // Limpiar HTML
    // O usando la función que ya tienes:
    actualizarSubseriesUI();

    //document.getElementById('guardarBtn').textContent = 'Guardar'; // Resetear el texto del botón
}

// Plantilla de subserie actualizada
function crearSubserieHTML(index, codigoGenerado, nombre) {
    return `
      <div class="subserie-item border p-2 mb-2 rounded">
        <div class="row g-2">
          <div class="col-md-5">
            <input type="text" class="form-control form-control-sm" 
                   placeholder="Código Subserie" 
                   id="subserieCodigo${index}"
                   value="${codigoGenerado}">
          </div>
          <div class="col-md-5">
            <input type="text" class="form-control form-control-sm" 
                   placeholder="Nombre Subserie" 
                   id="subserieNombre${index}"
                   value="${nombre || ''}"> <!-- Mantener el valor existente -->
          </div>
          <div class="col-md-2">
            <button type="button" class="btn btn-sm btn-danger w-100" 
                    onclick="eliminarSubserie(${index})">Eliminar
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
}

// Plantilla de subserie
// Funciones para manejar subseries
function agregarSubserie() {
    const codigoBase = document.getElementById('codigoSerie').value;

    if (!codigoBase) {
        alert('Primero ingresa el código de la serie principal');
        return;
    }

    const cantidadSubseries = subseries.length;
    const nuevoNumero = cantidadSubseries + 1;
    const nuevoCodigo = `${codigoBase}.${nuevoNumero}`;

    const index = subseries.length;
    subseries.push({ codigo: nuevoCodigo, nombre: '' });

    document.getElementById('subseriesContainer').insertAdjacentHTML(
        'beforeend', crearSubserieHTML(index, nuevoCodigo)
    );

    // Enfocar el campo de nombre de la subserie recién creada
    document.getElementById(`subserieNombre${index}`).focus();
}

// Funciones para manejar (eliminar) subseries

function eliminarSubserie(index) {
    // Guardar los valores actuales de los inputs
    guardarNombresTemporales();

    subseries.splice(index, 1);
    actualizarSubseriesUI();

    // Re-generar códigos después de eliminar
    actualizarCodigosSubseries();
}

function guardarNombresTemporales() {
    subseries.forEach((sub, idx) => {
        const inputNombre = document.getElementById(`subserieNombre${idx}`);
        if (inputNombre) { // Verificar si el elemento existe
            sub.nombre = inputNombre.value;
        }
    });
}

function actualizarCodigosSubseries() {
    const codigoBase = document.getElementById('codigoSerie').value;
    subseries.forEach((sub, idx) => {
        const nuevoCodigo = `${codigoBase}.${idx + 1}`;
        sub.codigo = nuevoCodigo;
    });
}

function actualizarSubseriesUI() {
    const container = document.getElementById('subseriesContainer');
    container.innerHTML = ''; // Limpiar el contenedor

    subseries.forEach((sub, index) => {
        container.insertAdjacentHTML('beforeend', crearSubserieHTML(index, sub.codigo, sub.nombre));
    });
}

//funcion elimnar series con todo y subseries
//Función para eliminar datos 
async function eliminarDatos(id) {
    // Confirmación con SweetAlert2 (librería de alertas atractivas)
    const confirmacion = await Swal.fire({
        title: "¿Estás seguro?",
        text: `Eliminarás el registro con ID: ${id}`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
    });

    if (confirmacion.isConfirmed) {
        try {
            const respuesta = await fetch(`https://api-nijc7glupa-uc.a.run.app/series/series/${id}`, {
                method: 'DELETE'
            });

            if (!respuesta.ok) {
                throw new Error(`Error HTTP: ${respuesta.status}`);
            }

            // Mostrar alerta de éxito
            Swal.fire({
                title: "Eliminado",
                text: "El registro se eliminó correctamente.",
                icon: "success",
                confirmButtonColor: "#3085d6"
            });

            // Recargar los datos en la tabla
            cargarSeries();

        } catch (error) {
            console.error('Error al eliminar:', error);
            Swal.fire("Error", "No se pudo eliminar el registro.", "error");
        }
    }
}

//funcion de editar series
//Carga los datos al modal para editarlo
async function editarSeries(idSerie) {
    try {
        // Obtener los datos de la serie específica
        const response = await fetch(`https://api-nijc7glupa-uc.a.run.app/series/series/${idSerie}`);
        const serie = await response.json();
        
          // Ordenar las subseries dentro de la serie
          if (serie.subseries) {
            ordenarSubseriesPorIdModal(serie.subseries);
        }

        // Llenar el formulario con los datos obtenidos
        document.getElementById('codigoSerie').value = serie.id;
        document.getElementById('nombreSerie').value = serie.nombre;
        document.getElementById('codigoSeccion').value = serie.codigoSeccion;

        // Llenar las subseries
        subseries = serie.subseries.map(sub => ({
            codigo: sub.id,
            nombre: sub.nombre
        }));
        actualizarSubseriesUI();

        //habilita el boton edotar y oculta el boton guardar
        const buttonGuardar = document.getElementById('guardarBtnSerie');
        const buttonModificar = document.getElementById('modificarBtnSerie');
        buttonGuardar.classList.add('d-none');//ocultar boton de Guardar 
        buttonModificar.classList.remove('d-none');//Mostrar boton de modificar


        // Abrir el modal
        const modal = new bootstrap.Modal(document.getElementById('modalSeries'));
        modal.show();

    } catch (error) {
        console.error('Error al cargar la serie para editar:', error);
        alert('Error al cargar la serie para editar');
    }
}

//guardar las modificaciones mediante el update
async function modificarSerie() {
    // Obtener valores principales
    const payload = {
        nombre: document.getElementById('nombreSerie').value, // Nombre de la serie
        codigoSeccion: document.getElementById('selectSecciones').value, // Código de sección
        subseries: [] // Array de subseries
    };

    // Recoger subseries
    subseries.forEach((sub, index) => {
        const codigoSubserie = document.getElementById(`subserieCodigo${index}`);
        const nombreSubserie = document.getElementById(`subserieNombre${index}`);

        if (codigoSubserie && nombreSubserie) { // Verificar si los elementos existen
            payload.subseries.push({
                codigo: codigoSubserie.value, // Código de la subserie
                nombre: nombreSubserie.value // Nombre de la subserie
            });
        }
    });

    console.log("Payload completo:", payload); // Verificar el payload antes de enviarlo

    try {
        const codigoSerie = document.getElementById('codigoSerie').value; // Código de la serie
        const response = await fetch(`https://api-nijc7glupa-uc.a.run.app/series/series/${codigoSerie}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            // Mostrar modal de éxito
            const modalExito = new bootstrap.Modal(document.getElementById('successModal'));
            modalExito.show();

            // Limpiar el formulario
            limpiarFormularioSeries();

            // Cerrar el modal de series
            const modalSeries = bootstrap.Modal.getInstance(document.getElementById('modalSeries'));
            modalSeries.hide();



            // Recargar datos
            const codigoActual = document.getElementById('selectSecciones').value;
            await cargarSeriesManual(codigoActual);
        } else {
            const errorData = await response.json(); // Obtener detalles del error
            console.error('Error al modificar la serie:', errorData);
            alert(`Error al modificar la serie: ${errorData.message || 'Error desconocido'}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
}

//Hbailitar el boton guardar del modal
async function habilitarBotonGuardar() {
    const buttonGuardar = document.getElementById('guardarBtnSerie');
    const buttonModificar = document.getElementById('modificarBtnSerie');
    buttonGuardar.classList.remove('d-none');//Mostrar boton de Guardar 
    buttonModificar.classList.add('d-none');//Ocultar boton de modificar
    limpiarFormularioSeries(); //limpiamos el formulario
}

function exportarSeriesExcel() {
    // 1. Obtener datos generales
    const codigoSeccion = document.getElementById('selectSecciones').value;
    const nombreSeccion = document.getElementById('seccionObtenida').value;

    // 2. Obtener datos de la tabla
    const filas = Array.from(document.querySelectorAll("#tabla-series tr.fila-principal"));

    // 3. Estructurar datos para Excel
    const datos = [
        ["Series Documentales"],
        ["Código Sección:", codigoSeccion],
        ["Nombre Sección:", nombreSeccion],
        [], // Fila vacía como separador
        ["ID Serie", "Nombre Serie"] // Encabezados
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
                    subCeldas[1].textContent.trim(),
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
        { wch: 20 }  // Ancho columna Código
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Reporte");
    XLSX.writeFile(wb, `Series_${codigoSeccion}.xlsx`);
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
  