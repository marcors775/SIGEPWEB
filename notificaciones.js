$(document).ready(function() {
    var table = $('#tablaNotificaciones').DataTable({
        "ajax": {
            "url": '../Ajax/notificacionesA.php',
            "type": 'GET',
            "dataSrc": function(json) {
                return json.filter(row => row.nombre_gestor && row.nombre_gestor.trim() !== '');
            }
        },
        "columns": [
            { "data": "nombre_gestor" },
            { "data": "total_ninos" },
            { 
                "data": null,
                "defaultContent": '<button class="btn btn-primary btn-sm">Ver Detalles</button>' 
            }
        ]
    });

    $('#tablaNotificaciones tbody').on('click', 'button', function() {
        var data = table.row($(this).parents('tr')).data();
        var gestorNombre = data.nombre_gestor;

        $.ajax({
            url: '../Ajax/notificacionesA.php',
            type: 'POST',
            data: { gestor: gestorNombre },
            dataType: 'json',
            success: function(response) {
                if (response.error) {
                    console.log(response.error);
                } else {
                    // Limpiar el contenido previo del modal
                    var tableId = 'detalleNotificacionesTable';
                    var modalContent = ` 
                        <h5>Detalles de las notificaciones para: ${gestorNombre}</h5>
                        <table id="${tableId}" class="table table-bordered table-striped">
                            <thead>
                                <tr>
                                    <th>Nombre del Niño</th>
                                    <th>Número del Niño</th>
                                    <th>Observaciones</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;

                    response.forEach(function(row) {
                        modalContent += `
                            <tr>
                                <td>${row.nombre_nino || 'No disponible'}</td>
                                <td>${row.codigo_nino || 'No disponible'}</td>
                                <td>${row.observaciones || 'No disponible'}</td>
                            </tr>
                        `;
                    });

                    modalContent += `</tbody></table>`;

                    $('#modalDetalles').find('.modal-body').html(modalContent);

                    // Inicializar DataTable para los detalles con los botones
                    $(`#${tableId}`).DataTable({
                        "paging": true,
                        "searching": true,
                        "info": true,
                        "lengthChange": false,
                        "autoWidth": false,
                        "responsive": true,
                        dom: 'Bfrtip',  // Para incluir los botones
                        buttons: [
                            {
                                extend: 'excelHtml5',
                                title: `Detalles de Notificaciones`, // Título personalizado para Excel
                                messageTop: `Gestor: ${gestorNombre}` // Agregar nombre del gestor en la parte superior
                            },
                            {
                                extend: 'pdfHtml5',
                                title: `Detalles de Notificaciones`, // Título personalizado para PDF
                                messageTop: `Gestor: ${gestorNombre}`, // Agregar nombre del gestor en la parte superior
                                customize: function (doc) {
                                    doc.content[1].text = `Gestor: ${gestorNombre}`; // Cambiar el texto en el PDF
                                }
                            }
                        ]
                    });

                    $('#modalDetalles').modal('show');
                }
            },
            error: function(xhr, status, error) {
                console.error("Error al obtener las notificaciones: ", error);
            }
        });
    });
});
