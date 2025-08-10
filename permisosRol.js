$(document).ready(function () {
    let rolIdSeleccionado = null;

    cargarRoles();

    function cargarRoles() {
        $.getJSON('../Ajax/permisosA.php?op=roles', function (data) {
            const lista = $('#listaRoles');
            lista.empty();
            data.forEach(r => {
                const li = `<li class="list-group-item list-group-item-action" id="rol-${r.id}" style="cursor:pointer"
                            onclick="seleccionarRol(${r.id}, '${r.tipo_rol}')">${r.tipo_rol}</li>`;
                lista.append(li);
            });
        }).fail(function () {
            Swal.fire('Error', 'No se pudo cargar la lista de roles', 'error');
        });
    }

    window.seleccionarRol = function (id, nombre) {
        rolIdSeleccionado = id;
        $('#rolSeleccionado').text(nombre);

        // resaltar el rol activo
        $('#listaRoles li').removeClass('active');
        $(`#rol-${id}`).addClass('active');

        cargarVistasAsignadas();
        cargarVistasDisponibles();
    }

    function cargarVistasAsignadas() {
        $.getJSON(`../Ajax/permisosA.php?op=asignadas&id=${rolIdSeleccionado}`, function (data) {
            const tbody = $('#tablaVistasAsignadas tbody');
            tbody.empty();
            data.forEach(v => {
                tbody.append(`
                    <tr>
                        <td>${v.nombre}</td>
                        <td>${v.categoria}</td>
                        <td class="text-center">
                            <button class="btn btn-sm btn-danger" onclick="revocarVista(${v.id})">🗑️</button>
                        </td>
                    </tr>`);
            });
        }).fail(function () {
            Swal.fire('Error', 'No se pudieron cargar las vistas asignadas', 'error');
        });
    }

    function cargarVistasDisponibles() {
        $.getJSON(`../Ajax/permisosA.php?op=disponibles&id=${rolIdSeleccionado}`, function (data) {
            const select = $('#vistaDisponible');
            select.empty().append('<option value="">Seleccione una vista</option>');
            data.forEach(v => {
                select.append(`<option value="${v.id}">${v.nombre} (${v.categoria})</option>`);
            });
        }).fail(function () {
            Swal.fire('Error', 'No se pudieron cargar las vistas disponibles', 'error');
        });
    }

    $('#btnAsignarVista').click(function () {
        const vistaId = $('#vistaDisponible').val();
        if (!vistaId || !rolIdSeleccionado) return;

        $.post('../Ajax/permisosA.php?op=asignar', { rol_id: rolIdSeleccionado, vista_id: vistaId }, function () {
            cargarVistasAsignadas();
            cargarVistasDisponibles();
            Swal.fire('Asignado', 'Vista asignada correctamente', 'success');
        }).fail(function () {
            Swal.fire('Error', 'No se pudo asignar la vista', 'error');
        });
    });

    window.revocarVista = function (vistaId) {
        $.post('../Ajax/permisosA.php?op=revocar', { rol_id: rolIdSeleccionado, vista_id: vistaId }, function () {
            cargarVistasAsignadas();
            cargarVistasDisponibles();
            Swal.fire('Eliminado', 'Permiso revocado', 'info');
        }).fail(function () {
            Swal.fire('Error', 'No se pudo revocar el permiso', 'error');
        });
    }
});
