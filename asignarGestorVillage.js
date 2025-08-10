// 📁 Js/asignarGestorVillage.js
$(document).ready(function () {
    let gestoresGlobales = [];
    let villagesSeleccionados = new Set();

    // ✅ Mostrar alertas
    function mostrarAlerta(mensaje, tipo = 'success') {
        $('#alertas').html(`
            <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
                ${mensaje}
                <button type="button" class="close" data-dismiss="alert">
                    <span>&times;</span>
                </button>
            </div>
        `);
    }

    function inicializarTabla() {
        $('#tabla-villages').DataTable({
            pageLength: 10,
            order: [],
            responsive: false, // ✅ Desactivamos completamente el modo responsive
            scrollX: true,     // ✅ Permitimos desplazamiento horizontal en móviles
            autoWidth: true,   // ✅ Ajuste automático del ancho
            columnDefs: [{ targets: '_all', defaultContent: '' }],
            language: { url: '//cdn.datatables.net/plug-ins/1.13.4/i18n/es-ES.json' },
            drawCallback: function () {
                $('#tabla-villages tbody tr.fila-principal').removeClass('odd even');
            }
        });
    }

    // ✅ Cargar villages con checkbox
    function cargarVillages() {
        console.log("🔄 Cargando villages...");
        const tabla = $('#tabla-villages');
        const tbody = tabla.find('tbody');

        if ($.fn.DataTable.isDataTable(tabla)) {
            tabla.DataTable().clear().destroy();
        }
        tbody.empty();

        $.ajax({
            url: '../Ajax/ajaxAsignarGestorVillage.php',
            type: 'POST',
            data: { accion: 'listar_villages', gestor_id: 0 },
            dataType: 'json',
            success: function (data) {
                console.log("📥 Respuesta listar_villages:", data);

                const villagesAgrupados = {};
                data.forEach(v => {
                    const id = v.village_id;
                    if (!villagesAgrupados[id]) {
                        villagesAgrupados[id] = { nombre: v.nombre, detalles: [] };
                    }
                    villagesAgrupados[id].detalles.push({
                        camel_village: v.camel_village,
                        camel_id: v.camel_id,
                        village_id: id
                    });
                });

                let ajaxPendientes = Object.keys(villagesAgrupados).length;

                Object.entries(villagesAgrupados).forEach(([villageId, group]) => {
                    const detallesConCamel = group.detalles.filter(d => d.camel_id && d.camel_id !== '-');
                    const hasCamel = detallesConCamel.length > 0;

                    // ✅ Checkbox en la primera columna
                    const checkbox = `<input type="checkbox" class="select-village" data-id="${villageId}" ${villagesSeleccionados.has(Number(villageId)) ? "checked" : ""}>`;

                    const btnToggle = hasCamel
                        ? `<button class="btn btn-sm btn-outline-primary toggle-camels me-1" data-village="${villageId}">➕</button>`
                        : '';

                    const selectGestores = `
                        <select class="form-control form-control-sm select-gestor d-inline-block w-auto" data-village="${villageId}">
                            <option value="">Asignar gestor</option>
                            ${gestoresGlobales.map(g => `<option value="${g.Cedula}">${g.nombre_completo}</option>`).join('')}
                        </select>`;

                    const btnEditarVillage = `<button class="btn btn-warning btn-sm editar-village" data-id="${villageId}" data-nombre="${group.nombre}">✏️</button>`;
                    const btnEliminarVillage = `<button class="btn btn-danger btn-sm btn-delete" data-village="${villageId}">🗑️</button>`;

                    const filaHTML = `
                        <tr class="fila-principal bg-light align-middle" data-village="${villageId}">
                            <td>${checkbox}</td>
                            <td>${btnToggle}${group.nombre}</td>
                            <td>-</td>
                            <td>-</td>
                            <td data-celda="gestores"><span class="text-muted">Cargando...</span></td>
                            <td data-celda="acciones">
                                <span class="bloque-select">${selectGestores}</span>
                                ${btnEditarVillage}
                                ${btnEliminarVillage}
                            </td>
                        </tr>`;
                    tbody.append(filaHTML);

                    $.ajax({
                        url: '../Ajax/ajaxAsignarGestorVillage.php',
                        type: 'POST',
                        data: { accion: 'listar_gestores', village_id: villageId },
                        dataType: 'json',
                        success: function (gestores) {
                            const celda = $(`tr[data-village="${villageId}"] td[data-celda="gestores"]`);
                            if (!Array.isArray(gestores) || gestores.length === 0) {
                                celda.html('<span class="text-muted">Sin asignar</span>');
                            } else {
                                let badges = '<div class="gestores-badges d-flex flex-wrap gap-1">';
                                gestores.forEach(g => {
                                    badges += `
                                        <span class="badge badge-info text-dark d-inline-flex align-items-center">
                                            ${g.nombre_completo}
                                            <button class="btn btn-sm btn-link p-0 ms-1 text-danger eliminar-gestor"
                                                data-id="${g.Cedula}" data-village="${villageId}" title="Eliminar gestor">❌</button>
                                        </span>`;
                                });
                                badges += '</div>';
                                celda.html(badges);
                            }

                            if (detallesConCamel.length > 0) {
                                const camelHTML = detallesConCamel.map(det => `
                                    <tr class="subfila align-middle bg-white camel-row" data-parent="${villageId}" style="display:none;">
                                        <td></td> <!-- CheckBox vacío -->
                                        <td></td> <!-- Village vacío (subfila no necesita nombre) -->
                                        <td class="fw-bold text-primary">${det.camel_village}</td> <!-- Camel Village en su columna correcta -->
                                        <td>${det.camel_id}</td> <!-- Camel ID -->
                                        <td></td> <!-- Gestores Asignados vacío -->
                                        <td>
                                            <button class="btn btn-warning btn-sm btn-edit me-1"
                                                data-village="${det.village_id}"
                                                data-camel_village="${det.camel_village}"
                                                data-camel_id="${det.camel_id}">✏️</button>
                                            <button class="btn btn-danger btn-sm btn-delete"
                                                data-village="${det.village_id}" data-camel="${det.camel_id}">🗑️</button>
                                        </td>
                                    </tr>`).join('');
                                $(`tr[data-village="${villageId}"]`).after(camelHTML);
                            }

                            ajaxPendientes--;
                            if (ajaxPendientes === 0) {
                                inicializarTabla();
                            }
                        }
                    });
                });
            }
        });
    }

    // ✅ Manejo de selección de villages y activación del botón masivo
    $(document).on('change', '.select-village', function () {
        const villageId = Number($(this).data('id'));
        if ($(this).is(':checked')) {
            villagesSeleccionados.add(villageId);
        } else {
            villagesSeleccionados.delete(villageId);
        }
        actualizarBotonMasivo();
    });

    $('#select-all-villages').on('change', function () {
        const isChecked = $(this).is(':checked');
        $('.select-village').prop('checked', isChecked).trigger('change');
    });

    function actualizarBotonMasivo() {
        const total = villagesSeleccionados.size;
        $('#btn-asignar-masivo').prop('disabled', total === 0);
        $('#contador-villages').text(`Seleccionados: ${total} villages`);
    }
    // ✅ Botón para abrir el modal de asignación masiva
    $('#btn-asignar-masivo').on('click', function () {
        // Cargar gestores en el select del modal
        const select = $('#gestor-masivo');
        select.empty().append('<option value="">Seleccione...</option>');
        gestoresGlobales.forEach(g => {
            select.append(`<option value="${g.Cedula}">${g.nombre_completo}</option>`);
        });

        $('#village-ids-masivo').val([...villagesSeleccionados].join(','));
        $('#contador-villages').text(`Seleccionados: ${villagesSeleccionados.size} villages`);
        $('#modalAsignarMasivo').modal('show');
    });

    // ✅ Asignación masiva
    $('#form-asignar-masivo').submit(function (e) {
        e.preventDefault();
        const datos = {
            accion: 'asignar_masivo',
            gestor_id: $('#gestor-masivo').val(),
            village_ids: $('#village-ids-masivo').val()
        };

        if (!datos.gestor_id) {
            mostrarAlerta("Debe seleccionar un gestor", "danger");
            return;
        }

        $.post('../Ajax/ajaxAsignarGestorVillage.php', datos, function (resp) {
            console.log("📥 Respuesta asignar_masivo:", resp);
            mostrarAlerta(resp.message, resp.status === 'success' ? 'success' : 'danger');
            if (resp.status === 'success') {
                $('#modalAsignarMasivo').modal('hide');
                villagesSeleccionados.clear();
                $('#tabla-villages').DataTable().clear().destroy();
                cargarVillages();
            }
        }, 'json');
    });

    // ✅ Toggle Camel Rows
    $(document).on('click', '.toggle-camels', function () {
        const villageId = $(this).data('village');
        const btn = $(this);
        const subfilas = $(`.camel-row[data-parent="${villageId}"]`);

        if (subfilas.is(':visible')) {
            subfilas.hide();
            btn.text('➕');
        } else {
            subfilas.show();
            btn.text('➖');
        }
    });

    $(document).on('click', '.fila-principal', function (e) {
        if ($(e.target).is('button, select, option, input')) return;
        const villageId = $(this).data('village');
        const btn = $(this).find('.toggle-camels');
        const subfilas = $(`.camel-row[data-parent="${villageId}"]`);

        if (subfilas.is(':visible')) {
            subfilas.hide();
            btn.text('➕');
        } else {
            subfilas.show();
            btn.text('➖');
        }
    });

    // ✅ Asignar gestor individual
    $(document).on('change', '.select-gestor', function () {
        const gestor_id = $(this).val();
        const village_id = $(this).data('village');
        if (!gestor_id) return;

        $.post('../Ajax/ajaxAsignarGestorVillage.php', {
            accion: 'asignar',
            gestor_id,
            village_id
        }, function (resp) {
            mostrarAlerta(resp.message, resp.status === 'success' ? 'success' : 'danger');
            if (resp.status === 'success') {
                $('#tabla-villages').DataTable().clear().destroy();
                cargarVillages();
            }
        }, 'json');
    });

    // ✅ Eliminar gestor
    $(document).on('click', '.eliminar-gestor', function () {
        const gestor_id = $(this).data('id');
        const village_id = $(this).data('village');
        if (!confirm('¿Seguro que desea quitar este gestor del village?')) return;

        $.post('../Ajax/ajaxAsignarGestorVillage.php', {
            accion: 'eliminar',
            gestor_id,
            village_id
        }, function (resp) {
            mostrarAlerta(resp.message, resp.status === 'success' ? 'success' : 'danger');
            if (resp.status === 'success') {
                $('#tabla-villages').DataTable().clear().destroy();
                cargarVillages();
            }
        }, 'json');
    });

    // ✅ Eliminar Village o Camel Village
    $(document).on('click', '.btn-delete', function () {
        const village_id = $(this).data('village');
        const camel_id = $(this).data('camel') || null;
        const accion = camel_id ? 'eliminar_camel_village' : 'eliminar_village';
        const mensaje = camel_id
            ? '¿Desea eliminar este Camel Village?'
            : '¿Desea eliminar este Village y sus camels?';
        if (!confirm(mensaje)) return;

        $.post('../Ajax/ajaxAsignarGestorVillage.php', {
            accion, village_id, camel_id
        }, function (resp) {
            mostrarAlerta(resp.message, resp.status === 'success' ? 'success' : 'danger');
            if (resp.status === 'success') {
                $('#tabla-villages').DataTable().clear().destroy();
                cargarVillages();
            }
        }, 'json');
    });

    // ✅ Editar Village
    $(document).on('click', '.editar-village', function () {
        $('#edit-id').val($(this).data('id'));
        $('#edit-nombre').val($(this).data('nombre'));
        $('#modalEditarVillage').modal('show');
    });

    $('#form-editar-village').submit(function (e) {
        e.preventDefault();
        const datos = Object.fromEntries(new FormData(this).entries());
        datos.accion = 'editar_village';

        $.post('../Ajax/ajaxAsignarGestorVillage.php', datos, function (resp) {
            mostrarAlerta(resp.message, resp.status === 'success' ? 'success' : 'danger');
            if (resp.status === 'success') {
                $('#modalEditarVillage').modal('hide');
                $('#tabla-villages').DataTable().clear().destroy();
                cargarVillages();
            }
        }, 'json');
    });

    // ✅ Editar Camel Village
    $(document).on('click', '.btn-edit', function () {
        $('#edit-camel-village-id').val($(this).data('village'));
        $('#edit-camel-id-original').val($(this).data('camel_id'));
        $('#edit-camel-village-name').val($(this).data('camel_village'));
        $('#edit-camel-id-new').val($(this).data('camel_id'));
        $('#modalEditarCamel').modal('show');
    });

    $('#form-editar-camel').submit(function (e) {
        e.preventDefault();
        const datos = Object.fromEntries(new FormData(this).entries());
        datos.accion = 'editar_camel_village';

        $.post('../Ajax/ajaxAsignarGestorVillage.php', datos, function (resp) {
            mostrarAlerta(resp.message, resp.status === 'success' ? 'success' : 'danger');
            if (resp.status === 'success') {
                $('#modalEditarCamel').modal('hide');
                $('#tabla-villages').DataTable().clear().destroy();
                cargarVillages();
            }
        }, 'json');
    });

    // ✅ Nuevo Village / Camel
    $('#modalNuevoVillage').on('show.bs.modal', function () {
        const select = $('#controlador-village');
        select.find('option:not([value=""]):not([value="nuevo"])').remove();

        $.post('../Ajax/ajaxAsignarGestorVillage.php', { accion: 'listar_villages', gestor_id: 0 }, function (data) {
            const uniqueIds = new Set();
            data.forEach(v => {
                if (!uniqueIds.has(v.village_id)) {
                    uniqueIds.add(v.village_id);
                    select.append(`<option value="${v.village_id}">${v.nombre}</option>`);
                }
            });
        }, 'json');

        $('#nombre-village').prop('readonly', false).val('');
        $('#village-id-ref').val('');
        $('#form-nuevo-village-inteligente')[0].reset();
        $('#camel_village, #camel_id').prop('disabled', false).val('');
    });

    $('#controlador-village').change(function () {
        const selected = $(this).val();
        const nombreField = $('#nombre-village');
        const villageIdField = $('#village-id-ref');
        const camelFields = $('#camel_village, #camel_id');

        if (selected === 'nuevo') {
            nombreField.prop('readonly', false).val('');
            villageIdField.val('');
            camelFields.prop('disabled', false).val('');
        } else if (selected) {
            const nombre = $(this).find('option:selected').text();
            nombreField.prop('readonly', true).val(nombre);
            villageIdField.val(selected);
            camelFields.prop('disabled', false);
        } else {
            nombreField.prop('readonly', false).val('');
            villageIdField.val('');
            camelFields.prop('disabled', false).val('');
        }
    });

    $('#form-nuevo-village-inteligente').submit(function (e) {
        e.preventDefault();
        const datos = Object.fromEntries(new FormData(this).entries());

        if (!datos.village_id && datos.camel_village && datos.camel_id) {
            datos.accion = 'crear_village_con_camel';
        } else {
            datos.accion = datos.village_id ? 'crear_camel_village' : 'crear_village';
        }

        $.post('../Ajax/ajaxAsignarGestorVillage.php', datos, function (resp) {
            mostrarAlerta(resp.message, resp.status === 'success' ? 'success' : 'danger');
            if (resp.status === 'success') {
                $('#modalNuevoVillage').modal('hide');
                $('#tabla-villages').DataTable().clear().destroy();
                cargarVillages();
            }
        }, 'json');
    });

    // ✅ Cargar gestores globales al iniciar
    function cargarGestoresDisponibles() {
        console.log("🔄 Cargando gestores globales...");
        $.ajax({
            url: '../Ajax/ajaxAsignarGestorVillage.php',
            type: 'POST',
            data: { accion: 'listar_gestores_global' },
            dataType: 'json',
            success: function (data) {
                gestoresGlobales = data || [];
                cargarVillages();
            }
        });
    }

    cargarGestoresDisponibles();
});
