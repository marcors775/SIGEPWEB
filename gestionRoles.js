$(document).ready(function () {
    const tabla = $('#tablaRoles').DataTable({
        ajax: {
            url: '../Ajax/rolesA.php?op=listar',
            method: 'GET',
            dataSrc: ''
        },
        columns: [
            { data: 'id' },
            { data: 'tipo_rol' },
            { data: 'descripcion' },
            {
                data: null,
                className: 'text-center',
                render: function (data, type, row) {
                    return `
                        <button class="btn btn-sm btn-warning" onclick="editarRol(${row.id})">✏️</button>
                        <button class="btn btn-sm btn-danger" onclick="confirmarEliminacion(${row.id}, '${row.tipo_rol}')">🗑️</button>
                    `;
                }
            }
        ]
    });

    $('#modalRol').on('hidden.bs.modal', () => {
        $('#formRol')[0].reset();
        $('#rol_id').val('');
    });

    $('#formRol').submit(function (e) {
        e.preventDefault();
        const datos = {
            id: $('#rol_id').val(),
            tipo_rol: $('#tipo_rol').val(),
            descripcion: $('#descripcion').val() // ✅ CORREGIDO
        };

        $.post('../Ajax/rolesA.php?op=guardar', datos, function () {
            $('#modalRol').modal('hide');
            tabla.ajax.reload();
            Swal.fire('Guardado', 'El rol ha sido guardado', 'success');
        }).fail(function (xhr) {
            let msg = xhr.responseJSON?.error || xhr.responseText;
            Swal.fire('Error', msg, 'error');
        });
    });

    window.editarRol = function (id) {
        $.get('../Ajax/rolesA.php?op=obtener&id=' + id, function (rol) {
            $('#rol_id').val(rol.id);
            $('#tipo_rol').val(rol.tipo_rol);
            $('#descripcion').val(rol.descripcion); // ✅ CORREGIDO
            $('#modalRol').modal('show');
        });
    }

    window.confirmarEliminacion = function (id, nombreRol) {
        $.get('../Ajax/gestores_por_rol.php?id=' + id, function (gestores) {
            let detalle = '<strong>Los siguientes gestores tienen este rol:</strong><ul class="text-left">';

            if (gestores.length > 0) {
                gestores.forEach(g => detalle += `<li>${g.nombre_completo} (${g.Cedula})</li>`);
                detalle += '</ul>';

                detalle += `<p class='mt-2 text-danger'><strong>¿Deseas quitarles el rol y continuar con la eliminación?</strong></p>`;
            } else {
                detalle = '¿Estás seguro de que deseas eliminar este rol?';
            }

            Swal.fire({
                title: `Eliminar el rol: ${nombreRol}`,
                html: detalle,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            }).then(result => {
                if (result.isConfirmed) {
                    eliminarRol(id);
                }
            });
        });
    }

    function eliminarRol(id) {
        $.ajax({
            url: '../Ajax/rolesA.php?op=eliminar',
            method: 'POST',
            data: { id },
            success: function (res) {
                if (res.status === 'conflict') {
                    Swal.fire({
                        title: 'Rol en uso',
                        html: res.message,
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonText: 'Sí, continuar',
                        cancelButtonText: 'Cancelar'
                    }).then(result => {
                        if (result.isConfirmed) {
                            $.post('../Ajax/liberar_rol_gestores.php', { rol_id: id }, function () {
                                eliminarRol(id);
                            });
                        }
                    });
                } else {
                    tabla.ajax.reload();
                    Swal.fire('Eliminado', 'El rol fue eliminado', 'info');
                }
            },
            error: function (xhr) {
                const msg = xhr.responseJSON?.message || xhr.responseText;
                Swal.fire('Error', msg, 'error');
            }
        });
    }
});