let idEditar = null; // Variable para almacenar el id del registro a editar
obtenerDatos(); //carga la tabla al principio

// Función para obtener y mostrar los datos
async function obtenerDatos() {
    try {
        const respuesta = await fetch('https://api-nijc7glupa-uc.a.run.app/secciones/cuadroGeneral');

        if (!respuesta.ok) {
            throw new Error(`Error HTTP: ${respuesta.status}`);
        }

        const datos = await respuesta.json();
        cargarTablaCuadro(datos);

    } catch (error) {
        console.error('Error al obtener datos:', error);
        document.getElementById('datos').innerHTML = "Error al cargar los datos";
    }
}

function cargarTablaCuadro(datos) {
    const contenedor = document.getElementById('datos');
    contenedor.innerHTML = ''; // Limpiamos el contenedor

    if (!Array.isArray(datos) || datos.length === 0) {
        contenedor.innerHTML = '<p class="text-center">No hay datos disponibles.</p>';
        return;
    }

    // 1. Creamos los elementos principales de la tabla
    const tabla = document.createElement('table');
    tabla.className = 'table table-hover'; // Añadimos las clases que queramos
    tabla.id = 'miTabla';

    const thead = document.createElement('thead');
    thead.className = 'table-dark';
    thead.innerHTML = `
        <tr>
            <th>Código</th>
            <th>Sección</th>
            <th>Función</th>
            <th>Acción</th>
        </tr>
    `;

    const tbody = document.createElement('tbody');
    
    // 2. Usamos un DocumentFragment para mejor rendimiento
    const fragmento = document.createDocumentFragment();

    // 3. Iteramos y llamamos a la función ayudante para cada fila
    datos.forEach(item => {
        const fila = crearFilaCuadroGeneral(item);
        fragmento.appendChild(fila);
    });

   // 4. Ensamblamos la tabla
    tbody.appendChild(fragmento);
    tabla.appendChild(thead);
    tabla.appendChild(tbody);

    // 5. ¡AQUÍ ESTÁ LA CORRECCIÓN! Creamos el contenedor con NUESTRA clase reutilizable
    const contenedorTabla = document.createElement('div');
    
    // Le añadimos ambas clases para que sea responsive Y tenga los bordes redondeados
    contenedorTabla.className = 'table-responsive table-rounded-container';

    // 6. Metemos la tabla completa que ya construimos dentro de este nuevo div
    contenedorTabla.appendChild(tabla);
    
    // 7. Añadimos el contenedor completo (con la tabla adentro) al div principal #datos
    contenedor.appendChild(contenedorTabla);
}

function crearFilaCuadroGeneral(item) {
    // Creamos el elemento de la fila
    const fila = document.createElement('tr');
    
    // --- INICIO DE LA MODIFICACIÓN ---

    // PASO 1: Asignamos la clase para que el CSS la reconozca como una tarjeta en móviles.
    // Añadimos un nombre específico y el nombre común.
    fila.className = 'fila-cuadro-general fila-principal'; 

    // PASO 2: Añadimos el atributo data-label a cada celda <td>
    // El texto debe coincidir con el encabezado de la columna.
    fila.innerHTML = `
        <td data-label="Código">${item.id}</td>
        <td data-label="Sección">${item.seccion}</td>
        <td data-label="Función">${item.funcion}</td>
        <td data-label="Acción">
            <button class="btn btn-warning btn-sm btn-editar-cuadro" title="Editar">
                <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-danger btn-sm btn-eliminar-cuadro" title="Eliminar">
                <i class="bi bi-trash"></i>
            </button>
        </td>

    `;
    // --- FIN DE LA MODIFICACIÓN ---

    // La asignación de eventos se mantiene igual, ya es correcta.
    const btnEditar = fila.querySelector('.btn-editar-cuadro');
    btnEditar.addEventListener('click', () => {
        editarDatos(item.id);
    });

    const btnEliminar = fila.querySelector('.btn-eliminar-cuadro');
    btnEliminar.addEventListener('click', () => {
        eliminarDatosSecciones(item.id);
    });

    return fila;
}

//Función para guardar datos
async function guardarSecciones() {
    const codigo = document.getElementById('idCuadroGeneral').value;
    const seccion = document.getElementById('seccion').value;
    const funcion = document.getElementById('funcion').value;

    const datos = { codigo, seccion, funcion };
    const url = idEditar
        ? `https://api-nijc7glupa-uc.a.run.app/secciones/cuadroGeneral/${idEditar}`
        : 'https://api-nijc7glupa-uc.a.run.app/secciones/cuadroGeneral';
    const metodo = idEditar ? 'PUT' : 'POST';

    try {
        const respuesta = await fetch(url, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });

        if (!respuesta.ok) {
            throw new Error(`Error HTTP: ${respuesta.status}`);
        }
        idEditar = null; // Resetear idEditar después de la acción
        //alert('Datos guardados con éxito');
        document.querySelector("#modalCuadro form").reset();

        // Mostrar el modal de éxito
        let modalExito = new bootstrap.Modal(document.getElementById('successModal'));
        modalExito.show();
        document.getElementById('idCuadroGeneral').disabled = false;
        // Cerrar el modal
        obtenerDatos();
        let modal = bootstrap.Modal.getInstance(document.getElementById('modalCuadro'));
        modal.hide();

    } catch (error) {
        console.error('Error al guardar datos:', error);
        alert('Error al guardar los datos');
    }
}

//Función para editar datos
function editarDatos(id) {
    idEditar = id;
    document.getElementById('idCuadroGeneral').disabled = true;
    // Obtener los datos del registro y llenar el formulario
    fetch(`https://api-nijc7glupa-uc.a.run.app/secciones/cuadroGeneral/${id}`)
        .then(res => res.json())
        .then(data => {
            document.getElementById('idCuadroGeneral').value = data.id;
            document.getElementById('seccion').value = data.seccion;
            document.getElementById('funcion').value = data.funcion;
            document.getElementById('guardarBtn').textContent = 'Modificar'; // Cambiar el texto del botón

            let modal = new bootstrap.Modal(document.getElementById('modalCuadro'));
            modal.show();
            document.getElementById('guardarBtn').textContent = 'Guardar';
            ;
        })
        .catch(err => console.error('Error al obtener los datos para editar:', err));
}

//Función para eliminar datos 
async function eliminarDatosSecciones(id) {
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
            const respuesta = await fetch(`https://api-nijc7glupa-uc.a.run.app/secciones/cuadroGeneral/${id}`, {
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
            obtenerDatos();

        } catch (error) {
            console.error('Error al eliminar:', error);
            Swal.fire("Error", "No se pudo eliminar el registro.", "error");
        }
    }
}

//reset del formulario
function limpiarFormulario() {
    document.getElementById('idCuadroGeneral').disabled = false; // Habilitar
    document.getElementById('idCuadroGeneral').value = "";
    document.getElementById('seccion').value = "";
    document.getElementById('guardarBtn').textContent = 'Guardar'; // Resetear el texto del botón
}

// Mostrar el modal de registro corrrecto
function abrirModal() {
    const modal = document.getElementById('successModal');
    modal.style.display = 'block';
    modal.removeAttribute('inert');  // Hacer el modal accesible
}

// Cerrar el modal
function cerrarModal() {
    const modal = document.getElementById('successModal');
    modal.style.display = 'none';
    modal.setAttribute('inert', '');  // Hacer el modal inaccesible
}

//exportar en excel
function exportarExcel() {
    // Obtener la tabla HTML
    var tabla = document.querySelector("#miTabla");

    // Crear un array de filas (tomando solo las tres primeras columnas)
    var filasExcel = [];

    // Agregar los títulos personalizados como la primera fila
    filasExcel.push(["Cuadro General de Clasificación Archivística"]);

    // Crear un array para estilos de celdas (bordes)
    var estilos = [];

    // Estilo de borde
    var estiloBorde = {
        border: {
            top: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
        }
    };

    // Recorrer cada fila de la tabla y agregar solo las tres primeras celdas
    for (var i = 0; i < tabla.rows.length; i++) { // Empezamos en 1 para omitir el encabezado
        var celdas = tabla.rows[i].cells;
        filasExcel.push([celdas[0].innerText, celdas[1].innerText, celdas[2].innerText]);

        // Añadir los estilos de las celdas
        estilos.push([estiloBorde, estiloBorde, estiloBorde]);
    }

    // Crear un libro de trabajo con los datos
    var wb = XLSX.utils.book_new();

    // Crear la hoja con bordes y estilos
    var ws = XLSX.utils.aoa_to_sheet(filasExcel, { cellStyles: estilos }); // Convertir las filas a un formato que Excel pueda leer con los estilos

    // Añadir la hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, "Hoja 1");

    // Exportar el libro de trabajo a un archivo Excel
    XLSX.writeFile(wb, "tabla_exportada.xlsx");
}


document.addEventListener('DOMContentLoaded', () => {
    // ... (tus otros listeners que ya tienes) ...

    // Asignar eventos a los botones de la sección Cuadro General
    const btnExportarCuadro = document.getElementById('btnExportarCuadro');
    if(btnExportarCuadro) btnExportarCuadro.addEventListener('click', exportarExcel);

    const btnCalendarioCuadro = document.getElementById('btnCalendarioCuadro');
    if(btnCalendarioCuadro) btnCalendarioCuadro.addEventListener('click', mostrarCalendario); // Asegúrate que la función se llame así

    const btnRegistrarCuadro = document.getElementById('btnRegistrarCuadro');
    if(btnRegistrarCuadro) btnRegistrarCuadro.addEventListener('click', limpiarFormulario);
});