$(document).ready(function () {
    cargarOpcionesFiltro();

    $('#btnDescargarExcel').on('click', function () {
        descargarExcel();
    });

    $('#filtro_tipo_carta').on('change', listarCartas);
    $('#filtro_usuario').on('change', listarCartas);

    const vista = sessionStorage.getItem('vista') || '';
    if (vista !== 'gestionVistas.php') {
        $('#div_usuario_filtro').addClass('d-none');
        listarCartas();
    }
});

function cargarOpcionesFiltro() {
    const usuario = $('#filtro_usuario');
    const vista = sessionStorage.getItem('vista') || '';

    if (vista === 'gestionVistas.php') {
        $('#div_usuario_filtro').removeClass('d-none');

        $.ajax({
            url: '../Ajax/ajaxReportarCartasLista.php',
            type: 'POST',
            dataType: 'json',
            data: { accion: 'listarUsuarios' },
            success: function (data) {
                usuario.empty().append('<option value="">-- Todos --</option>');
                data.forEach(u => {
                    usuario.append(`<option value="${u.id_usuario}">${u.nombre_completo}</option>`);
                });
                listarCartas();
            },
            error: function () {
                alert('Error al cargar los usuarios');
            }
        });
    } else {
        $('#div_usuario_filtro').addClass('d-none');
    }
}

function listarCartas() {
    const tipoCarta = $('#filtro_tipo_carta').val();
    const usuario = $('#filtro_usuario').val();

    $.ajax({
        url: '../Ajax/ajaxReportarCartasLista.php',
        type: 'POST',
        dataType: 'json',
        data: {
            accion: 'listarCartasLista',
            tipoCarta: tipoCarta,
            usuario_id: usuario
        },
        success: function (data) {
            renderizarTabla(data);
        },
        error: function () {
            alert('Error al cargar las cartas');
        }
    });
}

function renderizarTabla(cartas) {
    const tabla = $('#tablaCartasLista');

    if ($.fn.DataTable.isDataTable(tabla)) {
        tabla.DataTable().destroy();
    }

    const cuerpo = tabla.find('tbody');
    cuerpo.empty();

    if (!cartas || cartas.length === 0) {
        tabla.DataTable({
            language: { url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
            emptyTable: "No se encontraron resultados",
            pageLength: 10,
            responsive: true,
            lengthMenu: [5, 10, 25, 50, 100],
            ordering: false,
            data: [],
            columns: [
                { data: "village" },
                { data: "codigo_mcs" },
                { data: "observacion_promotor" },
                { data: "tipo_envio" },
                { data: "nombres" },
                { data: "tipo_carta" },
                { data: null }
            ]
        });
        return;
    }

    cartas.forEach(c => {
        cuerpo.append(`
            <tr>
                <td>${c.village || ''}</td>
                <td>${c.codigo_mcs || ''}</td>
                <td>${c.observacion_promotor || ''}</td>
                <td>${c.tipo_envio || ''}</td>
                <td>${c.nombres || ''}</td>
                <td>${c.tipo_carta || ''}</td>
                <td>
                    <button class="btn btn-sm btn-danger btnDevolver" data-codigo="${c.codigo_mcs}">
                        <i class="fas fa-undo-alt"></i> Devolver
                    </button>
                </td>
            </tr>
        `);
    });

    tabla.DataTable({
        language: { url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
        pageLength: 10,
        responsive: true,
        lengthMenu: [5, 10, 25, 50, 100],
        ordering: false
    });

    // Evento para devolver carta
    tabla.off('click', '.btnDevolver').on('click', '.btnDevolver', function () {
        const codigoMcs = $(this).data('codigo');

        if (confirm("¿Estás seguro que deseas devolver esta carta?")) {
            $.ajax({
                url: '../Ajax/ajaxReportarCartasLista.php',
                type: 'POST',
                dataType: 'json',
                data: {
                    accion: 'devolverCarta',
                    codigo_mcs: codigoMcs
                },
                success: function (resp) {
                    if (resp.status === 'ok') {
                        alert('✅ Carta devuelta correctamente');
                        listarCartas();
                    } else {
                        alert('⚠️ ' + (resp.message || 'Error al devolver la carta'));
                    }
                },
                error: function () {
                    alert('❌ Error de conexión con el servidor');
                }
            });
        }
    });
}

function descargarExcel() {
    const tipoCarta = $('#filtro_tipo_carta').val();
    const usuario = $('#filtro_usuario').val();

    const params = new URLSearchParams({
        accion: 'descargarExcel',
        tipoCarta: tipoCarta,
        usuario_id: usuario
    });

    window.open('../Ajax/ajaxReportarCartasLista.php?' + params.toString(), '_blank');
}
