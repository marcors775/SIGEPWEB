// Función para manejar errores en las solicitudes AJAX
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
    const niños = []

    const tablaAldeas = $("#tablaAldeas").DataTable({
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

    const tablaNiños = $("#tablaNiños").DataTable({
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
        "../Ajax/casosA.php",
        { accion: "obtenerGestores" },
        (response) => {
            if (response && Array.isArray(response)) {
                response.forEach((gestor) => {
                    $("#gestor").append(`<option value="${gestor.Cedula}">${gestor.nombre_completo}</option>`)
                })
            }
        },
        "json",
    ).fail(manejarError)

    // Cargar aldeas y niños al seleccionar un gestor
    $("#gestor").on("change", function () {
        const idGestor = $(this).val()
        if (idGestor) {
            $.post(
                "../Ajax/casosA.php",
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

    function actualizarTablaNinos() {
        $("#tablaNinos tbody").empty()
        niños.forEach((niño) => {
            $("#tablaNinos tbody").append(`
                  <tr>
                      <td>${niño.numero_nino}</td>
                      <td>${niño.nombre}</td>
                      <td>${niño.fecha_nacimiento}</td>
                      <td>${niño.direccion}</td>
                      <td>
                          ${generarBotonesAccion(niño)}
                      </td>
                  </tr>
              `)
        })
    }

    // Función para generar botones de acción
    function generarBotonesAccion(niño) {
        const crearCasoVisible = !niño.asunto
        const agregarDetallesVisible = niño.asunto && !niño.fechaEnvio

        return `
            <button class="btn btn-success btnCrearCaso" data-id="${niño.numero_nino}" ${crearCasoVisible ? "" : 'style="display: none;"'}>Crear Caso</button>
            <button class="btn btn-warning btnAgregarDetalles" data-id="${niño.numero_nino}" ${agregarDetallesVisible ? "" : 'style="display: none;"'} ${niño.asunto ? "" : "disabled"}>Agregar Detalles</button>
        `
    }

    $(document).on("click", ".btnVerNiños", function () {
        const aldea = $(this).data("aldea")
        const idGestor = $("#gestor").val()

        console.log("Clic en Ver Niños para aldea:", aldea, "y gestor:", idGestor)

        $.post(
            "../Ajax/casosA.php",
            { accion: "obtenerNinosPorAldea", aldea: aldea, idGestor: idGestor },
            (response) => {
                console.log("Respuesta del servidor:", response)
                tablaNiños.clear()
                if (response && Array.isArray(response)) {
                    if (response.length === 0) {
                        tablaNiños.row
                            .add([
                                "N/A",
                                "N/A",
                                "N/A",
                                "N/A",
                                "N/A",
                                "N/A",
                                "N/A",
                                "N/A",
                                "N/A",
                                '<span class="text-muted">Gestor sin niños</span>',
                            ])
                            .draw(false)
                    } else {
                        response.forEach((niño) => {
                            tablaNiños.row
                                .add([
                                    niño.numero_nino,
                                    niño.nombre_completo,
                                    niño.edad,
                                    niño.asunto || "",
                                    niño.fechaRecepcion || "",
                                    niño.dias_transcurridos || "",
                                    niño.fechaEnvio || "",
                                    niño.causasRetraso || "",
                                    niño.estado || "",
                                    generarBotonesAccion(niño),
                                ])
                                .draw(false)
                        })
                    }
                    $("#modalVerNiños").modal("show")
                    $("#modalVerNiños").data("aldea-actual", aldea)
                } else {
                    console.error("La respuesta no es un array o está vacía:", response)
                }
            },
            "json",
        ).fail(manejarError)
    })

    $("#formAgregarNino").on("submit", (e) => {
        e.preventDefault()
        const numero_nino = $("#numero_nino").val()
        const nombre = $("#nombre").val()
        const fecha_nacimiento = $("#fecha_nacimiento").val()
        const direccion = $("#direccion").val()

        niños.push({
            numero_nino: numero_nino,
            nombre: nombre,
            fecha_nacimiento: fecha_nacimiento,
            direccion: direccion,
            asunto: null,
            fechaEnvio: null,
        })

        actualizarTablaNinos()
        $("#agregarNinoModal").modal("hide")
        $("#formAgregarNino")[0].reset()
    })

    $(document).on("click", ".btnCrearCaso", function () {
        const numeroNino = $(this).data("id")
        $("#formCrearCaso").data("numeroNino", numeroNino)
        $("#modalCrearCaso").modal("show")
    })

    $("#formCrearCaso").on("submit", function (e) {
        e.preventDefault()
        const numeroNino = $(this).data("numeroNino")
        const fechaRecepcion = $("#fechaRecepcion").val()
        const asunto = $("#asunto").val()

        $.post(
            "../Ajax/casosA.php",
            { accion: "insertarCaso", numeroNino: numeroNino, fechaRecepcion: fechaRecepcion, asunto: asunto },
            (response) => {
                mostrarAlerta("success", response.message || "Caso creado exitosamente.")
                $("#modalCrearCaso").modal("hide")
                actualizarTablaNinos()
            },
            "json",
        ).fail(manejarError)
    })

    $(document).on("click", ".btnAgregarDetalles", function () {
        const numeroNino = $(this).data("id")
        $("#formAgregarDetalles").data("numeroNino", numeroNino)
        $("#modalAgregarDetalles").modal("show")
    })

    $("#formAgregarDetalles").on("submit", function (e) {
        e.preventDefault()
        const numeroNino = $(this).data("numeroNino")
        const fechaEnvio = $("#fechaEnvio").val()
        const causasRetraso = $("#causasRetraso").val()
        const estado = $("#estado").val()

        $.post(
            "../Ajax/casosA.php",
            {
                accion: "actualizarCaso",
                numeroNino: numeroNino,
                fechaEnvio: fechaEnvio,
                causasRetraso: causasRetraso,
                estado: estado,
            },
            (response) => {
                mostrarAlerta("success", response.message || "Detalles agregados exitosamente.")
                $("#modalAgregarDetalles").modal("hide")
                actualizarTablaNinos()
            },
            "json",
        ).fail(manejarError)
    })

    $("#tablaNinos").on("click", ".btnCrearCaso", function () {
        const numeroNino = $(this).data("id")
        $("#numero_nino_caso").val(numeroNino)
        $("#crearCasoModal").modal("show")
    })

    $("#tablaNinos").on("click", ".btnAgregarDetalles", function () {
        const numeroNino = $(this).data("id")
        $("#numero_nino_detalles").val(numeroNino)
        $("#agregarDetallesModal").modal("show")

        const niño = niños.find((n) => n.numero_nino === numeroNino)
        if (niño && niño.asunto) {
            $("#asunto").val(niño.asunto)
        }
    })

    $("#formCrearCaso").on("submit", (e) => {
        e.preventDefault()
        const numeroNino = $("#numero_nino_caso").val()
        const asunto = $("#asunto_caso").val()

        const niñoIndex = niños.findIndex((n) => n.numero_nino === numeroNino)
        if (niñoIndex !== -1) {
            niños[niñoIndex].asunto = asunto
        }

        actualizarTablaNinos()
        $("#crearCasoModal").modal("hide")
        $("#formCrearCaso")[0].reset()
    })

    $("#formAgregarDetalles").on("submit", (e) => {
        e.preventDefault()
        const numeroNino = $("#numero_nino_detalles").val()
        const fechaEnvio = $("#fecha_envio").val()

        const niñoIndex = niños.findIndex((n) => n.numero_nino === numeroNino)
        if (niñoIndex !== -1) {
            niños[niñoIndex].fechaEnvio = fechaEnvio
        }

        actualizarTablaNinos()
        $("#agregarDetallesModal").modal("hide")
        $("#formAgregarDetalles")[0].reset()
    })

    // Función para actualizar la tabla de niños
    function actualizarTablaNinos() {
        const aldea = $("#modalVerNiños").data("aldea-actual")
        const idGestor = $("#gestor").val()

        if (aldea && idGestor) {
            $.post(
                "../Ajax/casosA.php",
                {
                    accion: "obtenerNinosPorAldea",
                    aldea: aldea,
                    idGestor: idGestor,
                },
                (response) => {
                    tablaNiños.clear()
                    if (response && Array.isArray(response)) {
                        if (response.length === 0) {
                            tablaNiños.row
                                .add([
                                    "N/A",
                                    "N/A",
                                    "N/A",
                                    "N/A",
                                    "N/A",
                                    "N/A",
                                    "N/A",
                                    "N/A",
                                    "N/A",
                                    '<span class="text-muted">Gestor sin niños</span>',
                                ])
                                .draw(false)
                        } else {
                            response.forEach((niño) => {
                                tablaNiños.row
                                    .add([
                                        niño.numero_nino,
                                        niño.nombre_completo,
                                        niño.edad,
                                        niño.asunto || "",
                                        niño.fechaRecepcion || "",
                                        niño.dias_transcurridos || "",
                                        niño.fechaEnvio || "",
                                        niño.causasRetraso || "",
                                        niño.estado || "",
                                        generarBotonesAccion(niño),
                                    ])
                                    .draw(false)
                            })
                        }
                    }
                },
                "json",
            ).fail(manejarError)
        }
    }

    $("#verNinosBtn").on("click", () => {
        $("#listaNinos").empty()
        niños.forEach((niño) => {
            $("#listaNinos").append(`
                  <li class="list-group-item">
                      ${niño.nombre} - ${niño.numero_nino}
                      ${generarBotonesAccion(niño)}
                  </li>
              `)    
        })
        $("#verNinosModal").modal("show")
    })
})