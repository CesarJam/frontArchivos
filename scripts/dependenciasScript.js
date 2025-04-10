document.addEventListener("DOMContentLoaded", async () => {
    cargarDependencias();
});

// Función para editar la dependencia
function editarDependencia(id) {
    console.log("Editar dependencia con id:", id);
    // Implementar lógica para editar la dependencia (ej. abrir un modal)
}

// Función para eliminar la dependencia
function eliminarDependencia(id) {
    console.log("Eliminar dependencia con id:", id);
    // Implementar lógica para eliminar la dependencia (ej. hacer solicitud DELETE a la API)
}

// Limpia el modal
function limpiarModalDependencias() {
    // Limpiar los campos de texto
    document.getElementById('formularioDependencias').reset();

    //manejo de botones guardar y modificar
    const buttonGuardar = document.getElementById('guardarBtnModalDependencias');
    const buttonModificar = document.getElementById('modificarBtnModalDependencias');
    buttonGuardar.classList.remove('d-none');//ocultar boton de Guardar 
    buttonModificar.classList.add('d-none');//Mostrar boton de modificar
}

//registrar dependencias
// Registra lo que se capturo del modal para Dependencias
async function guardarDependencias() {
    try {
        // Capturamos el valor del campo "nombre" de la dependencia
        const nombreDependencia = document.getElementById("nombreModalDependencias").value.trim();
        console.log("Dependencia seleccionada: " + nombreDependencia);

        // Validar que el campo de "nombre" no esté vacío
        if (!nombreDependencia) {
            alert("El campo 'Nombre de la Dependencia' es obligatorio.");
            return;
        }

        // Crear el objeto JSON para enviar
        const formData = {
            nombre: nombreDependencia
        };

        console.log("Datos enviados:", formData);

        // Enviar solicitud POST 
        const response = await fetch("https://api-nijc7glupa-uc.a.run.app/dependencias/dependencias", {
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

        // Cerrar modal de dependencias
        bootstrap.Modal.getInstance(document.getElementById('modalDependencias'))?.hide();

        // ACTUALIZAR TABLA DE DEPENDENCIAS (si es necesario)
        cargarDependencias();  // Asume que tienes una función que carga las dependencias

    } catch (error) {
        console.error("Error al guardar dependencia:", error);
        alert("Hubo un problema al guardar la dependencia. Inténtelo nuevamente.");
    }
}


//cargamos los datos de la tabla
async function cargarDependencias() {
    const tablaDependencias = document.getElementById("tabla-dependencias");

    try {
        // Hacer una solicitud GET a la API para obtener las dependencias
        const response = await fetch("https://api-nijc7glupa-uc.a.run.app/dependencias/dependencias");
        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
            // Ordenar los datos alfabéticamente por el nombre de la dependencia
            data.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
            
            // Limpiar cualquier contenido previo en la tabla
            tablaDependencias.innerHTML = '';

            // Recorrer los datos recibidos y agregar filas a la tabla
            data.forEach((dependencia) => {
                const row = document.createElement("tr");

                // Crear celdas para cada columna
                /*
                const cellId = document.createElement("td");
                cellId.textContent = dependencia.id || "No disponible"; // Id de la dependencia
                row.appendChild(cellId);*/

                const cellDependencia = document.createElement("td");
                cellDependencia.textContent = dependencia.nombre || "No disponible"; // Dependencia (nombre)
                cellDependencia.setAttribute("colspan", 2); // Establecer el atributo colspan a 2
                row.appendChild(cellDependencia);

                // Columna de editar (puedes agregar un botón de editar)
                const cellEditar = document.createElement("td");
                const btnEditar = document.createElement("button");
                btnEditar.classList.add("btn", "btn-warning");
                btnEditar.textContent = "Editar";
                btnEditar.onclick = () => editarDependencia(dependencia.id); // Función para editar
                cellEditar.appendChild(btnEditar);
                row.appendChild(cellEditar);

                // Columna de eliminar (puedes agregar un botón de eliminar)
                const cellEliminar = document.createElement("td");
                const btnEliminar = document.createElement("button");
                btnEliminar.classList.add("btn", "btn-danger");
                btnEliminar.textContent = "Eliminar";
                btnEliminar.onclick = () => eliminarDependencia(dependencia.id); // Función para eliminar
                cellEliminar.appendChild(btnEliminar);
                row.appendChild(cellEliminar);

                // Agregar la fila a la tabla
                tablaDependencias.appendChild(row);
            });
        } else {
            console.log("No hay datos disponibles.");
            tablaDependencias.innerHTML = "<tr><td colspan='5' class='text-center'>No hay registros disponibles</td></tr>";
        }
    } catch (error) {
        console.error("Error al cargar las dependencias:", error);
        tablaDependencias.innerHTML = "<tr><td colspan='5' class='text-center'>Error al cargar los datos</td></tr>";
    }
}

//eliminarDependencias
// Función para eliminar un registro de dependencias
async function eliminarDependencia(id, nombreDependencia) {
    if (!id) {
        console.error("Error: ID no proporcionado.");
        return;
    }

    const url = `https://api-nijc7glupa-uc.a.run.app/dependencias/dependencias/${id}`;

    // Confirmación con SweetAlert2
    const confirmacion = await Swal.fire({
        title: "¿Estás seguro?",
        text: `Eliminarás la dependencia: ${nombreDependencia}`,
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
            text: "La dependencia se eliminó correctamente.",
            icon: "success",
            confirmButtonColor: "#3085d6"
        });

        // Recargar la lista de dependencias
        cargarDependencias();

    } catch (error) {
        console.error("Error al eliminar la dependencia:", error);
        Swal.fire({
            title: "Error",
            text: "No se pudo eliminar la dependencia. Intenta de nuevo.",
            icon: "error",
            confirmButtonColor: "#d33"
        });
    }
}

//editar dependencias
// Función de editar dependencias
async function editarDependencia(idDependencia) {
    try {
        // Limpiar UI antes de cargar los nuevos datos
        limpiarModalDependencias();

        // Obtener los datos de la dependencia específica
        const response = await fetch(`https://api-nijc7glupa-uc.a.run.app/dependencias/dependencias/${idDependencia}`);
        const dependencia = await response.json();

        // Llenar el formulario con los datos obtenidos
        document.getElementById('idDependencias').value = dependencia.id; // Si tienes un campo oculto para el ID
        document.getElementById('nombreModalDependencias').value = dependencia.nombre || '';

        // Habilitar el botón de modificar y ocultar el de guardar
        const buttonGuardar = document.getElementById('guardarBtnModalDependencias');
        const buttonModificar = document.getElementById('modificarBtnModalDependencias');
        buttonGuardar.classList.add('d-none'); // Ocultar el botón de Guardar
        buttonModificar.classList.remove('d-none'); // Mostrar el botón de Modificar

        // Abrir el modal
        const modal = new bootstrap.Modal(document.getElementById('modalDependencias'));
        modal.show();
    } catch (error) {
        console.error('Error al cargar la dependencia para editar:', error);
        alert('Error al cargar la dependencia para editar');
    }
}

// Función de guardar las modificaciones mediante el update
async function modificarDependencias() {
    try {
        // Recopilar valores del formulario
        const formData = {
            id: document.getElementById('idDependencias').value,  // Se obtiene el ID de dependencia
            nombre: document.getElementById("nombreModalDependencias").value.trim()
            // Aquí puedes agregar otros campos si es necesario
        };
        console.log(formData);

        // Validar campos obligatorios
        for (const [key, value] of Object.entries(formData)) {
            if (!value) {
                console.error(`Error: El campo "${key}" es obligatorio.`);
                alert(`El campo "${key}" es obligatorio.`);
                return;
            }
        }

        // Enviar solicitud PUT a la API de dependencias
        const response = await fetch(`https://api-nijc7glupa-uc.a.run.app/dependencias/dependencias/${formData.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error(`Error en la solicitud: ${response.status} - ${response.statusText}`);
        }

        const result = await response.json();
        console.log("Dependencia actualizada:", result);

        // Mostrar modal de éxito
        new bootstrap.Modal(document.getElementById('successModal')).show();

        // Cerrar modal de dependencia
        bootstrap.Modal.getInstance(document.getElementById('modalDependencias'))?.hide();

        // Actualizar la tabla de dependencias
        cargarDependencias(); // Función para recargar la tabla de dependencias después de la actualización

    } catch (error) {
        console.error("Error al guardar la dependencia:", error);
        alert("Hubo un problema al guardar la dependencia. Inténtelo nuevamente.");
    }
}

// Filtrar tabla por dependencias
document.getElementById("filtroDependencias").addEventListener("keyup", function () {
    let filtro = this.value.toLowerCase(); // Convertir el filtro a minúsculas
    let filas = document.querySelectorAll("#tablaDependencias tbody tr");

    filas.forEach(fila => {
        let celdaDependencia = fila.querySelector("td:nth-child(1)"); // Ajusta a la primera columna (Dependencia)
        if (celdaDependencia) {
            let texto = celdaDependencia.textContent.toLowerCase();
            let coincide = texto.includes(filtro);

            // Mostrar u ocultar la fila según el filtro
            fila.style.display = coincide ? "" : "none";
        }
    });
});
