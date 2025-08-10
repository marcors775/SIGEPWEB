let dataTable;

document.addEventListener('DOMContentLoaded', function () {
    dataTable = $('#tablaUsuarios').DataTable({
        responsive: true,
        language: {
            lengthMenu: "Mostrar _MENU_ registros por página",
            search: "Buscar:",
            info: "Mostrando _START_ a _END_ de _TOTAL_ registros",
            infoEmpty: "No hay registros disponibles",
            infoFiltered: "(filtrado de _MAX_ registros totales)",
            paginate: {
                first: "Primero",
                last: "Último",
                next: "Siguiente",
                previous: "Anterior"
            }
        },
        columns: [
            { data: "Cedula", title: "Cédula" },
            { data: "nombre_completo", title: "Nombre Completo" },
            { data: "correo_electronico", title: "Correo Electrónico" },
            {
                title: "Acciones",
                orderable: false,
                searchable: false,
                data: null,
                render: function (data, type, row) {
                    return `
                        <div class="btn-group btn-group-sm" role="group">
                            <button class="btn btn-warning" title="Editar" onclick="editarUsuario('${row.Cedula}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-danger" title="Eliminar" onclick="eliminarUsuario('${row.Cedula}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>`;
                }
            }
        ]
    });

    cargarUsuarios();

    document.getElementById('formUsuario').addEventListener('submit', function (e) {
        e.preventDefault();
        const formData = new FormData(this);

        fetch('../Ajax/usuarioA.php', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            return response.text().then(data => {
                if (response.status === 403) {
                    Swal.fire('Sesión expirada', data, 'warning').then(() => {
                        location.href = '../Vista/login.html';
                    });
                    throw new Error('Sesión expirada');
                }

                Swal.fire('Resultado', data, 'success');
                cargarUsuarios();
                $('#modalUsuario').modal('hide');
            });
        })
        .catch(error => {
            console.error('Error al guardar:', error);
            Swal.fire('Error', 'Ocurrió un error al guardar.', 'error');
        });
    });
});

function cargarUsuarios() {
    if (!dataTable) return;

    fetch('../Ajax/usuarioA.php?accion=mostrar')
        .then(response => {
            return response.json().then(data => {
                if (response.status === 403) {
                    Swal.fire('Sesión expirada', 'Por favor vuelve a iniciar sesión.', 'warning')
                        .then(() => location.href = '../Vista/login.html');
                    throw new Error('Sesión expirada');
                }

                dataTable.clear();
                dataTable.rows.add(data).draw();
            });
        })
        .catch(error => {
            console.error('Error al cargar usuarios:', error);
            Swal.fire('Error', 'No se pudieron cargar los usuarios.', 'error');
        });
}

function mostrarFormularioAgregar() {
    document.getElementById('accion').value = 'insertar';
    document.getElementById('formUsuario').reset();
}

function editarUsuario(cedula) {
    fetch(`../Ajax/usuarioA.php?accion=obtenerPorCedula&cedula=${cedula}`)
        .then(response => {
            return response.json().then(usuario => {
                if (response.status === 403 || usuario?.error) {
                    Swal.fire('Sesión expirada o usuario no encontrado', 'Por favor vuelve a iniciar sesión.', 'warning')
                        .then(() => location.href = '../Vista/login.html');
                    throw new Error('Acceso denegado');
                }

                document.getElementById('accion').value = 'actualizar';
                document.getElementById('cedula').value = usuario.Cedula;
                document.getElementById('nombre_completo').value = usuario.nombre_completo;
                document.getElementById('correo_electronico').value = usuario.correo_electronico;
                document.getElementById('contrasena').value = '';
                $('#modalUsuario').modal('show');
            });
        })
        .catch(error => {
            console.error('Error al cargar usuario:', error);
            Swal.fire('Error', 'No se pudo cargar el usuario.', 'error');
        });
}

function eliminarUsuario(cedula) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: "Esta acción no se puede deshacer.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`../Ajax/usuarioA.php?accion=eliminar&cedula=${cedula}`)
                .then(response => {
                    return response.text().then(data => {
                        if (response.status === 403) {
                            Swal.fire('Sesión expirada', data, 'warning')
                                .then(() => location.href = '../Vista/login.html');
                            throw new Error('Sesión expirada');
                        }

                        Swal.fire('Resultado', data, 'success');
                        cargarUsuarios();
                    });
                })
                .catch(error => {
                    console.error('Error al eliminar:', error);
                    Swal.fire('Error', 'No se pudo eliminar el usuario.', 'error');
                });
        }
    });
}
