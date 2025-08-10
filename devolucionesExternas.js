$(document).ready(function () {
    console.log("✅ devolucionesExternas.js cargado correctamente");

    let tablaHistorial, motivosGlobal = [];

    cargarTablaHistorial();
    obtenerMotivosDevolucion();

    /* ============================================================
       ✅ 1. HISTORIAL DE DEVOLUCIONES
    ============================================================ */
    function cargarTablaHistorial() {
        tablaHistorial = $("#tablaHistorialDevoluciones").DataTable({
            ajax: {
                url: "../Ajax/ajaxDevolucionesExternas.php",
                type: "POST",
                dataType: "json",
                data: d => ({
                    accion: "listarHistorial",
                    fecha_inicio: $("#filtro_fecha_inicio").val(),
                    fecha_fin: $("#filtro_fecha_fin").val(),
                    numero_hr: $("#filtro_numero_hr").val(),
                    motivo_id: $("#filtro_motivo").val()
                }),
                dataSrc: ""
            },
            columns: [
                { data: "codigo_mcs" },
                { data: "village" },
                { data: "nombres" },
                { data: "tipo_carta" },
                { data: "numero_hr", className: "text-center" },
                { data: "fecha_devolucion", className: "text-center" },
                { data: "motivo" },
                {
                    data: "detalle",
                    render: d =>
                        `<span data-toggle="tooltip" title="${d || ''}">
                            ${(d && d.length > 15) ? d.substr(0, 15) + '...' : (d || '')}
                        </span>`
                },
                { data: "devuelta_por" },
                { data: "fecha_reenvio", className: "text-center" },
                {
                    data: null,
                    className: "text-center",
                    render: d => {
                        let btns = `
                            <button class="btn btn-outline-danger btn-sm btnEliminar" data-id="${d.id}">
                                <i class="fas fa-trash"></i>
                            </button>`;
                        if (!d.fecha_reenvio) {
                            btns += ` 
                            <button class="btn btn-outline-primary btn-sm btnReenviar" data-id="${d.id}">
                                <i class="fas fa-paper-plane"></i>
                            </button>`;
                        }
                        return btns;
                    }
                }
            ],
            dom: "Bfrtip",
            buttons: [
                {
                    extend: "excelHtml5",
                    title: "Registro de Devoluciones",
                    text: '<i class="fas fa-file-excel"></i>',
                    className: "btn btn-outline-success btn-sm"
                },
                {
                    extend: "pdfHtml5",
                    title: "Registro de Devoluciones",
                    text: '<i class="fas fa-file-pdf"></i>',
                    className: "btn btn-outline-danger btn-sm"
                },
                {
                    extend: "print",
                    title: "Registro de Devoluciones",
                    text: '<i class="fas fa-print"></i>',
                    className: "btn btn-outline-primary btn-sm"
                }
            ],
            responsive: true,
            language: { url: "//cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json" }
        });
    }

    $("#btnFiltrarHistorial").click(() => tablaHistorial.ajax.reload());
    $("#btnLimpiarFiltros").click(() => {
        $("#filtro_fecha_inicio,#filtro_fecha_fin,#filtro_numero_hr,#filtro_motivo").val('');
        tablaHistorial.ajax.reload();
    });

    /* ============================================================
       ✅ 2. OBTENER MOTIVOS
    ============================================================ */
    function obtenerMotivosDevolucion() {
        $.ajax({
            url: "../Ajax/ajaxDevolucionesExternas.php",
            type: "POST",
            dataType: "json",
            data: { accion: "obtenerMotivos" },
            success: function (resp) {
                if (!Array.isArray(resp)) {
                    console.error("Error en obtenerMotivos:", resp);
                    return;
                }
                motivosGlobal = resp;
                const sel = $("#filtro_motivo").empty().append('<option value="">Todos</option>');
                motivosGlobal.forEach(m => sel.append(`<option value="${m.id}">${m.descripcion}</option>`));
            }
        });
    }

    /* ============================================================
       ✅ 3. MODAL DE REGISTRO DEVOLUCIÓN
    ============================================================ */
    $("#btnAbrirModal").click(() => {
        $("#buscar_codigo_mcs,#buscar_child_number").val('');
        $("#tablaBusquedaCartas tbody").empty();
        $("#modalDevolucion").modal("show");
    });

    $("#btnBuscarCartas").click(() => {
        const codigo = $("#buscar_codigo_mcs").val();
        const child = $("#buscar_child_number").val();

        if (!codigo && !child) {
            Swal.fire("Aviso", "Ingrese al menos un dato para buscar.", "warning");
            return;
        }

        $.ajax({
            url: "../Ajax/ajaxDevolucionesExternas.php",
            type: "POST",
            dataType: "json",
            data: {
                accion: "buscarCartas",
                codigo_mcs: codigo,
                child_number: child
            },
            success: function (data) {
                const tbody = $("#tablaBusquedaCartas tbody").empty();
                if (!Array.isArray(data) || data.length === 0) {
                    tbody.append(`<tr><td colspan="10" class="text-center">No se encontraron cartas enviadas</td></tr>`);
                    return;
                }

                data.forEach(c => {
                    const fechaHoy = new Date().toISOString().split("T")[0];
                    tbody.append(`
                        <tr>
                            <td class="text-center">
                                
                                <input type="checkbox" class="checkCarta" value="${c.codigo_mcs}" data-hr="${c.hoja_ruta_id}">
                            </td>
                            <td>${c.codigo_mcs}</td>
                            <td>${c.village}</td>
                            <td>${c.nombres}</td>
                            <td>${c.tipo_carta}</td>
                            <td class="text-center">${c.numero_hr}</td>
                            <td class="text-center">${c.fecha_envio}</td>
                            <td>
                                <input type="date" class="form-control form-control-sm fechaDev" 
                                    data-codigo="${c.codigo_mcs}" value="${fechaHoy}">
                            </td>
                            <td>
                                <select class="form-control form-control-sm motivoSelect" data-codigo="${c.codigo_mcs}">
                                    <option value="">Seleccione...</option>
                                    ${motivosGlobal.map(m => `<option value="${m.id}">${m.descripcion}</option>`).join('')}
                                </select>
                            </td>
                            <td>
                                <input type="text" class="form-control form-control-sm detalleInput" 
                                    data-codigo="${c.codigo_mcs}">
                            </td>
                        </tr>
                    `);
                });
            }
        });
    });

    $("#checkAll").change(function () {
        $(".checkCarta").prop("checked", $(this).prop("checked"));
    });

    $("#btnConfirmarDevoluciones").click(() => {
        const seleccionadas = $(".checkCarta:checked");
        if (seleccionadas.length === 0) {
            Swal.fire("Aviso", "Seleccione al menos una carta", "warning");
            return;
        }
    
        let procesadas = 0;
        seleccionadas.each(function () {
            const codigo = $(this).val();
            const hr = $(this).data("hr");
            const motivo = $(`.motivoSelect[data-codigo='${codigo}']`).val();
            const detalle = $(`.detalleInput[data-codigo='${codigo}']`).val();
            const fechaDev = $(`.fechaDev[data-codigo='${codigo}']`).val();
    
            if (!motivo) {
                Swal.fire("Aviso", `Seleccione un motivo para la carta ${codigo}`, "warning");
                return false;
            }
    
            $.ajax({
                url: "../Ajax/ajaxDevolucionesExternas.php",
                type: "POST",
                dataType: "json",
                data: {
                    accion: "registrarDevolucion",
                    codigo_mcs: codigo,
                    hoja_ruta_id: hr,
                    motivo_id: motivo,
                    detalle: detalle,
                    fecha_devolucion: fechaDev,
                    devuelta_por: USUARIO_LOGUEADO  // ✅ NUEVO PARÁMETRO REQUERIDO
                },
                success: function () {
                    procesadas++;
                    if (procesadas === seleccionadas.length) {
                        Swal.fire("Éxito", "Devoluciones registradas correctamente", "success");
                        $("#modalDevolucion").modal("hide");
                        tablaHistorial.ajax.reload(null, false);
                    }
                }
            });
        });
    });


    /* ============================================================
       ✅ 4. ELIMINAR DEVOLUCIÓN
    ============================================================ */
    $("#tablaHistorialDevoluciones").on("click", ".btnEliminar", function () {
        const id = $(this).data("id");
        const fila = $(this).closest("tr");

        Swal.fire({
            title: "¿Eliminar devolución?",
            text: "Esta acción no se puede deshacer",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Sí, eliminar"
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: "../Ajax/ajaxDevolucionesExternas.php",
                    type: "POST",
                    dataType: "json",
                    data: { accion: "eliminarDevolucion", id: id },
                    success: function (resp) {
                        if (resp.success) {
                            Swal.fire("Eliminado", "La devolución ha sido eliminada.", "success");
                            tablaHistorial.row(fila).remove().draw(false);
                        } else {
                            Swal.fire("Error", resp.error || "No se pudo eliminar", "error");
                        }
                    }
                });
            }
        });
    });

    /* ============================================================
       ✅ 5. REGISTRAR REENVÍO URGENTE
    ============================================================ */
    $("#tablaHistorialDevoluciones").on("click", ".btnReenviar", function () {
        const id = $(this).data("id");
        $("#id_devolucion_reenvio").val(id);
        $("#fecha_reenvio").val(new Date().toISOString().split("T")[0]);
        $("#medio_reenvio").val("Courier");
        $("#modalReenvio").modal("show");
    });

    $("#btnGuardarReenvio").click(() => {
        const id = $("#id_devolucion_reenvio").val();
        const fecha = $("#fecha_reenvio").val();
        const medio = $("#medio_reenvio").val();

        if (!fecha) {
            Swal.fire("Aviso", "Seleccione una fecha de reenvío", "warning");
            return;
        }

        $.ajax({
            url: "../Ajax/ajaxDevolucionesExternas.php",
            type: "POST",
            dataType: "json",
            data: {
                accion: "registrarReenvio",
                id: id,
                fecha_reenvio: fecha,
                medio_reenvio: medio
            },
            success: function (resp) {
                if (resp.success) {
                    Swal.fire("Éxito", "Reenvío registrado correctamente", "success");
                    $("#modalReenvio").modal("hide");
                    tablaHistorial.ajax.reload(null, false);
                } else {
                    Swal.fire("Error", resp.error || "No se pudo registrar el reenvío", "error");
                }
            }
        });
    });
});
