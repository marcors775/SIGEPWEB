function manejarError(xhr, status, error) {
    console.error("Error:", status, error)
    mostrarAlerta("error", "Ocurrió un error durante la operación.")
}

// Función para mostrar alertas
function mostrarAlerta(tipo, mensaje) {
    Swal.fire({
        icon: tipo,
        title: mensaje,
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
    })
}

$(document).ready(() => {
    let tablaAldeas, tablaNiños

    // Inicializar DataTables
    tablaAldeas = $("#tablaAldeas").DataTable({
        language: {
            url: "//cdn.datatables.net/plug-ins/1.10.25/i18n/Spanish.json",
        },
        paging: true,
        pageLength: 10,
        lengthMenu: [10, 25, 50, 75, 100],
        searching: true,
        ordering: true,
        info: true,
        responsive: true,
    })

    // Cargar gestores al combobox
    $.post(
        "../Ajax/ausenciasTemporalesController.php",
        { accion: "obtenerGestores" },
        (response) => {
            if (response && Array.isArray(response)) {
                response.forEach((gestor) => {
                    $("#gestor, #promotor").append(`<option value="${gestor.Cedula}">${gestor.nombre_completo}</option>`)
                })
            }
        },
        "json",
    ).fail(manejarError)

    // Cargar verificadores
    $.post(
        "../Ajax/ausenciasTemporalesController.php",
        { accion: "obtenerVerificadores" },
        (response) => {
            if (response && Array.isArray(response)) {
                response.forEach((verificador) => {
                    $("#metodoVerificacion").append(
                        `<option value="${verificador.codigo_verificador}">${verificador.Detalle}</option>`,
                    )
                })
            }
        },
        "json",
    ).fail(manejarError)

    // Cargar aldeas al seleccionar un gestor
    $("#gestor").on("change", function () {
        const idGestor = $(this).val()
        if (idGestor) {
            $.post(
                "../Ajax/ausenciasTemporalesController.php",
                { accion: "obtenerAldeasPorGestor", idGestor: idGestor },
                (response) => {
                    tablaAldeas.clear()
                    if (response && Array.isArray(response)) {
                        if (response.length === 0) {
                            tablaAldeas.row.add(["N/A", "N/A", '<span class="text-muted">Gestor sin niños</span>']).draw(false)
                        } else {
                            response.forEach((aldea) => {
                                tablaAldeas.row
                                    .add([
                                        aldea.aldea,
                                        aldea.numero_niños,
                                        `<button class="btn btn-primary btnVerNiños" data-aldea="${aldea.aldea}">Ver Niños</button>`,
                                    ])
                                    .draw(false)
                            })
                        }
                    }
                },
                "json",
            ).fail(manejarError)
        } else {
            tablaAldeas.clear().draw()
        }
    })

    // Función para generar botones de acción
    function generarBotonesAccion(niño) {
        const crearAusenciaVisible = !niño.fecha_notificacion
        const verificacionVisible = niño.fecha_notificacion && !niño.fecha_verificacion
        const estadoFinalVisible = niño.fecha_verificacion && !niño.fecha_estado

        return `
              <button class="btn btn-success btn-sm btnCrearAusencia" data-id="${niño.numero_nino}" ${crearAusenciaVisible ? "" : 'style="display: none;"'}>Crear Ausencia</button>
              <button class="btn btn-info btn-sm btnVerificacion" data-id="${niño.numero_nino}" ${verificacionVisible ? "" : 'style="display: none;"'}>Verificación</button>
              <button class="btn btn-warning btn-sm btnEstadoFinal" data-id="${niño.numero_nino}" ${estadoFinalVisible ? "" : 'style="display: none;"'}>Estado Final</button>
          `
    }

    // Ver niños de una aldea
    $(document).on("click", ".btnVerNiños", function () {
        const aldea = $(this).data("aldea")
        const idGestor = $("#gestor").val()

        $.post(
            "../Ajax/ausenciasTemporalesController.php",
            {
                accion: "obtenerNinosPorAldea",
                aldea: aldea,
                idGestor: idGestor,
            },
            (response) => {
                if ($.fn.DataTable.isDataTable("#tablaNiños")) {
                    tablaNiños.destroy()
                }

                $("#tablaNiños tbody").empty()

                if (response && Array.isArray(response)) {
                    if (response.length === 0) {
                        $("#tablaNiños tbody").append(`
                                  <tr>
                                      <td colspan="11"><span class="text-muted">No hay niños en esta aldea</span></td>
                                  </tr>
                              `)
                    } else {
                        response.forEach((niño) => {
                            const diasAusencia = niño.dias_ausencia ? niño.dias_ausencia : ""
                            const botonesAccion = generarBotonesAccion(niño)

                            $("#tablaNiños tbody").append(`
                                      <tr>
                                          <td>${niño.nombre_completo}</td>
                                          <td>${niño.comunidad || ""}</td>
                                          <td>${niño.aldea || ""}</td>
                                          <td>${niño.edad || ""}</td>
                                          <td>${niño.fecha_notificacion || ""}</td>
                                          <td>${niño.metodo_verificacion_desc || ""}</td>
                                          <td>${niño.fecha_verificacion || ""}</td>
                                          <td>${niño.estado || ""}</td>
                                          <td>${niño.fecha_estado || ""}</td>
                                          <td>${diasAusencia}</td>
                                          <td>${botonesAccion}</td>
                                      </tr>
                                  `)
                        })
                    }
                }

                tablaNiños = $("#tablaNiños").DataTable({
                    language: {
                        url: "//cdn.datatables.net/plug-ins/1.10.25/i18n/Spanish.json",
                    },
                    paging: true,
                    pageLength: 10,
                    lengthMenu: [10, 25, 50, 75, 100],
                    searching: true,
                    ordering: true,
                    info: true,
                    responsive: true,
                })

                $("#modalVerNiños").modal("show")
                $("#modalVerNiños").data("aldea-actual", aldea)
            },
            "json",
        ).fail(manejarError)
    })

    // Crear nueva ausencia
    $(document).on("click", ".btnCrearAusencia", function () {
        const numeroNino = $(this).data("id")
        $("#formCrearAusencia").data("numeroNino", numeroNino)

        // Establecer la fecha actual en el campo fechaNotificacion
        const fechaActual = new Date()
        const año = fechaActual.getFullYear()
        const mes = String(fechaActual.getMonth() + 1).padStart(2, "0")
        const dia = String(fechaActual.getDate()).padStart(2, "0")
        const fechaFormateada = `${año}-${mes}-${dia}`

        $("#fechaNotificacion").val(fechaFormateada)

        $("#modalCrearAusencia").modal("show")
    })

    $("#formCrearAusencia").on("submit", function (e) {
        e.preventDefault()
        const numeroNino = $(this).data("numeroNino")
        const fechaNotificacion = $("#fechaNotificacion").val()

        $.post(
            "../Ajax/ausenciasTemporalesController.php",
            {
                accion: "insertarAusencia",
                numeroNino: numeroNino,
                fechaNotificacion: fechaNotificacion,
            },
            (response) => {
                if (response.success) {
                    mostrarAlerta("success", response.message)
                    $("#modalCrearAusencia").modal("hide")
                    // Ocultar el botón "Crear Ausencia" y mostrar el botón "Verificación"
                    actualizarTablaNinos()
                } else {
                    mostrarAlerta("error", response.error || "Error al crear la ausencia")
                }
            },
            "json",
        ).fail(manejarError)
    })

    // Agregar verificación
    $(document).on("click", ".btnVerificacion", function () {
        const numeroNino = $(this).data("id")
        $("#formVerificacion").data("numeroNino", numeroNino)
        $("#modalVerificacion").modal("show")
    })

    $("#formVerificacion").on("submit", function (e) {
        e.preventDefault()
        const numeroNino = $(this).data("numeroNino")
        const fechaVerificacion = $("#fechaVerificacion").val()
        const metodoVerificacion = $("#metodoVerificacion").val()
        const promotor = $("#promotor").val()

        $.post(
            "../Ajax/ausenciasTemporalesController.php",
            {
                accion: "actualizarVerificacion",
                numeroNino: numeroNino,
                fechaVerificacion: fechaVerificacion,
                metodoVerificacion: metodoVerificacion,
                promotor: promotor,
            },
            (response) => {
                if (response.success) {
                    mostrarAlerta("success", response.message)
                    $("#modalVerificacion").modal("hide")
                    // Ocultar el botón "Verificación" y mostrar el botón "Estado Final"
                    actualizarTablaNinos()
                } else {
                    mostrarAlerta("error", response.error || "Error al actualizar la verificación")
                }
            },
            "json",
        ).fail(manejarError)
    })

    // Agregar estado final
    $(document).on("click", ".btnEstadoFinal", function () {
        const numeroNino = $(this).data("id")
        $("#formEstadoFinal").data("numeroNino", numeroNino)
        $("#modalEstadoFinal").modal("show")
    })

    $("#formEstadoFinal").on("submit", function (e) {
        e.preventDefault()
        const numeroNino = $(this).data("numeroNino")
        const fechaEstado = $("#fechaEstado").val()
        const estado = $("#estado").val()

        $.post(
            "../Ajax/ausenciasTemporalesController.php",
            {
                accion: "actualizarEstadoFinal",
                numeroNino: numeroNino,
                fechaEstado: fechaEstado,
                estado: estado,
            },
            (response) => {
                if (response.success) {
                    mostrarAlerta("success", response.message)
                    $("#modalEstadoFinal").modal("hide")
                    // Ocultar el botón "Estado Final"
                    actualizarTablaNinos()
                } else {
                    mostrarAlerta("error", response.error || "Error al actualizar el estado final")
                }
            },
            "json",
        ).fail(manejarError)
    })

    // Función para actualizar la tabla de niños
    function actualizarTablaNinos() {
        const aldea = $("#modalVerNiños").data("aldea-actual")
        const idGestor = $("#gestor").val()

        if (aldea && idGestor) {
            $.post(
                "../Ajax/ausenciasTemporalesController.php",
                {
                    accion: "obtenerNinosPorAldea",
                    aldea: aldea,
                    idGestor: idGestor,
                },
                (response) => {
                    if ($.fn.DataTable.isDataTable("#tablaNiños")) {
                        tablaNiños.destroy()
                    }

                    $("#tablaNiños tbody").empty()

                    if (response && Array.isArray(response)) {
                        if (response.length === 0) {
                            $("#tablaNiños tbody").append(`
                                      <tr>
                                          <td colspan="11"><span class="text-muted">No hay niños en esta aldea</span></td>
                                      </tr>
                                  `)
                        } else {
                            response.forEach((niño) => {
                                const diasAusencia = niño.dias_ausencia ? niño.dias_ausencia : ""
                                const botonesAccion = generarBotonesAccion(niño)

                                $("#tablaNiños tbody").append(`
                                          <tr>
                                              <td>${niño.nombre_completo}</td>
                                              <td>${niño.comunidad || ""}</td>
                                              <td>${niño.aldea || ""}</td>
                                              <td>${niño.edad || ""}</td>
                                              <td>${niño.fecha_notificacion || ""}</td>
                                              <td>${niño.metodo_verificacion_desc || ""}</td>
                                              <td>${niño.fecha_verificacion || ""}</td>
                                              <td>${niño.estado || ""}</td>
                                              <td>${niño.fecha_estado || ""}</td>
                                              <td>${diasAusencia}</td>
                                              <td>${botonesAccion}</td>
                                          </tr>
                                      `)
                            })
                        }
                    }

                    tablaNiños = $("#tablaNiños").DataTable({
                        language: {
                            url: "//cdn.datatables.net/plug-ins/1.10.25/i18n/Spanish.json",
                        },
                        paging: true,
                        pageLength: 10,
                        lengthMenu: [10, 25, 50, 75, 100],
                        searching: true,
                        ordering: true,
                        info: true,
                        responsive: true,
                    })
                },
                "json",
            ).fail(manejarError)
        }
    }
})