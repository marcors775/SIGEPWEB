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
    const tablaAldeas = $("#tablaAldeas").DataTable({
        language: {},
        paging: true,
        pageLength: 10,
        lengthMenu: [10, 25, 50, 75, 100],
        searching: true,
        ordering: true,
        info: true,
        responsive: true,
    })

    const tablaNiños = $("#tablaNiños").DataTable({
        language: {},
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
        "../Ajax/avisosEmbarazoController.php",
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

    // Cargar planes futuros
    $.post(
        "../Ajax/avisosEmbarazoController.php",
        { accion: "obtenerPlanesFuturos" },
        (response) => {
            if (response && Array.isArray(response)) {
                response.forEach((plan) => {
                    $("#planesFuturos").append(`<option value="${plan.idPlanesFuturos}">${plan.descripcion}</option>`)
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
                "../Ajax/avisosEmbarazoController.php",
                { accion: "obtenerAldeasPorGestor", idGestor: idGestor },
                (response) => {
                    tablaAldeas.clear()
                    if (response && Array.isArray(response)) {
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
                },
                "json",
            ).fail(manejarError)
        }
    })

    $(document).on("click", ".btnVerNiños", function () {
        const aldea = $(this).data("aldea")
        const idGestor = $("#gestor").val() // Obtener el gestor seleccionado

        console.log("Clic en Ver Niños para aldea:", aldea, "y gestor:", idGestor)

        $.post(
            "../Ajax/avisosEmbarazoController.php",
            { accion: "obtenerNinosPorAldea", aldea: aldea, idGestor: idGestor },
            (response) => {
                console.log("Respuesta del servidor:", response)
                tablaNiños.clear()
                if (response && Array.isArray(response)) {
                    response.forEach((niño) => {
                        // Determinar la visibilidad de los botones basado en el estado
                        const btnCrearAvisoVisible = !niño.tipo_aviso
                        const btnAgregarCierreVisible = niño.tipo_aviso && !niño.fecha_cierre

                        tablaNiños.row
                            .add([
                                niño.numero_nino,
                                niño.nombre_completo,
                                niño.comunidad || "",
                                niño.aldea || "",
                                niño.edad || "",
                                niño.tipo_aviso || "",
                                niño.planes_futuros_desc || "",
                                niño.fecha_notificacion || "",
                                niño.observaciones || "",
                                niño.fecha_cierre || "",
                                `<button class="btn btn-success btnCrearAviso" data-id="${niño.numero_nino}" ${btnCrearAvisoVisible ? "" : 'style="display: none;"'}>Crear Aviso</button>
                           <button class="btn btn-warning btnAgregarCierre" data-id="${niño.numero_nino}" ${btnAgregarCierreVisible ? "" : 'style="display: none;"'}>Agregar Cierre</button>`,
                            ])
                            .draw(false)
                    })
                    $("#modalVerNiños").modal("show")
                    // Guardar la aldea actual para futuras referencias
                    $("#modalVerNiños").data("aldea-actual", aldea)
                } else {
                    console.error("La respuesta no es un array o está vacía:", response)
                }
            },
            "json",
        ).fail(manejarError)
    })

    // Crear nuevo aviso
    $(document).on("click", ".btnCrearAviso", function () {
        const numeroNino = $(this).data("id")
        $("#formCrearAviso").data("numeroNino", numeroNino)
        $("#modalCrearAviso").modal("show")
    })

    $("#formCrearAviso").on("submit", function (e) {
        e.preventDefault()
        const numeroNino = $(this).data("numeroNino")
        const tipoAviso = $("#tipoAviso").val()
        const fechaNotificacion = $("#fechaNotificacion").val()
        const planesFuturos = $("#planesFuturos").val()

        $.post(
            "../Ajax/avisosEmbarazoController.php",
            {
                accion: "insertarAviso",
                numeroNino: numeroNino,
                tipoAviso: tipoAviso,
                fechaNotificacion: fechaNotificacion,
                planesFuturos: planesFuturos,
            },
            (response) => {
                mostrarAlerta("success", response.message || "Aviso creado exitosamente.")
                $("#modalCrearAviso").modal("hide")

                // Actualizar la tabla para mostrar el botón de agregar cierre y ocultar el de crear aviso
                actualizarTablaNinos()
            },
            "json",
        ).fail(manejarError)
    })

    // Agregar cierre al aviso
    $(document).on("click", ".btnAgregarCierre", function () {
        const numeroNino = $(this).data("id")
        $("#formAgregarCierre").data("numeroNino", numeroNino)
        $("#modalAgregarCierre").modal("show")
    })

    $("#formAgregarCierre").on("submit", function (e) {
        e.preventDefault()
        const numeroNino = $(this).data("numeroNino")
        const fechaCierre = $("#fechaCierre").val()
        const observaciones = $("#observaciones").val()

        $.post(
            "../Ajax/avisosEmbarazoController.php",
            {
                accion: "actualizarAviso",
                numeroNino: numeroNino,
                fechaCierre: fechaCierre,
                observaciones: observaciones,
            },
            (response) => {
                mostrarAlerta("success", response.message || "Cierre agregado exitosamente.")
                $("#modalAgregarCierre").modal("hide")

                // Actualizar la tabla para ocultar ambos botones
                actualizarTablaNinos()
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
                "../Ajax/avisosEmbarazoController.php",
                {
                    accion: "obtenerNinosPorAldea",
                    aldea: aldea,
                    idGestor: idGestor,
                },
                (response) => {
                    tablaNiños.clear()
                    if (response && Array.isArray(response)) {
                        response.forEach((niño) => {
                            // Determinar la visibilidad de los botones basado en el estado
                            const btnCrearAvisoVisible = !niño.tipo_aviso
                            const btnAgregarCierreVisible = niño.tipo_aviso && !niño.fecha_cierre

                            tablaNiños.row
                                .add([
                                    niño.numero_nino,
                                    niño.nombre_completo,
                                    niño.comunidad || "",
                                    niño.aldea || "",
                                    niño.edad || "",
                                    niño.tipo_aviso || "",
                                    niño.planes_futuros_desc || "",
                                    niño.fecha_notificacion || "",
                                    niño.observaciones || "",
                                    niño.fecha_cierre || "",
                                    `<button class="btn btn-success btnCrearAviso" data-id="${niño.numero_nino}" ${btnCrearAvisoVisible ? "" : 'style="display: none;"'}>Crear Aviso</button>
                            <button class="btn btn-warning btnAgregarCierre" data-id="${niño.numero_nino}" ${btnAgregarCierreVisible ? "" : 'style="display: none;"'}>Agregar Cierre</button>`,
                                ])
                                .draw(false)
                        })
                    }
                },
                "json",
            ).fail(manejarError)
        }
    }
})
