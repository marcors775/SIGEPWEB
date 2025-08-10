document.addEventListener('DOMContentLoaded', function () {
    cargarAldeas();

    document.getElementById('btnGuardarCambios').addEventListener('click', function () {
        guardarCambiosNino();
    });
});

function cargarAldeas() {
    $.ajax({
        url: '../Ajax/actualizarNino.php',
        type: 'POST',
        data: { opcion: 'listarAldeas' },
        dataType: 'json',
        success: function (data) {
            let html = '';
            if (data.length > 0) {
                data.forEach(function (aldea) {
                    html += `
                        <tr>
                            <td>${aldea.aldea}</td>
                            <td>${aldea.cantidad}</td>
                            <td>
                                <button class="btn btn-info btn-sm" onclick="verNinosPorAldea('${aldea.aldea}')">
                                    <i class="fas fa-eye"></i> Ver Niños
                                </button>
                            </td>
                        </tr>
                    `;
                });
            } else {
                html = `<tr><td colspan="3" class="text-center">No hay datos disponibles</td></tr>`;
            }

            document.getElementById('tbody_aldeas').innerHTML = html;
            inicializarDataTable('#tabla_aldeas');
        }
    });
}

function verNinosPorAldea(aldea) {
    document.getElementById('nombreAldea').textContent = aldea;

    $.ajax({
        url: '../Ajax/actualizarNino.php',
        type: 'POST',
        data: { opcion: 'listarNinosPorAldea', aldea },
        dataType: 'json',
        success: function (data) {
            let html = '';
            data.forEach(nino => {
                const fechaNacimiento = formatearFecha(nino.fecha_nacimiento);
                const fechaInscripcion = formatearFecha(nino.fecha_inscripcion);

                html += `
                    <tr>
                        <td>${nino.numero_nino}</td>
                        <td>${nino.nombre_completo}</td>
                        <td>${fechaNacimiento}</td>
                        <td>${nino.comunidad}</td>
                        <td>${nino.genero}</td>
                        <td>${nino.estado_patrocinio}</td>
                        <td>${fechaInscripcion}</td>
                        <td>${nino.socio_local}</td>
                        <td>${nino.nombre_alianza}</td>
                        <td>${nino.nombre_contacto_principal}</td>
                        <td>
                            <button class="btn btn-warning btn-sm" onclick="editarNino(${nino.numero_nino})">
                                <i class="fas fa-pen mr-1"></i> Editar
                            </button>
                        </td>
                    </tr>
                `;
            });

            document.getElementById('tbody_ninos').innerHTML = html;
            inicializarDataTable('#tabla_ninos', true);
            $('#modalNinos').modal('show');
        }
    });
}

function editarNino(numero_nino) {
    $.ajax({
        url: '../Ajax/actualizarNino.php',
        type: 'POST',
        data: { opcion: 'obtenerNino', numero_nino },
        dataType: 'json',
        success: function (data) {
            Object.entries(data).forEach(([key, value]) => {
                const el = document.getElementById(key);
                if (el) el.value = value;
            });

            $('#modalEditarNino').modal('show');
        }
    });
}

function guardarCambiosNino() {
    const formData = {
        opcion: 'actualizarNino',
        numero_nino: document.getElementById('numero_nino').value,
        nombre_completo: document.getElementById('nombre_completo').value,
        aldea: document.getElementById('aldea').value,
        fecha_nacimiento: document.getElementById('fecha_nacimiento').value,
        comunidad: document.getElementById('comunidad').value,
        genero: document.getElementById('genero').value,
        estado_patrocinio: document.getElementById('estado_patrocinio').value,
        fecha_inscripcion: document.getElementById('fecha_inscripcion').value,
        socio_local: document.getElementById('socio_local').value,
        nombre_alianza: document.getElementById('nombre_alianza').value,
        nombre_contacto_principal: document.getElementById('nombre_contacto_principal').value
    };

    for (let key in formData) {
        if (formData[key] === '' && key !== 'opcion') {
            Swal.fire({ icon: 'warning', title: 'Campos incompletos', text: 'Complete todos los campos.' });
            return;
        }
    }

    $.ajax({
        url: '../Ajax/actualizarNino.php',
        type: 'POST',
        data: formData,
        dataType: 'json',
        success: function (res) {
            if (res.status === 'success') {
                Swal.fire({ icon: 'success', title: 'Éxito', text: 'Datos actualizados correctamente' }).then(() => {
    $('#modalEditarNino').modal('hide');

    // Esperamos a que se cierre el modal para evitar que DataTable cause conflictos
    $('#modalEditarNino').on('hidden.bs.modal', function () {
        const aldea = document.getElementById('aldea').value;
        verNinosPorAldea(aldea);
    });
});
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: res.message });
            }
        }
    });
}

function formatearFecha(fechaStr) {
    if (!fechaStr) return '';
    const f = new Date(fechaStr);
    return `${f.getDate().toString().padStart(2, '0')}/${(f.getMonth() + 1).toString().padStart(2, '0')}/${f.getFullYear()}`;
}

// NUEVO: función para recargar/limpiar filtros de la tabla niños
function recargarTabla() {
    const aldea = document.getElementById('nombreAldea').textContent.trim();
    verNinosPorAldea(aldea);
}

function inicializarDataTable(selector, scrollX = false) {
    if ($.fn.DataTable.isDataTable(selector)) {
        $(selector).DataTable().destroy();
    }

    $(selector).DataTable({
        responsive: true,
        scrollX: scrollX,
        scrollY: "400px",
        scrollCollapse: true,
        paging: true,
        dom: 'Bfrtip',
        buttons: [
            {
                extend: 'pdfHtml5',
                text: 'PDF',
                orientation: 'landscape',
                pageSize: 'A4',
                exportOptions: {
                    columns: ':visible'
                },
                customize: function (doc) {
                    doc.styles.tableHeader.alignment = 'center';
                    doc.styles.tableBodyEven.alignment = 'center';
                    doc.styles.tableBodyOdd.alignment = 'center';
                    doc.content[1].margin = [0, 0, 0, 0]; // Quitar márgenes extra
                }
            },
            'copy',
            'excel'
        ],
        language: {
            search: "Buscar:",
            lengthMenu: "Mostrar _MENU_ registros por página",
            zeroRecords: "No se encontraron registros",
            info: "Mostrando página _PAGE_ de _PAGES_",
            infoEmpty: "No hay registros disponibles",
            infoFiltered: "(filtrado de _MAX_ registros totales)",
            paginate: {
                first: "Primero",
                last: "Último",
                next: "Siguiente",
                previous: "Anterior"
            }
        }
    });
}
