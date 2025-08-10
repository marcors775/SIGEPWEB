// Archivo: Js/registro_ninos.js

$(document).ready(function () {
    $.fn.dataTable.ext.errMode = 'none';

    let tablaDetalleNinos;
    cargarAgrupacion();

    $('#formImportarNinos').submit(function (e) {
        e.preventDefault();

        const formData = new FormData(this);

        $.ajax({
            url: '../Ajax/registroNinos.php',
            type: 'POST',
            data: formData,
            contentType: false,
            processData: false,
            beforeSend: function () {
                $('#resultado_importacion').html('<div class="alert alert-info">Procesando archivo, por favor espere...</div>');
            },
            success: function (response) {
                let res;
                try {
                    res = typeof response === 'string' ? JSON.parse(response) : response;
                } catch (e) {
                    $('#resultado_importacion').html('<div class="alert alert-danger">Error de lectura. Verifique el Excel.</div>');
                    return;
                }

                if (res.status === 'success') {
                    let mensaje = `<strong>${res.mensaje}</strong>`;

                    // ✅ NUEVO: Mostrar comunidades con participantes marcados como Desafiliados
                    if (res.comunidadesAfectadas && res.comunidadesAfectadas.length > 0) {
                        mensaje += `<br><small class="text-muted">
                            Se marcaron como <strong>'Desafiliado'</strong> los participantes no actualizados 
                            en las comunidades: <strong>${res.comunidadesAfectadas.join(', ')}</strong>.
                        </small>`;
                    }

                    $('#resultado_importacion').html('<div class="alert alert-success">' + mensaje + '</div>');
                    cargarAgrupacion();
                } else if (res.status === 'filtros') {
                    $('#modalFiltros').modal('show');
                    $('#modalFiltros .modal-body').html(`<div class="alert alert-warning">${res.mensaje}</div>`);
                } else {
                    $('#resultado_importacion').html('<div class="alert alert-danger">' + res.mensaje + '</div>');
                }
            },
            error: function (xhr) {
                if (xhr.responseText.includes('Fatal error') || xhr.status === 500) {
                    $('#modalFiltros').modal('show');
                } else {
                    $('#resultado_importacion').html('<div class="alert alert-danger">Error: ' + xhr.statusText + '</div>');
                }
            }
        });
    });

    function cargarAgrupacion() {
        $.ajax({
            url: '../Ajax/registroNinos.php',
            type: 'POST',
            data: { accion: 'obtenerMeses' },
            success: function (response) {
                const res = typeof response === 'string' ? JSON.parse(response) : response;
                const tbody = $('#tabla_meses tbody');
                tbody.empty();

                const agrupado = {};

                res.data.forEach(item => {
                    const [anio, mes, dia] = item.mes_seleccionado.split('-');
                    const clave = `${anio}-${mes}`;

                    if (!agrupado[clave]) agrupado[clave] = [];

                    agrupado[clave].push({
                        fechaTexto: `${dia}/${mes}/${anio}`,
                        fechaISO: item.mes_seleccionado,
                        cantidad: item.cantidad
                    });
                });

                Object.keys(agrupado).forEach(clave => {
                    const grupo = agrupado[clave];
                    const mesTexto = `${nombreMes(clave.split('-')[1])} ${clave.split('-')[0]}`;

                    const grupoId = `grupo-${clave.replace('-', '')}`;
                    const rowPrincipal = $(
                        `<tr class="fila-mes">
                            <td colspan="3">
                                <div class="d-flex justify-content-between align-items-center">
                                    <strong>${mesTexto}</strong>
                                    <button class="btn btn-primary btn-sm toggle-detalle" data-target="${grupoId}">Ver Detalles</button>
                                </div>
                                <div class="subtabla mt-2 border rounded p-2 bg-light" id="${grupoId}" style="display: none;">
                                    ${grupo.map(carga => `
                                        <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                                            <div><strong>Fecha:</strong> ${carga.fechaTexto}</div>
                                            <div><strong>Niños:</strong> ${carga.cantidad}</div>
                                            <div><button class="btn btn-info btn-sm ver-ninos" data-mes="${carga.fechaISO}">Ver Niños</button></div>
                                        </div>
                                    `).join('')}
                                </div>
                            </td>
                        </tr>`
                    );

                    tbody.append(rowPrincipal);
                });
            }
        });
    }

    $(document).on('click', '.toggle-detalle', function () {
        const target = $(this).data('target');
        const $target = $('#' + target);

        if ($target.is(':visible')) {
            $target.slideUp();
        } else {
            $('.subtabla').slideUp();
            $target.slideDown();
        }
    });

    $(document).on('click', '.ver-ninos', function () {
        const mes = $(this).data('mes');

        if (!$.fn.DataTable.isDataTable('#tabla_detalle_ninos')) {
            tablaDetalleNinos = $('#tabla_detalle_ninos').DataTable({
                responsive: true,
                autoWidth: false,
                language: { url: '//cdn.datatables.net/plug-ins/1.10.20/i18n/Spanish.json' },
                columns: [
                    { data: 'community_number' },
                    { data: 'village' },
                    { data: 'Child_Number' },
                    { data: 'full_name' },
                    { data: 'gender' },
                    { data: 'birthdate', render: formatFecha },
                    { data: 'birthdate', render: calcularEdad },
                    { data: 'sponsorship_status' },
                    { data: 'enrolled_on_date', render: formatFecha },
                    { data: 'local_partner' },
                    { data: 'alliance_name' },
                    { data: 'primary_contact_full_name' }
                ]
            });
        } else {
            tablaDetalleNinos.clear().draw();
        }

        $.ajax({
            url: '../Ajax/registroNinos.php',
            type: 'POST',
            data: { accion: 'obtenerNinos', mes },
            success: function (response) {
                const res = typeof response === 'string' ? JSON.parse(response) : response;
                if (res.status === 'success') {
                    res.data.forEach(n => tablaDetalleNinos.row.add(n));
                    tablaDetalleNinos.draw();
                    $('#modalDetalleNinos').modal('show');
                } else {
                    alert('Error al cargar niños: ' + res.mensaje);
                }
            }
        });
    });

    function formatFecha(data) {
        if (!data || data === '0000-00-00') return '';
        const [y, m, d] = data.split('-');
        return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }

    function calcularEdad(data) {
        if (!data || data === '0000-00-00') return '';
        const hoy = new Date();
        const nacimiento = new Date(data);
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        const mes = hoy.getMonth() - nacimiento.getMonth();
        if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
            edad--;
        }
        return edad;
    }

    function nombreMes(mes) {
        const nombres = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        return nombres[parseInt(mes, 10) - 1];
    }

    if ($('#modalFiltros').length > 0) {
        $('#modalFiltros').on('hidden.bs.modal', function () {
            $('#resultado_importacion').html('');
        });
    }
});