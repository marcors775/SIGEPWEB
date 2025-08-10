$(document).ready(function () {
    console.log("✅ hojaRuta.js cargado correctamente");

    let tablaCartasHR;
    let tablaHojasRuta;
    let observacionesGlobal = []; // ✅ Para Punto Focal

    // ✅ Inicialización principal
    obtenerSiguienteNumeroHR();
    cargarOrganizaciones();
    cargarHojasRuta();
    cargarObservacionesPuntoFocal();

    // ✅ Inicializar DataTables (Cartas para Hoja de Ruta)
    tablaCartasHR = $('#tablaCartasHR').DataTable({
        language: { url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
        responsive: true,
        columns: [
            {
                data: 'codigo_mcs',
                defaultContent: '',
                render: (data) => `<input type="checkbox" class="chk-carta" data-codigo="${data || ''}">`,
                orderable: false,
                className: "text-center"
            },
            { data: 'village', defaultContent: '-' },
            { data: 'nombres', defaultContent: '-' },
            { data: 'codigo_mcs', defaultContent: '-' },
            {
                data: 'tipo_envio',
                defaultContent: '-',
                render: (data) =>
                    `<span class="badge badge-${data === 'DIGITAL' ? 'info' : (data === 'APP' ? 'success' : 'secondary')}">
                        ${data || 'SIN DEFINIR'}
                    </span>`
            },
            {
                data: 'tipo_asignacion', // ✅ NUEVO INDICADOR
                defaultContent: '-',
                render: (data) => {
                    if (data === 'reasignada') {
                        return `<span class="badge badge-warning">Reasignada</span>`;
                    }
                    return `<span class="badge badge-success">Nueva</span>`;
                },
                className: "text-center"
            },
            {
                data: 'codigo_mcs',
                defaultContent: '',
                render: (codigo) => `
                    <button class="btn btn-sm btn-danger btn-devolver-carta" data-codigo="${codigo || ''}">
                        <i class="fas fa-undo"></i>
                    </button>
                `,
                orderable: false,
                className: "text-center"
            }
        ]
    });

    // ✅ Inicializar DataTables (Hojas de Ruta generadas)
    tablaHojasRuta = $('#tablaHojasRuta').DataTable({
        language: { url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
        responsive: true,
        columns: [
            { data: 'numero_hr', defaultContent: '-' },
            {
                data: 'fecha_envio',
                defaultContent: '-',
                render: (data) => {
                    if (!data) return `<span class="text-muted">-</span>`;
                    const partes = data.split("-");
                    if (partes.length !== 3) return data;
                    const [anio, mes, dia] = partes;
                    return `<span title="${data}">${dia}/${mes}/${anio}</span>`;
                }
            },
            {
                data: 'organizacion',
                defaultContent: '-',
                render: (data) => {
                    if (!data) return `<span class="text-muted">-</span>`;
                    const corto = data.length > 10 ? data.substring(0, 10) + "..." : data;
                    return `<span title="${data}">${corto}</span>`;
                }
            },
            {
                data: 'estado',
                defaultContent: '-',
                render: (data) => {
                    data = data || '-';
                    return `<span class="${data === 'abierta' ? 'estado-abierta' : 'estado-cerrada'}">${data}</span>`;
                }
            },
            { data: 'total_cartas', className: "text-center", defaultContent: '0' },
            {
                data: 'id',
                defaultContent: '',
                orderable: false,
                className: "text-center",
                render: (id, type, row) => {
                    id = id || '';
                    const estado = row.estado || '';
                    const esAbierta = estado === 'abierta';
                
                    return `
                        <button class="btn btn-sm btn-primary btn-descargar-hr" data-id="${id}" data-formato="EXCEL">
                            <i class="fas fa-file-excel"></i>
                        </button>
                        <button class="btn btn-sm btn-danger btn-descargar-hr" data-id="${id}" data-formato="PDF">
                            <i class="fas fa-file-pdf"></i>
                        </button>
                        ${esAbierta ? `
                        <button class="btn btn-sm btn-secondary btn-ver-cartas" data-id="${id}">
                            <i class="fas fa-eye"></i>
                        </button>` : ''}
                        ${esAbierta ? `
                        <button class="btn btn-sm btn-warning btn-cerrar-hr" data-id="${id}">
                            <i class="fas fa-lock"></i>
                        </button>` : `
                        <button class="btn btn-sm btn-info btn-reabrir-hr" data-id="${id}">
                            <i class="fas fa-unlock"></i>
                        </button>`}
                    `;
                }

            }

        ]
    });

    // ✅ Selección masiva (checkbox principal)
    $('#tablaCartasHR thead').on('change', '#chk-select-all', function () {
        const checked = $(this).is(":checked");
        $('#tablaCartasHR .chk-carta').prop("checked", checked);
    });

    // ✅ Botón: Cargar cartas listas
    $("#btnCargarCartas").on("click", function () {
        const organizacion_id = $("#organizacion_id").val();
        if (!organizacion_id) {
            Swal.fire("Aviso", "Seleccione una organización", "warning");
            return;
        }
    
        $.ajax({
            url: '../Ajax/ajaxHojaRuta.php',
            type: 'POST',
            dataType: 'json',
            data: {
                accion: 'listarCartasParaHojaRuta',
                organizacion_id: organizacion_id
            },
            success: function (data) {
                if (!Array.isArray(data)) {
                    Swal.fire("Error", "Respuesta inesperada al listar Cartas", "error");
                    return;
                }
    
                data = data.filter(item => item && typeof item === 'object');
                console.log("✅ Cartas recibidas:", data);
    
                if (data.length === 0) {
                    Swal.fire("Sin cartas", "No hay cartas listas para generar la Hoja de Ruta.", "info");
                }
    
                tablaCartasHR.clear().rows.add(data).draw();
                $("#chk-select-all").prop("checked", false);
            },
            error: function () {
                Swal.fire('Error', 'No se pudieron cargar las cartas', 'error');
            }
        });
    });


// ✅ Botón: Generar Hoja de Ruta (nueva)
$("#btnGenerarHR").on("click", function () {
    const numero_hr = $("#numero_hr").val();
    const fecha_envio = $("#fecha_envio").val();
    const organizacion_id = $("#organizacion_id").val();

    let cartasSeleccionadas = [];
    let hayError = false;

    // ✅ Recolectar cartas seleccionadas
    $(".chk-carta:checked").each(function () {
        const mcs = $(this).data("codigo");
        const rowData = tablaCartasHR.rows().data().toArray().find(c => c.codigo_mcs === mcs);

        // ✅ Validación de tipo de envío antes de generar
        if (rowData && (!rowData.tipo_envio || rowData.tipo_envio === "SIN DEFINIR")) {
            Swal.fire("Aviso", `La carta ${mcs} no tiene tipo de envío definido. Corrige antes de generar la HR.`, "warning");
            hayError = true;
            return false;
        }
        cartasSeleccionadas.push(mcs);
    });

    // ✅ Validaciones antes de enviar
    if (!organizacion_id) {
        Swal.fire("Aviso", "Debe seleccionar una organización antes de generar la Hoja de Ruta.", "warning");
        return;
    }

    if (cartasSeleccionadas.length === 0) {
        Swal.fire("Aviso", "Debe seleccionar al menos una carta para generar la Hoja de Ruta.", "warning");
        return;
    }

    if (!numero_hr || !fecha_envio) {
        Swal.fire("Aviso", "Número de Hoja de Ruta o fecha no válidos.", "warning");
        return;
    }

    if (hayError) {
        return;
    }

    // ✅ Proceso AJAX para generar la HR
    $.ajax({
        url: '../Ajax/ajaxHojaRuta.php',
        type: 'POST',
        dataType: 'json',
        data: {
            accion: 'crearHojaRuta',
            numero_hr: numero_hr,
            fecha_envio: fecha_envio,
            organizacion_id: organizacion_id
        },
        success: function (result) {
            if (result.status === "success") {
                const hoja_ruta_id = result.hoja_ruta_id;

                $.ajax({
                    url: '../Ajax/ajaxHojaRuta.php',
                    type: 'POST',
                    dataType: 'json',
                    traditional: true,
                    data: {
                        accion: 'asignarCartasAHojaRuta',
                        hoja_ruta_id: hoja_ruta_id,
                        'cartas[]': cartasSeleccionadas
                    },
                    success: function (r2) {
                        if (r2.status === "success") {
                            Swal.fire("Éxito", "Hoja de Ruta generada correctamente", "success");
                            tablaCartasHR.clear().draw();
                            obtenerSiguienteNumeroHR();
                            cargarHojasRuta();
                        } else {
                            Swal.fire("Advertencia", r2.message, "warning");
                        }
                    },
                    error: function () {
                        Swal.fire("Error", "No se pudieron asignar las cartas", "error");
                    }
                });
            } else {
                Swal.fire("Error", result.message, "error");
            }
        },
        error: function () {
            Swal.fire("Error", "No se pudo crear la Hoja de Ruta", "error");
        }
    });
});


    // ✅ Botón: Agregar cartas a HR existente (reabierta)
    $("#btnAgregarExistente").on("click", function () {
        const organizacion_id = $("#organizacion_id").val();
        if (!organizacion_id) {
            Swal.fire("Aviso", "Seleccione una organización antes", "warning");
            return;
        }

        $.ajax({
            url: '../Ajax/ajaxHojaRuta.php',
            type: 'POST',
            dataType: 'json',
            data: { accion: 'listarHojasDeRuta', organizacion_id: organizacion_id },
            success: function (data) {
                const abiertas = data.filter(hr => hr.estado === 'abierta');
                if (abiertas.length === 0) {
                    Swal.fire("Sin HR abiertas", "No hay Hojas de Ruta abiertas para esta organización.", "info");
                    return;
                }

                let opciones = '<option value="">Seleccione...</option>';
                abiertas.forEach(hr => {
                    opciones += `<option value="${hr.id}">HR #${hr.numero_hr} - ${hr.fecha_envio}</option>`;
                });

                Swal.fire({
                    title: "Agregar a HR existente",
                    html: `
                        <div style="display:flex; justify-content:center;">
                            <select id="hrExistente" class="form-control" style="max-width:250px; text-align:center;">
                                ${opciones}
                            </select>
                        </div>
                    `,
                    confirmButtonText: "Asignar",
                    showCancelButton: true,
                    cancelButtonText: "Cancelar",
                    preConfirm: () => {
                        const sel = document.getElementById("hrExistente").value;
                        if (!sel) {
                            Swal.showValidationMessage("Seleccione una Hoja de Ruta");
                        }
                        return sel;
                    }
                }).then((result) => {
                    if (result.isConfirmed) {
                        asignarCartasAExistente(result.value);
                    }
                });
            },
            error: function () {
                Swal.fire("Error", "No se pudo cargar Hojas de Ruta abiertas", "error");
            }
        });
    });

    function asignarCartasAExistente(hoja_ruta_id) {
        const cartasSeleccionadas = [];
        $(".chk-carta:checked").each(function () {
            cartasSeleccionadas.push($(this).data("codigo"));
        });

        if (cartasSeleccionadas.length === 0) {
            Swal.fire("Aviso", "Seleccione al menos una carta.", "warning");
            return;
        }

        $.ajax({
            url: '../Ajax/ajaxHojaRuta.php',
            type: 'POST',
            dataType: 'json',
            traditional: true,
            data: {
                accion: 'asignarCartasAHojaRuta',
                hoja_ruta_id: hoja_ruta_id,
                'cartas[]': cartasSeleccionadas
            },
            success: function (resp) {
                if (resp.status === "success") {
                    Swal.fire("Éxito", "Cartas asignadas a la HR existente", "success");
                    tablaCartasHR.clear().draw();
                    cargarHojasRuta();
                } else {
                    Swal.fire("Advertencia", resp.message, "warning");
                }
            },
            error: function () {
                Swal.fire("Error", "No se pudieron asignar las cartas", "error");
            }
        });
    }
        // ✅ Botón: Descargar Hoja de Ruta (con validación de observaciones "multiple")
        $('#tablaHojasRuta').on('click', '.btn-descargar-hr', function () {
            const hoja_ruta_id = $(this).data('id');
            const formato = $(this).data('formato');
        
            // Solicitar las cartas para validar
            $.ajax({
                url: '../Ajax/ajaxHojaRuta.php',
                type: 'POST',
                dataType: 'json',
                data: {
                    accion: 'listarCartasParaHojaRuta',
                    hoja_ruta_id: hoja_ruta_id
                },
                success: function (cartas) {
                    const problematicas = cartas.filter(c => {
                        const obs = (c.observaciones || '').toLowerCase();
                        return obs === 'multiple' || obs === 'm';
                    });
        
                    if (problematicas.length > 0) {
                        // Mostrar el modal con las cartas para corregir
                        const tbody = $("#tablaObservacionesInvalidasBody");
                        tbody.empty();
                        problematicas.forEach(carta => {
                            const fila = `
                                <tr>
                                    <td>${carta.village}</td>
                                    <td>${carta.codigo_mcs}</td>
                                    <td>${carta.observaciones || ''}</td>
                                    <td>
                                        <input type="text" class="form-control form-control-sm obs-correccion"
                                            data-codigo="${carta.codigo_mcs}" placeholder="Ej. multiple 41788599" />
                                    </td>
                                </tr>`;
                            tbody.append(fila);
                        });
        
                        // Guardar correcciones
                        $("#btnGuardarCorrecciones").off('click').on('click', function () {
                            const correcciones = [];
                            $(".obs-correccion").each(function () {
                                const codigo = $(this).data('codigo');
                                const valor = $(this).val().trim();
                                if (valor) {
                                    correcciones.push({ codigo_mcs: codigo, nueva_observacion: valor });
                                }
                            });
        
                            if (correcciones.length === 0) {
                                Swal.fire("Aviso", "Debe ingresar al menos una corrección", "warning");
                                return;
                            }
        
                            // Enviar correcciones
                            $.ajax({
                                url: '../Ajax/ajaxHojaRuta.php',
                                type: 'POST',
                                dataType: 'json',
                                data: {
                                    accion: 'corregirObservaciones',
                                    correcciones: JSON.stringify(correcciones)
                                },
                                success: function (r) {
                                    if (r.status === 'success') {
                                        $("#modalObservacionesInvalidas").modal("hide");
                                        Swal.fire("Corregido", "Observaciones actualizadas", "success").then(() => {
                                            window.open(`../Ajax/ajaxHojaRuta.php?accion=descargarHojaRuta&hoja_ruta_id=${hoja_ruta_id}&formato=${formato}`, '_blank');
                                        });
                                    } else {
                                        Swal.fire("Error", r.message || "No se pudieron guardar las correcciones", "error");
                                    }
                                },
                                error: function () {
                                    Swal.fire("Error", "Error al enviar correcciones", "error");
                                }
                            });
                        });
        
                        $("#modalObservacionesInvalidas").modal("show");
                    } else {
                        // Si todo está bien, proceder con descarga directa
                        window.open(`../Ajax/ajaxHojaRuta.php?accion=descargarHojaRuta&hoja_ruta_id=${hoja_ruta_id}&formato=${formato}`, '_blank');
                    }
                },
                error: function () {
                    Swal.fire("Error", "No se pudo validar las observaciones", "error");
                }
            });
        });
        // ✅ Inicializar DataTable del modal de cartas por HR
        const tablaDetalleCartasHR = $('#tablaDetalleCartasHR').DataTable({
            language: { url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
            pageLength: 5,
            lengthMenu: [5, 10, 20, 50],
            ordering: false,
            searching: true,
            responsive: true
        });


    // ✅ Botón: Cerrar Hoja de Ruta
    $('#tablaHojasRuta').on('click', '.btn-cerrar-hr', function () {
        const hoja_ruta_id = $(this).data('id');
        Swal.fire({
            title: "¿Cerrar Hoja de Ruta?",
            text: "No podrás asignar más cartas una vez cerrada.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, cerrar",
            cancelButtonText: "Cancelar"
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: '../Ajax/ajaxHojaRuta.php',
                    type: 'POST',
                    dataType: 'json',
                    data: { accion: 'cerrarHojaRuta', hoja_ruta_id: hoja_ruta_id },
                    success: function (resp) {
                        if (resp.status === "success") {
                            Swal.fire("Éxito", resp.message, "success");
                        } else {
                            Swal.fire("Advertencia", resp.message, "warning");
                        }
                        cargarHojasRuta(); // ✅ Siempre refrescar después
                    },
                    error: function () {
                        Swal.fire("Error", "No se pudo cerrar la Hoja de Ruta", "error");
                    }
                });
            }
        });
    });

    // ✅ Botón: Reabrir Hoja de Ruta
    $('#tablaHojasRuta').on('click', '.btn-reabrir-hr', function () {
        const hoja_ruta_id = $(this).data('id');
        Swal.fire({
            title: "¿Reabrir Hoja de Ruta?",
            text: "Podrás asignar nuevas cartas urgentes antes de volver a cerrarla.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Sí, reabrir",
            cancelButtonText: "Cancelar"
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: '../Ajax/ajaxHojaRuta.php',
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        accion: 'reabrirHojaRuta',
                        hoja_ruta_id: hoja_ruta_id
                    },
                    success: function (resp) {
                        if (resp.status === "success") {
                            Swal.fire("Éxito", resp.message, "success");
                            cargarHojasRuta();
                        } else {
                            Swal.fire("Advertencia", resp.message, "warning");
                        }
                    },
                    error: function () {
                        Swal.fire("Error", "No se pudo reabrir la Hoja de Ruta", "error");
                    }
                });
            }
        });
    });
    // ✅ Ver cartas de una Hoja de Ruta (modal)
    $('#tablaHojasRuta').on('click', '.btn-ver-cartas', function () {
        const hoja_ruta_id = $(this).data('id');
        let fila = $(this).closest('tr');
    
        // ✅ Corregir fila si es modo responsive
        if (fila.hasClass('child')) {
            fila = fila.prev();
        }
    
        const filaData = tablaHojasRuta.row(fila).data() || {};
        const estadoHR = filaData.estado || 'cerrada';
        const permitirAnular = (estadoHR !== 'cerrada');
    
        $.ajax({
            url: '../Ajax/ajaxHojaRuta.php',
            type: 'POST',
            dataType: 'json',
            data: {
                accion: 'obtenerCartasPorHojaRuta',
                hoja_ruta_id
            },
            success: function (cartas) {
                console.log("🟡 Datos recibidos:", cartas);
            
                tablaDetalleCartasHR.clear();
            
                if (!Array.isArray(cartas) || cartas.length === 0) {
                    tablaDetalleCartasHR.rows.add([["-", "-", "-", "-", "-"]]).draw();
                    return;
                }
            
                const filas = cartas.map(carta => {
                    const boton = permitirAnular
                        ? `<button class="btn btn-sm btn-danger btn-anular-carta" data-id="${carta.codigo_mcs}">
                                <i class="fas fa-times"></i> Anular
                           </button>`
                        : '';
            
                    return [
                        carta.village || '',
                        carta.codigo_mcs || '',
                        carta.tipo_envio || '',
                        carta.tipo_carta || '',
                        boton
                    ];
                });
            
                tablaDetalleCartasHR.rows.add(filas).draw();
            
                $("#modalCartasHR").modal("show");
            }
,
            error: function () {
                Swal.fire("Error", "No se pudo cargar cartas de esta Hoja de Ruta", "error");
            }
        });
    });


    // ✅ Anular carta desde el modal de cartas HR
    $('#bodyDetalleCartasHR').on('click', '.btn-anular-carta', function () {
        const codigo_mcs = $(this).data('id');
    
        Swal.fire({
            title: `¿Anular carta ${codigo_mcs}?`,
            text: "Esta carta será devuelta a estado 'pendiente' y se excluirá de la Hoja de Ruta.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, anular",
            cancelButtonText: "Cancelar"
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: '../Ajax/ajaxHojaRuta.php',
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        accion: 'devolverCarta',
                        codigo_mcs,
                        observacion: 'anulado desde HR',
                        detalle: '',
                        opcion: 'solo'
                    },
                    success: function (resp) {
                        if (resp.status === "success") {
                            Swal.fire("Éxito", "Carta anulada correctamente", "success");
                            $("#modalCartasHR").modal("hide");
                            cargarHojasRuta();
                        } else {
                            Swal.fire("Advertencia", resp.message, "warning");
                        }
                    },
                    error: function () {
                        Swal.fire("Error", "No se pudo anular la carta", "error");
                    }
                });
            }
        });
    });


    // ✅ Cargar observaciones Punto Focal
    function cargarObservacionesPuntoFocal() {
        $.ajax({
            url: '../Ajax/ajaxProcesarCartas.php',
            type: 'POST',
            data: { accion: 'obtenerObservaciones' },
            success: function (response) {
                try {
                    observacionesGlobal = JSON.parse(response);
                } catch (e) {
                    console.error("❌ Error al cargar observaciones:", e);
                }
            }
        });
    }

    // ✅ Botón Devolver Carta (Punto Focal)
    // ✅ Botón Devolver Carta (con opción para múltiples)
    $('#tablaCartasHR').on('click', '.btn-devolver-carta', function () {
        const codigo_mcs = $(this).data('codigo');
    
        // Paso 1: verificar si pertenece a grupo múltiple
        $.ajax({
            url: '../Ajax/ajaxHojaRuta.php',
            type: 'POST',
            dataType: 'json',
            data: {
                accion: 'verificarGrupoMultiple',
                codigo_mcs
            },
            success: function (grupo) {
                let opcionesObs = '<option value="">Seleccione una observación</option>';
                observacionesGlobal.forEach(obs => {
                    opcionesObs += `<option value="${obs.descripcion}">${obs.descripcion}</option>`;
                });
    
                // Paso 2: mostrar diálogo de confirmación con elección
                const swalOpciones = {
                    title: `Devolver carta ${codigo_mcs}`,
                    html: `
                        <select id="obsPuntoFocal" class="swal2-input">${opcionesObs}</select>
                        <textarea id="obsDetalle" class="swal2-textarea" placeholder="Detalle adicional (opcional)"></textarea>
                    `,
                    showCancelButton: true,
                    confirmButtonText: "Solo esta carta",
                    cancelButtonText: "Cancelar"
                };
    
                if (grupo && grupo.es_multiple) {
                    swalOpciones.text = `Esta carta pertenece a un grupo múltiple (ref: ${grupo.ref}).`;
                    swalOpciones.showDenyButton = true;
                    swalOpciones.denyButtonText = "Todo el grupo";
                }
    
                Swal.fire(swalOpciones).then((result) => {
                    if (!result.isConfirmed && !result.isDenied) return;
    
                    const opcion = result.isDenied ? 'grupo' : 'solo';
                    const obs = $('#obsPuntoFocal').val();
                    const detalle = $('#obsDetalle').val();
    
                    if (!obs) {
                        Swal.fire("Aviso", "Debe seleccionar una observación", "warning");
                        return;
                    }
    
                    $.ajax({
                        url: '../Ajax/ajaxHojaRuta.php',
                        type: 'POST',
                        dataType: 'json',
                        data: {
                            accion: 'devolverCarta',
                            codigo_mcs: codigo_mcs,
                            observacion: obs,
                            detalle: detalle,
                            opcion: opcion // 'solo' o 'grupo'
                        },
                        success: function (resp) {
                            if (resp.status === "success") {
                                Swal.fire("Éxito", resp.message, "success");
                                $("#btnCargarCartas").click();
                            } else {
                                Swal.fire("Advertencia", resp.message, "warning");
                            }
                        },
                        error: function () {
                            Swal.fire("Error", "No se pudo devolver la carta", "error");
                        }
                    });
                });
            },
            error: function () {
                Swal.fire("Error", "No se pudo verificar grupo múltiple", "error");
            }
        });
    });


    // ✅ Funciones auxiliares
    function cargarHojasRuta() {
        $.ajax({
            url: '../Ajax/ajaxHojaRuta.php',
            type: 'POST',
            dataType: 'json',
            data: { accion: 'listarHojasDeRuta', organizacion_id: 0 },
            success: function (data) {
                if (!Array.isArray(data)) {
                    Swal.fire("Error", "Respuesta inesperada al listar Hojas de Ruta", "error");
                    return;
                }
                data = data.filter(item => item && typeof item === 'object');
                console.log("✅ Datos recibidos para tabla:", data);
                tablaHojasRuta.clear().rows.add(data).draw();
            },
            error: function () {
                console.error("❌ Error al cargar listado HR");
            }
        });
    }

    function cargarOrganizaciones() {
        $.ajax({
            url: '../Ajax/ajaxHojaRuta.php',
            type: 'POST',
            dataType: 'json',
            data: { accion: 'listarOrganizaciones' },
            success: function (data) {
                const select = $("#organizacion_id");
                select.empty().append('<option value="">Seleccione...</option>');
                data.forEach(org => {
                    select.append(`<option value="${org.id}">${org.Alias}</option>`);
                });
            },
            error: function () {
                console.error("❌ Error al cargar organizaciones");
            }
        });
    }

    function obtenerSiguienteNumeroHR() {
        $.ajax({
            url: '../Ajax/ajaxHojaRuta.php',
            type: 'POST',
            dataType: 'json',
            data: { accion: 'obtenerSiguienteNumeroHR' },
            success: function (data) {
                $("#numero_hr").val(data.numero_hr);
            },
            error: function () {
                console.error("❌ Error al obtener siguiente HR");
            }
        });
    }
});
