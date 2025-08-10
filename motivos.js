$(document).ready(function () {
    const tablaMotivosDevolucion = $('#tablaMotivosDevolucion').DataTable({
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

    // Función para mostrar alertas
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

    // Función para manejar errores
    function manejarError(xhr, status, error) {
        console.error('Error:', status, error);
        mostrarAlerta('error', 'Ocurrió un error durante la operación.');
    }

    // Función para cargar la tabla de motivos de devolución
    function cargarTablaMotivosDevolucion() {
        $.post('../Ajax/parametrosA.php', { accion: 'mostrarMotivosDevolucion' }, function (response) {
            tablaMotivosDevolucion.clear();
            if (response && Array.isArray(response) && response.length > 0) {
                response.forEach(motivo => {
                    tablaMotivosDevolucion.row.add([ 
                        motivo.idDevolucion,
                        motivo.descripcion,
                        motivo.detalle,
                        `
                        <button class="btn btn-primary btnEditarMotivo" data-id="${motivo.idDevolucion}" data-descripcion="${motivo.descripcion}" data-detalle="${motivo.detalle}">Editar</button>
                        <button class="btn btn-danger btnEliminarMotivo" data-id="${motivo.idDevolucion}">Eliminar</button>
                        `
                    ]).draw(false);
                });
            } else {
                mostrarAlerta('info', 'No hay motivos de devolución registrados.');
            }
        }, 'json').fail(manejarError);
    }

    // Cargar la tabla al inicio
    cargarTablaMotivosDevolucion();


    // Crear nuevo motivo de devolución
    $('#formCrearMotivo').on('submit', function (e) {
        e.preventDefault();
        const descripcion = $('#descripcionMotivoCrear').val();
        const detalle = $('#detalleMotivoCrear').val();


        const formData = {
            accion: 'insertarMotivoDevolucion',
            descripcion: descripcion,
            detalle: detalle
        };

        $.post('../Ajax/parametrosA.php', formData, function (response) {
            mostrarAlerta('success', response.message || 'Motivo de devolución guardado exitosamente.');
            cargarTablaMotivosDevolucion();
            
            // Limpiar los campos del modal
            $('#descripcionMotivoCrear').val('');
            $('#detalleMotivoCrear').val('');
            
            // Cerrar el modal
            $('#modalCrearMotivo').modal('hide');
        }, 'json').fail(manejarError);
    });

    // Eliminar motivo de devolución
    $(document).on('click', '.btnEliminarMotivo', function () {
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
                
                $.post('../Ajax/parametrosA.php', { accion: 'eliminarMotivoDevolucion', idDevolucion: idObservacion }, function (response) {
                    if (response.success) {
                        mostrarAlerta('success', response.message || 'Motivo Devolucion eliminada exitosamente.');
                    } else {
                        mostrarAlerta('error', response.message || 'No se pudo eliminar el motivo de devolución.');
                    }
                }, 'json').fail(manejarError);
                //cargarTablaMotivosDevolucion();
            } 
            cargarTablaMotivosDevolucion();
        });
    });

    // Editar motivo de devolución
    $(document).on('click', '.btnEditarMotivo', function () {
        const idMotivo = $(this).data('id');
        const descripcion = $(this).data('descripcion');
        const detalle = $(this).data('detalle');

        $('#idMotivoEditar').val(idMotivo);
        $('#descripcionMotivoEditar').val(descripcion);
        $('#detalleMotivoEditar').val(detalle);
        $('#modalEditarMotivo').modal('show');
    });

    // Actualizar motivo de devolución
    $('#formEditarMotivo').on('submit', function (e) {
        e.preventDefault();
        const descripcion = $('#descripcionMotivoEditar').val();
        const detalle = $('#detalleMotivoEditar').val();


        const formData = {
            accion: 'actualizarMotivoDevolucion',
            idDevolucion: $('#idMotivoEditar').val(),
            descripcion: descripcion,
            detalle: detalle
        };

        $.post('../Ajax/parametrosA.php', formData, function (response) {
            mostrarAlerta('success', response.message || 'Motivo de devolución actualizado exitosamente.');
            cargarTablaMotivosDevolucion();
            $('#modalEditarMotivo').modal('hide');
        }, 'json').fail(manejarError);
    });
});
