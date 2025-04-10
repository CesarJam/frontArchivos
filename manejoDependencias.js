$(document).ready(function () {
    cargarSelectModalInventario();

    // Evento cuando cambia la selección
    $('#dependenciaModalInventario').on('changed.bs.select', function () {
        mostrarValorSelectModalInventario();
    });
});

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

function mostrarValorSelectModalInventario() {
    const valor = $('#dependenciaModalInventario').val() || 'Vacío';
    $('#valorActual').text(valor);
    console.log(valor)
}
