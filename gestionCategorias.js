$(document).ready(function () {
    const tabla = $('#tablaCategorias').DataTable({
        ajax: {
            url: '../Ajax/categoriasA.php?op=listar',
            method: 'GET',
            dataType: 'json',
            dataSrc: ''
        },
        columns: [
            { data: 'id' },
            { data: 'nombre' },
            {
                data: null,
                className: 'text-center',
                render: function (data, type, row) {
                    return `
                        <button class="btn btn-sm btn-warning" onclick="editarCategoria(${row.id})">✏️</button>
                        <button class="btn btn-sm btn-danger" onclick="eliminarCategoria(${row.id})">🗑️</button>
                    `;
                }
            }
        ]
    });

    // 🧹 Resetear modal al cerrarlo
    $('#modalCategoria').on('hidden.bs.modal', () => {
        $('#formCategoria')[0].reset();
        $('#categoria_id').val('');
        $('#nombre_actual').val('');
        $('#grupo_nombre_actual').hide();
        $('#modalCategoriaLabel').text('Nueva Categoría');
    });

    // 📝 Crear nueva categoría
    window.abrirModalCrear = function () {
        $('#formCategoria')[0].reset();
        $('#categoria_id').val('');
        $('#nombre_actual').val('');
        $('#grupo_nombre_actual').hide();
        $('#modalCategoriaLabel').text('Nueva Categoría');
        $('#modalCategoria').modal('show');
    };

    // ✏️ Editar categoría existente
    window.editarCategoria = function (id) {
        $.get(`../Ajax/categoriasA.php?op=obtener&id=${id}`, function (cat) {
            console.log("✏️ Editando:", cat);

            // ⏱️ Esperar a que el modal esté visible
            $('#modalCategoria').one('shown.bs.modal', function () {
                $('#categoria_id').val(cat.id);
                $('#nombre_actual').val(cat.nombre);
                $('#nombre_categoria').val(cat.nombre);
                $('#grupo_nombre_actual').show();
                $('#modalCategoriaLabel').text('Editar Categoría');
            });

            $('#modalCategoria').modal('show');
        });
    };

    // 💾 Enviar formulario (crear o actualizar)
    $('#formCategoria').submit(function (e) {
        e.preventDefault();

        const datos = {
            id: $('#categoria_id').val(),
            nombre: $('#nombre_categoria').val().trim()
        };

        console.log("📤 Enviando datos al backend:", datos);

        $.post('../Ajax/categoriasA.php?op=guardar', datos, function () {
            $('#modalCategoria').modal('hide');
            tabla.ajax.reload();
            Swal.fire('Guardado', 'La categoría ha sido guardada correctamente.', 'success');
        }).fail(function (xhr) {
            const error = xhr.responseJSON?.error || xhr.responseText;
            Swal.fire('Error', error, 'error');
        });
    });

    // 🗑️ Eliminar categoría
    window.eliminarCategoria = function (id) {
        Swal.fire({
            title: '¿Eliminar esta categoría?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then(result => {
            if (result.isConfirmed) {
                $.post('../Ajax/categoriasA.php?op=eliminar', { id }, function () {
                    tabla.ajax.reload();
                    Swal.fire('Eliminada', 'La categoría ha sido eliminada correctamente.', 'info');
                });
            }
        });
    };
});