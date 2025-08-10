$(document).ready(function () {
    const tablaObservacion = $('#tablaObservacion').DataTable({
        language: {},
        columnDefs: [
            { orderable: false, targets: 3 }
        ],
        paging: true,
        pageLength: 10,
        lengthMenu: [10, 25, 50, 75, 100],
        searching: true,
        ordering: true,
        info: true,
        responsive: true
    });

    function mostrarAlerta(tipo, mensaje) {
        Swal.fire({
            icon: tipo,
            title: mensaje,
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
        });
    }

    function manejarError(xhr, status, error) {
        console.error('Error:', status, error);
        mostrarAlerta('error', 'Ocurrió un error durante la operación.');
    }

    function cargarTablaObservacion() {
        $.post('../Ajax/parametrosA.php', { accion: 'mostrarObservaciones' }, function (response) {
            tablaObservacion.clear();
            if (response && Array.isArray(response) && response.length > 0) {
                response.forEach(observacion => {
                    tablaObservacion.row.add([
                        observacion.idObservaciones,
                        observacion.descripcion,
                        observacion.detalle,
                        `
                        <button class="btn btn-primary btnEditarObservacion" data-id="${observacion.idObservaciones}" data-descripcion="${observacion.descripcion}" data-detalle="${observacion.detalle}">Editar</button>
                        <button class="btn btn-danger btnEliminarObservacion" data-id="${observacion.idObservaciones}">Eliminar</button>
                        `
                    ]).draw(false);
                });
            } else {
                mostrarAlerta('info', 'No hay observaciones registradas.');
            }
        }, 'json').fail(manejarError);
    }

    cargarTablaObservacion();


    $('#formCrearObservacion').on('submit', function (e) {
        e.preventDefault();
        const descripcion = $('#descripcionObservacionCrear').val();
        const detalle = $('#detalleObservacionCrear').val();


        const formData = {
            accion: 'insertarObservacion',
            descripcion: descripcion,
            detalle: detalle
        };

        $.post('../Ajax/parametrosA.php', formData, function (response) {
            mostrarAlerta('success', response.message || 'Observación guardada exitosamente.');
            cargarTablaObservacion();
            
            // Limpiar los campos del modal
            $('#descripcionObservacionCrear').val('');
            $('#detalleObservacionCrear').val('');
            
            // Cerrar el modal
            $('#modalCrearObservacion').modal('hide');
        }, 'json').fail(manejarError);
    });

    $(document).on('click', '.btnEliminarObservacion', function () {
        const idObservacion = $(this).data('id');
        Swal.fire({
            title: '¿Estás seguro?',
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                $.post('../Ajax/parametrosA.php', { accion: 'eliminarObservacion', idObservaciones: idObservacion }, function (response) {
                    mostrarAlerta('success', response.message || 'Observación eliminada exitosamente.');
                    cargarTablaObservacion();
                }, 'json').fail(manejarError);
            }
        });
    });

    $(document).on('click', '.btnEditarObservacion', function () {
        const idObservaciones = $(this).data('id');
        const descripcion = $(this).data('descripcion');
        const detalle = $(this).data('detalle');

        $('#idObservacionEditar').val(idObservaciones);
        $('#descripcionObservacionEditar').val(descripcion);
        $('#detalleObservacionEditar').val(detalle);
        $('#modalEditarObservacion').modal('show');
    });

    $('#formEditarObservacion').on('submit', function (e) {
        e.preventDefault();
        const descripcion = $('#descripcionObservacionEditar').val();
        const detalle = $('#detalleObservacionEditar').val();


        const formData = {
            accion: 'actualizarObservacion',
            idObservaciones: $('#idObservacionEditar').val(),
            descripcion: descripcion,
            detalle: detalle
        };

        $.post('../Ajax/parametrosA.php', formData, function (response) {
            mostrarAlerta('success', response.message || 'Observación actualizada exitosamente.');
            cargarTablaObservacion();
            $('#modalEditarObservacion').modal('hide');
        }, 'json').fail(manejarError);
    });
});
