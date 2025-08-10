$(document).ready(function () {
    const tablaPlanes = $('#tablaPlanes').DataTable({
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

    function cargarTablaPlanes() {
        $.post('../Ajax/parametrosA.php', { accion: 'mostrarPlanFuturo' }, function (response) {
            tablaPlanes.clear();
            if (response && Array.isArray(response) && response.length > 0) {
                response.forEach(plan => {
                    tablaPlanes.row.add([
                        plan.idPlanesFuturos,
                        plan.descripcion,
                        plan.detalle,
                        `
                        <button class="btn btn-primary btnEditarPlan" data-id="${plan.idPlanesFuturos}" data-descripcion="${plan.descripcion}" data-detalle="${plan.detalle}">Editar</button>
                        <button class="btn btn-danger btnEliminarPlan" data-id="${plan.idPlanesFuturos}">Eliminar</button>
                        `
                    ]).draw(false);
                });
            } else {
                mostrarAlerta('info', 'No hay planes futuros registrados.');
            }
        }, 'json').fail(manejarError);
    }

    cargarTablaPlanes();

    $('#formCrearPlan').on('submit', function (e) {
        e.preventDefault();
        const descripcion = $('#descripcionPlanCrear').val();
        const detalle = $('#detallePlanCrear').val();


        const formData = {
            accion: 'insertarPlanFuturo',
            descripcion: descripcion,
            detalle: detalle
        };

        $.post('../Ajax/parametrosA.php', formData, function (response) {
            mostrarAlerta('success', response.message || 'Plan Futuro guardado exitosamente.');
            cargarTablaPlanes();
            
            // Limpiar los campos del modal
            $('#descripcionPlanCrear').val('');
            $('#detallePlanCrear').val('');
            
            // Cerrar el modal
            $('#modalCrearPlan').modal('hide');
        }, 'json').fail(manejarError);
    });

    $(document).on('click', '.btnEliminarPlan', function () {
        const idPlan = $(this).data('id');
        Swal.fire({
            title: '¿Estás seguro?',
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminarlo',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                $.post('../Ajax/parametrosA.php', { accion: 'eliminarPlanFuturo', idPlanFuturo: idPlan }, function (response) {
                    mostrarAlerta('success', response.message || 'Plan Futuro eliminado exitosamente.');
                    cargarTablaPlanes();
                }, 'json').fail(manejarError);
            }
        });
    });

    $(document).on('click', '.btnEditarPlan', function () {
        const idPlan = $(this).data('id');
        const descripcion = $(this).data('descripcion');
        const detalle = $(this).data('detalle');

        $('#idPlanEditar').val(idPlan);
        $('#descripcionPlanEditar').val(descripcion);
        $('#detallePlanEditar').val(detalle);
        $('#modalEditarPlan').modal('show');
    });

    $('#formEditarPlan').on('submit', function (e) {
        e.preventDefault();
        const descripcion = $('#descripcionPlanEditar').val();
        const detalle = $('#detallePlanEditar').val();

        const formData = {
            accion: 'actualizarPlanFuturo',
            idPlanFuturo: $('#idPlanEditar').val(),
            descripcion: descripcion,
            detalle: detalle
        };

        $.post('../Ajax/parametrosA.php', formData, function (response) {
            mostrarAlerta('success', response.message || 'Plan Futuro actualizado exitosamente.');
            cargarTablaPlanes();
            $('#modalEditarPlan').modal('hide');
        }, 'json').fail(manejarError);
    });
});
