$(document).ready(function () {
    console.log("✅ ProcesarCartas.js cargado correctamente");

    let tipoCartaActual = '';
    let tablaCartasGlobal;
    let cartasSeleccionadas = [];
    let observacionesGlobal = [];
    let esAdmin = false;
    let verTodos = false;
    
    // ✅ Helper para escapar HTML (anti-XSS)
    function encodeHTML(s) {
      return String(s)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;')
        .replace(/'/g,'&#39;');
    }
    
// ✅ Inyecta CSRF en todos los POST (incluye DataTables)
// =======================
// 🔐 CSRF: fallback + inyección universal en POST
// =======================

// Fallback por si el layout no setea la variable en este dispositivo
try {
  if (!window.CSRF_TOKEN) {
    var __meta = document.querySelector('meta[name="csrf-token"]');
    window.CSRF_TOKEN = __meta ? __meta.getAttribute('content') : '';
  }
} catch (e) {
  window.CSRF_TOKEN = window.CSRF_TOKEN || '';
}

// Inyecta el token en TODOS los POST (string, objeto y FormData)
$.ajaxSetup({
  beforeSend: function (xhr, settings) {
    try {
      if (!settings || !settings.type) return;
      if (String(settings.type).toUpperCase() !== 'POST') return;

      var token = window.CSRF_TOKEN || '';
      if (!token) return;

      // Si envías FormData, adjunta el token ahí
      if (window.FormData && settings.data instanceof FormData) {
        settings.data.append('csrf_token', token);
        return;
      }

      // Si es cadena de query
      if (typeof settings.data === 'string') {
        settings.data += (settings.data ? '&' : '') + 'csrf_token=' + encodeURIComponent(token);
        return;
      }

      // Objeto plano o vacío
      if (settings.data && typeof settings.data === 'object') {
        settings.data.csrf_token = token;
      } else {
        settings.data = { csrf_token: token };
      }
    } catch (_) {}
  }
});

    /*     * Inicializa: comprueba si el usuario es administrador, crea botones si es necesario y carga el resumen inicial.*/
    function inicializar() {
      $.ajax({
        url: '../Ajax/ajaxProcesarCartas.php',
        type: 'POST',
        dataType: 'json',              // 👈 importante: ya NO uses JSON.parse
        data: { accion: 'esAdmin' },
        success: function (data) {
          try {
            esAdmin = data.esAdmin === true;
    
            // ✅ Si es admin, crea/mueve el botón toggle dentro de la toolbar fija
            if (esAdmin) {
              // Por defecto, el admin ve SUS cartas
              verTodos = false;
    
              const $tb = $("#toolbarProcesarCartas");
              if (!$("#btnToggleVer").length) {
                $tb.append(`<button id="btnToggleVer" class="btn btn-info">Ver todas</button>`);
              } else {
                $("#btnToggleVer").text('Ver todas');
                $tb.append($("#btnToggleVer").detach()); // por si estaba fuera
              }
    
              // (Re)bind del toggle
              $("#btnToggleVer").off("click").on("click", function () {
                verTodos = !verTodos;
                $(this).text(verTodos ? 'Ver mis cartas' : 'Ver todas');
                cargarTablaPrincipal();
                if ($('#modalCartas').is(':visible')) {
                  cargarCartasPorTipo();
                }
              });
            }
          } catch (e) {
            console.error("Error al procesar respuesta de esAdmin:", e, data);
          }
    
          // Primera carga de la tabla principal
          cargarTablaPrincipal();
        },
        error: function (xhr) {
          console.error("No se pudo verificar si el usuario es administrador", xhr.status, xhr.responseText);
          // Aun así, intenta cargar la tabla principal como usuario normal
          cargarTablaPrincipal();
        }
      });
    }
    
    
    function manejarErrorAjax(xhr, titulo) {
      var status = xhr && xhr.status;
      if (status === 403) {
        Swal.fire(
          'Sesión o seguridad',
          'El dispositivo no envió el token de seguridad (CSRF). Refresca la página e inténtalo de nuevo.',
          'warning'
        );
      } else {
        Swal.fire('Error', `No se pudo ${titulo || 'completar la operación'}. Código ${status || 'desconocido'}.`, 'error');
      }
    }


    // ✅ Botón para descargar todas las cartas (evitar duplicar)
    if (!$("#btnDescargarTodo").length) {
        // ✅ Botón para descargar todas las cartas – siempre dentro de la toolbar fija
        const $toolbar = $("#toolbarProcesarCartas");
        if (!$("#btnDescargarTodo").length) {
          $toolbar.append(`
            <button id="btnDescargarTodo" class="btn btn-success">
              <i class="fas fa-download"></i> Descargar todas las cartas
            </button>
          `);
        }
        
        $("#btnDescargarTodo").off("click").on("click", function () {
          let verParam = '';
          if (esAdmin) {
            verParam = verTodos ? '&ver=all' : '&ver=own';
          }
          window.open('../Ajax/ajaxProcesarCartas.php?accion=descargarTodas' + verParam, '_blank');
        });

    }

    $("#btnDescargarTodo").off("click").on("click", function () {
        let verParam = '';
        if (esAdmin) {
            verParam = verTodos ? '&ver=all' : '&ver=own';
        }
        window.open('../Ajax/ajaxProcesarCartas.php?accion=descargarTodas' + verParam, '_blank');
    });

    // ✅ Tabla principal (Resumen por gestor)
    const tablaPrincipal = $('#tablaPrincipal').DataTable({
        language: { url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
        responsive: true,
        columns: [
            { data: 'tipo' },
            { data: 'cantidad', className: "text-center" },
            { data: 'acciones', orderable: false, className: "text-center" }
        ]
    });
    // =======================
    // ✅ Ajustes responsivos
    // =======================
    
    // 1) Reajusta columnas al redimensionar la ventana
    $(window).on('resize', function () {
      if (typeof tablaPrincipal !== 'undefined' && tablaPrincipal) {
        tablaPrincipal.columns.adjust();
      }
      if (typeof tablaCartasGlobal !== 'undefined' && tablaCartasGlobal) {
        tablaCartasGlobal.columns.adjust();
      }
    });
    
    // 2) Cuando se abre el modal de cartas, recalcula columnas (por si el modal cambia el ancho)
    $('#modalCartas').on('shown.bs.modal', function () {
      if (typeof tablaCartasGlobal !== 'undefined' && tablaCartasGlobal) {
        tablaCartasGlobal.columns.adjust().responsive.recalc();
      }
    });


    /**
     * Carga el resumen por gestor considerando si el usuario es admin y el modo de visualización (all/own).
     */
    function cargarTablaPrincipal() {
      let ver = '';
      if (esAdmin) ver = verTodos ? 'all' : 'own';
    
      $.ajax({
        url: '../Ajax/ajaxProcesarCartas.php',
        type: 'POST',
        dataType: 'json',                          // 👈
        data: { accion: 'listarResumenPorGestor', ver: ver },
        success: function (data) {                 // 👈 ya es array
          tablaPrincipal.clear().rows.add(data).draw();
        },
        error: function (xhr) {
          console.error("Error listarResumenPorGestor:", xhr.status, xhr.responseText);
          Swal.fire('Error', 'No se pudo cargar el resumen', 'error');
        }
      });
    }


    // ✅ Cargar observaciones desde la BD
    function cargarObservacionesPromotor(callback) {
      $.ajax({
        url: '../Ajax/ajaxProcesarCartas.php',
        type: 'POST',
        dataType: 'json',                       // 👈
        data: { accion: 'obtenerObservaciones' },
        success: function (data) {              // 👈 ya es array
          try {
            observacionesGlobal = data;
            const selectGeneral = $('#obsGeneral');
            selectGeneral.empty().append('<option value="">Seleccione una opción</option>');
            observacionesGlobal.forEach(obs => {
              selectGeneral.append(`<option value="${obs.idObservaciones}">${obs.descripcion}</option>`);
            });
            if (callback) callback();
          } catch (e) {
            console.error("❌ Error al procesar observaciones:", e, data);
          }
        },
        error: function (xhr) {
          console.error("Error obtenerObservaciones:", xhr.status, xhr.responseText);
        }
      });
    }


    // ✅ Ver cartas de un tipo específico
    $('#tablaPrincipal').on('click', '.btn-ver-cartas', function () {
        tipoCartaActual = $(this).data('tipo');
        cargarCartasPorTipo();
    });

    /**
     * Carga el listado de cartas por tipo considerando el filtro de administrador.
     */
    function cargarCartasPorTipo() {
        let ver = '';
        if (esAdmin) {
            ver = verTodos ? 'all' : 'own';
        }

        if (tablaCartasGlobal) {
            tablaCartasGlobal.destroy();
            $('#tablaCartas tbody').empty();
        }

        tablaCartasGlobal = $('#tablaCartas').DataTable({
            ajax: {
                url: '../Ajax/ajaxProcesarCartas.php',
                type: 'POST',
                dataType: 'json',            // 👈
                data: {
                    accion: 'listarCartasPorGestor',
                    tipoCarta: tipoCartaActual,
                    ver: ver
                },
                dataSrc: ''
            },
            columns: [
                {
                    data: 'mcs',
                    render: (data) => `<input type="checkbox" class="chk-lista-envio" data-codigo="${data}">`,
                    orderable: false,
                    className: "text-center"
                },
                { data: 'village', defaultContent: '-' },
                { data: 'child_number', defaultContent: '-' },
                { data: 'nombres', defaultContent: '-' },
                { data: 'mcs', defaultContent: '-' },
                { data: 'dfc_amount', defaultContent: '-', className: 'text-center' },
                { data: 'tipo_carta', defaultContent: '-' },
                { data: 'fecha_recepcion', defaultContent: '-' },
                {
                    data: 'dias_transcurridos',
                    render: data => `<span class="badge badge-info">${data} días</span>`,
                    className: "text-center"
                },
                {
                  data: 'punto_focal',
                  defaultContent: '',
                  render: (data) => {
                    if (!data) {
                      return `<span class="text-muted">-</span>`;
                    }
                    const full = encodeHTML(data);
                    const corto = data.length > 15 ? encodeHTML(data.substring(0, 15)) + "..." : encodeHTML(data);
                    return `
                      <span class="badge badge-warning ver-detalle"
                            style="cursor:pointer"
                            title="Ver detalle completo"
                            data-detalle="${full}">
                        ${corto}
                      </span>
                    `;
                  }
                }
            ],
            responsive: true,
            dom: 'Bfrtip',
            buttons: [
                { extend: 'excelHtml5', text: '<i class="fas fa-file-excel"></i> Excel', className: 'btn btn-success btn-sm' },
                { extend: 'pdfHtml5', text: '<i class="fas fa-file-pdf"></i> PDF', className: 'btn btn-danger btn-sm' },
                { extend: 'print', text: '<i class="fas fa-print"></i> Imprimir', className: 'btn btn-primary btn-sm' }
            ],
            language: { url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' }
        });

        $('#modalCartas').modal('show');
    }

    // ✅ Mostrar detalle completo del Punto Focal al hacer clic
    $('#tablaCartas').on('click', '.ver-detalle', function () {
      const detalle = $(this).data('detalle');
      Swal.fire({
        title: "Observación Punto Focal",
        text: String(detalle), // ✅ mostrar como texto (no HTML)
        icon: "info",
        confirmButtonText: "Cerrar"
      });
    });

    // ✅ Botón para marcar listas de envío y crear grupo múltiple (evitar duplicados)
    if (!$("#btnMarcarListaEnvio").length) {
        $("#tablaCartas").before(`
            <button id="btnMarcarListaEnvio" class="btn btn-warning mb-3">
                <i class="fas fa-check"></i> Marcar listas para envío
            </button>
        `);
    }
    if (!$("#btnCrearGrupoMultiple").length) {
        $("#tablaCartas").before(`
        <button id="btnCrearGrupoMultiple" class="btn btn-secondary mb-3 ml-2">
            <i class="fas fa-layer-group"></i> Crear grupo múltiple
        </button>
        `);
    }

    $("#btnMarcarListaEnvio").off("click").on("click", function () {
        cartasSeleccionadas = [];
        $(".chk-lista-envio:checked").each(function () {
            const rowData = tablaCartasGlobal.row($(this).closest('tr')).data();
            cartasSeleccionadas.push({
                mcs: rowData.mcs,
                village: rowData.village,
                nombres: rowData.nombres
            });
        });

        if (cartasSeleccionadas.length === 0) {
            Swal.fire('Aviso', 'Debe seleccionar al menos una carta.', 'warning');
            return;
        }

        cargarObservacionesPromotor(() => {
            construirTablaModalListas();
            $('#modalListaEnvio').modal('show');
        });
    });

    $("#btnCrearGrupoMultiple").off("click").on("click", function () {
        const seleccionadas = [];

        $(".chk-lista-envio:checked").each(function () {
            const mcs = $(this).data("codigo");
            seleccionadas.push(mcs);
        });

        if (seleccionadas.length < 2) {
            Swal.fire('Aviso', 'Seleccione al menos 2 cartas para crear el grupo.', 'warning');
            return;
        }

        Swal.fire({
            title: 'Código de referencia',
            input: 'select',
            inputOptions: seleccionadas.reduce((opts, val) => {
                opts[val] = val;
                return opts;
            }, {}),
            inputPlaceholder: 'Seleccione carta principal',
            showCancelButton: true,
            confirmButtonText: 'Crear grupo',
            cancelButtonText: 'Cancelar'
        }).then(result => {
            if (result.isConfirmed) {
                const codigoRef = result.value;

                $.ajax({
                  url: '../Ajax/ajaxProcesarCartas.php',
                  type: 'POST',
                  dataType: 'json',                         // 👈
                  data: {
                    accion: 'crearGrupoMultiple',
                    codigo_mcs_ref: codigoRef,
                    cartas: seleccionadas
                  },
                  success: function (res) {                 // 👈 sin JSON.parse
                    Swal.fire(res.status === "success" ? 'Éxito' : 'Error', res.message, res.status);
                    if (res.status === "success") cargarCartasPorTipo();
                  },
                  error: function (xhr) {
                    console.error('crearGrupoMultiple error:', xhr.status, xhr.responseText);
                    Swal.fire('Error', 'No se pudo crear el grupo múltiple.', 'error');
                  }
                });

            }
        });
    });

    // ✅ Construir tabla en el modal (incluye tipo_envio)
    function construirTablaModalListas() {
        const contenedor = $("#tablaListaEnvio tbody");
        contenedor.empty();

        cartasSeleccionadas.forEach(carta => {
            let optionsObs = '<option value="">Seleccione...</option>';
            observacionesGlobal.forEach(obs => {
                optionsObs += `<option value="${obs.idObservaciones}">${obs.descripcion}</option>`;
            });

            contenedor.append(`
                <tr data-codigo="${carta.mcs}">
                    <td>${carta.mcs}</td>
                    <td>${carta.village}</td>
                    <td>${carta.nombres}</td>
                    <td>
                        <select class="form-control obsPromotor">${optionsObs}</select>
                    </td>
                    <td>
                        <select class="form-control tipoEnvio">
                            <option value="">Seleccione...</option>
                            <option value="DIGITAL">DIGITAL</option>
                            <option value="APP">APP</option>
                        </select>
                    </td>
                    <td>
                        <textarea class="form-control observaciones" rows="1"></textarea>
                    </td>
                </tr>
            `);
        });
    }

    // ✅ Aplicar datos a todos
    $("#btnAplicarTodos").on("click", function () {
        const obsGeneral = $("#obsGeneral").val();
        const tipoEnvioGeneral = $("#tipoEnvioGeneral").val();
        const obsTxtGeneral = $("#obsTxtGeneral").val();

        if (!obsGeneral && !tipoEnvioGeneral && !obsTxtGeneral) {
            Swal.fire('Aviso', 'No hay datos para aplicar.', 'warning');
            return;
        }

        $("#tablaListaEnvio tbody tr").each(function () {
            if (obsGeneral) $(this).find(".obsPromotor").val(obsGeneral);
            if (tipoEnvioGeneral) $(this).find(".tipoEnvio").val(tipoEnvioGeneral);
            if (obsTxtGeneral) $(this).find(".observaciones").val(obsTxtGeneral);
        });

        Swal.fire('Éxito', 'Datos aplicados a todos los registros.', 'success');
    });

    // ✅ Guardar lista de envío (BATCH, sin AJAX síncrono)
    $("#formListaEnvio").on("submit", function (e) {
        e.preventDefault();

        const items = [];
        let errores = 0;

        $("#tablaListaEnvio tbody tr").each(function () {
            const codigo = $(this).data("codigo");
            const obsPromotor = $(this).find(".obsPromotor").val();
            const tipoEnvio = $(this).find(".tipoEnvio").val();
            const observaciones = $(this).find(".observaciones").val();

            if (!obsPromotor || !tipoEnvio) {
                errores++;
                return; // sigue revisando otras filas
            }

            items.push({
                codigo_mcs: codigo,
                observacionPromotor: parseInt(obsPromotor, 10),
                observaciones: observaciones || '',
                tipo_envio: tipoEnvio
            });
        });

        if (errores > 0) {
            Swal.fire('Error', 'Algunas filas no tienen datos completos (observación y tipo de envío).', 'error');
            return;
        }
        if (items.length === 0) {
            Swal.fire('Aviso', 'No hay datos para guardar.', 'warning');
            return;
        }

        $.ajax({
          url: '../Ajax/ajaxProcesarCartas.php',
          type: 'POST',
          dataType: 'json',                       // 👈
          data: {
            accion: 'marcarListaEnvioBatch',
            items: JSON.stringify(items)
          },
          success: function (data) {              // 👈 sin JSON.parse
            if (data.status === 'success') {
              Swal.fire('Éxito', `Se actualizaron ${data.ok} de ${data.total} cartas.`, 'success');
            } else {
              Swal.fire('Error', data.message || 'No se pudieron actualizar las cartas.', 'error');
            }
            $('#modalListaEnvio').modal('hide');
            cargarCartasPorTipo();
          },
          error: function (xhr) {
            console.error('marcarListaEnvioBatch error:', xhr.status, xhr.responseText);
            Swal.fire('Error', 'Fallo de comunicación con el servidor.', 'error');
          }
        });

    });
    // =======================
    // ✅ Ajustes responsivos DataTables
    // =======================
    $(window).on('resize', function () {
      if (typeof tablaPrincipal !== 'undefined' && tablaPrincipal) {
        tablaPrincipal.columns.adjust();
      }
      if (typeof tablaCartasGlobal !== 'undefined' && tablaCartasGlobal) {
        tablaCartasGlobal.columns.adjust();
      }
    });
    
    $('#modalCartas').on('shown.bs.modal', function () {
      if (typeof tablaCartasGlobal !== 'undefined' && tablaCartasGlobal) {
        tablaCartasGlobal.columns.adjust().responsive.recalc();
      }
    });


    // 👉 Iniciar comprobación y primer carga
    inicializar();
});
