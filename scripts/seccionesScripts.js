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
        mostrarDatos(datos);

    } catch (error) {
        console.error('Error al obtener datos:', error);
        document.getElementById('datos').innerHTML = "Error al cargar los datos";
    }
}

function mostrarDatos(datos) {
    const contenedor = document.getElementById('datos');

    if (!Array.isArray(datos) || datos.length === 0) {
        contenedor.innerHTML = "No hay datos disponibles";
        return;
    }

    let tabla = '<table class="table" id="miTabla"><thead><tr>';

    tabla += "<th>Código</th>";
    tabla += "<th>Sección</th>";
    tabla += "<th>Función</th>";
    tabla += "<th>Editar</th>";

    tabla += "<th>Eliminar</th>";
    tabla += '</tr></thead><tbody>';

    // Llenar la tabla con los datos
    datos.forEach(item => {
        tabla += '<tr>';
        // Mostrar los campos en el orden deseado: id, seccion, funcion
        tabla += `<td>${item.id}</td>`;
        tabla += `<td>${item.seccion}</td>`;
        tabla += `<td>${item.funcion}</td>`;
        //Botón editar
        tabla += `<td><button class="btn btn-warning btn-sm" onclick="editarDatos('${item.id}')"><i class="bi bi-pencil"></i></button></td>`;

        // Botón de eliminar
        tabla += `<td><button class="btn btn-danger btn-sm" onclick="eliminarDatosSecciones('${item.id}')"><i class="bi bi-trash"></i></button></td>`;

        tabla += '</tr>';
    });
    tabla += '</tbody></table>';

    contenedor.innerHTML = tabla;
}

//Función para guardar datos
async function guardarDatos() {
    const codigo = document.getElementById('id').value;
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
        document.querySelector("#myModal form").reset();

        // Mostrar el modal de éxito
        let modalExito = new bootstrap.Modal(document.getElementById('successModal'));
        modalExito.show();

        // Cerrar el modal
        obtenerDatos();
        let modal = bootstrap.Modal.getInstance(document.getElementById('myModal'));
        modal.hide();

    } catch (error) {
        console.error('Error al guardar datos:', error);
        alert('Error al guardar los datos');
    }
}

//Función para editar datos
function editarDatos(id) {
    idEditar = id;
    document.getElementById('id').disabled = true;
    // Obtener los datos del registro y llenar el formulario
    fetch(`https://api-nijc7glupa-uc.a.run.app/secciones/cuadroGeneral/${id}`)
        .then(res => res.json())
        .then(data => {
            document.getElementById('id').value = data.id;
            document.getElementById('seccion').value = data.seccion;
            document.getElementById('funcion').value = data.funcion;
            document.getElementById('guardarBtn').textContent = 'Modificar'; // Cambiar el texto del botón

            let modal = new bootstrap.Modal(document.getElementById('myModal'));
            modal.show();

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
    document.getElementById('id').disabled = false; // Habilitar
    document.getElementById('id').value = "";
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


