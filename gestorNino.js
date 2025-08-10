$(document).ready(function () {
    let gestoresDisponibles = [];

    function mostrarAlerta(mensaje, tipo = 'success') {
        $('#alertas').html(`
            <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
                ${mensaje}
                <button type="button" class="close" data-dismiss="alert"><span>&times;</span></button>
            </div>`);
    }

    function cargarVillages() {
        $.post('../Ajax/asignarGestorController.php', { accion: 'listar_villages', gestor_id: null }, function (data) {
            const tbody = $('#tabla-villages tbody');
            tbody.empty();
            if (!Array.isArray(data)) {
                mostrarAlerta('Error al obtener villages.', 'danger');
                return;
            }
            data.forEach(v => {
                const btn = `<button class="btn btn-info btn-sm ver-ninos" data-id="${v.id}" data-nombre="${v.nombre}">Ver Niños</button>`;
                tbody.append(`<tr><td>${v.nombre}</td><td>${v.total}</td><td>${btn}</td></tr>`);
            });

            // Activar DataTable sobre tabla de villages
            if ($.fn.DataTable.isDataTable('#tabla-villages')) {
                $('#tabla-villages').DataTable().destroy();
            }
            $('#tabla-villages').DataTable({
                paging: true,
                searching: true,
                ordering: false,
                language: {
                    url: "//cdn.datatables.net/plug-ins/1.13.5/i18n/es-ES.json"
                }
            });

        }, 'json').fail(() => {
            mostrarAlerta('Error en el servidor al cargar villages.', 'danger');
        });
    }

    function cargarGestoresDisponibles(callback) {
        $.post('../Ajax/gestorNinoController.php', { accion: 'listar_gestores' }, function (data) {
            //console.log("Gestores disponibles:", data);
            
            if (Array.isArray(data)) {
                gestoresDisponibles = data;
                if (typeof callback === 'function') callback();
            } else {
                mostrarAlerta('Error al cargar gestores.', 'danger');
            }
        }, 'json').fail(() => {
            mostrarAlerta('Error en el servidor al cargar gestores.', 'danger');
        });
    }

    function cargarGestoresAsignadosPorNino(nino_id) {
        $.post('../Ajax/gestorNinoController.php', {
            accion: 'gestores_nino',
            nino_id
        }, function (data) {
            const celda = $(`.gestores-asignados[data-nino="${nino_id}"]`);
            if (!Array.isArray(data)) {
                celda.html('<span class="text-danger">Error</span>');
                return;
            }

            if (data.length === 0) {
                celda.html('<em>Sin asignar</em>');
                return;
            }

            const lista = data.map(g => `
                <span class="badge badge-info mr-1">
                    ${g.nombre_completo}
                    <button class="btn btn-sm btn-danger btn-remove px-1 py-0 ml-1" data-id="${g.Cedula}" data-nino="${nino_id}">×</button>
                </span>
            `).join('');
            celda.html(lista);
        }, 'json').fail(() => {
            mostrarAlerta('Error al cargar gestores asignados.', 'danger');
        });
    }

    function renderTablaNinos(data) {
        const tbody = $('#tabla-ninos-village-body');
        tbody.empty();

        if (!Array.isArray(data)) {
            tbody.append(`<tr><td colspan="5" class="text-danger">Error al obtener niños</td></tr>`);
            return;
        }

        if (data.length === 0) {
            tbody.append(`<tr><td colspan="5">No hay niños registrados</td></tr>`);
            return;
        }

        if ($.fn.DataTable.isDataTable('#tabla-ninos-village')) {
            $('#tabla-ninos-village').DataTable().clear().destroy();
        }
        
        data.forEach(n => {
            const opciones = gestoresDisponibles.map(g =>
                `<option value="${g.Cedula}">${g.nombre_completo}</option>`).join('');
        
            const selectGestores = `<select class="form-control select-gestor" data-nino="${n.id_nino}">${opciones}</select>`;
            const asignarBtn = `<button class="btn btn-sm btn-success asignar-directo" data-nino="${n.id_nino}">Asignar</button>`;
        
            const fila = `<tr>
                <td>${n.full_name}</td>
                <td>${n.Child_Number}</td>
                <td class="gestores-asignados" data-nino="${n.id_nino}">Cargando...</td>
                <td>${selectGestores}</td>
                <td>${asignarBtn}</td>
            </tr>`;
        
            $('#tabla-ninos-village-body').append(fila);
            cargarGestoresAsignadosPorNino(n.id_nino);
        });
        
        $('#tabla-ninos-village').DataTable({
            paging: true,
            searching: true,
            ordering: false,
            language: {
                url: "//cdn.datatables.net/plug-ins/1.13.5/i18n/es-ES.json"
            }
        });

        if ($.fn.DataTable.isDataTable('#tabla-ninos-village')) {
            $('#tabla-ninos-village').DataTable().destroy();
        }

        $('#tabla-ninos-village').DataTable({
            paging: true,
            searching: true,
            ordering: false,
            language: {
                url: "//cdn.datatables.net/plug-ins/1.13.5/i18n/es-ES.json"
            }
        });
    }

    $(document).on('click', '.ver-ninos', function () {
        const village_id = $(this).data('id');
        const nombre = $(this).data('nombre');
    
        if (!village_id) {
            mostrarAlerta('Village ID no válido.', 'danger');
            return;
        }
    
        $('#titulo-village').text(nombre);
    
        // 🧹 Limpiar tabla y destruir DataTable antes de mostrar el modal
        if ($.fn.DataTable.isDataTable('#tabla-ninos-village')) {
            $('#tabla-ninos-village').DataTable().clear().destroy();
        }
        $('#tabla-ninos-village-body').empty();
    
        $('#modal-ninos-village').modal('show');
    
        cargarGestoresDisponibles(() => {
            $.post('../Ajax/gestorNinoController.php', { accion: 'listar_ninos', village_id }, function (data) {
                const tbody = $('#tabla-ninos-village-body');
                tbody.empty();
    
                if (!Array.isArray(data)) {
                    tbody.append(`<tr><td colspan="5" class="text-danger">Error al obtener niños</td></tr>`);
                    return;
                }
    
                if (data.length === 0) {
                    tbody.append(`<tr><td colspan="5">No hay niños registrados</td></tr>`);
                    return;
                }
    
                data.forEach(n => {
                    const opciones = gestoresDisponibles.map(g =>
                        `<option value="${g.Cedula}">${g.nombre_completo}</option>`).join('');
    
                    const selectGestores = `<select class="form-control select-gestor" data-nino="${n.id_nino}">${opciones}</select>`;
                    const asignarBtn = `<button class="btn btn-sm btn-success asignar-directo" data-nino="${n.id_nino}">Asignar</button>`;
    
                    const fila = `<tr>
                        <td>${n.full_name}</td>
                        <td>${n.Child_Number}</td>
                        <td class="gestores-asignados" data-nino="${n.id_nino}">Cargando...</td>
                        <td>${selectGestores}</td>
                        <td>${asignarBtn}</td>
                    </tr>`;
    
                    tbody.append(fila);
                    cargarGestoresAsignadosPorNino(n.id_nino);
                });
    
                $('#tabla-ninos-village').DataTable({
                    paging: true,
                    searching: true,
                    ordering: false,
                    language: {
                        url: "//cdn.datatables.net/plug-ins/1.13.5/i18n/es-ES.json"
                    }
                });
            }, 'json');
        });
    });

    $(document).on('click', '.btn-remove', function () {
        const gestor_id = $(this).data('id');
        const nino_id = $(this).data('nino');

        if (!gestor_id || !nino_id) {
            mostrarAlerta('Faltan datos para eliminar.', 'warning');
            return;
        }

        $.post('../Ajax/gestorNinoController.php', {
            accion: 'eliminar',
            gestor_id,
            nino_id
        }, function (resp) {
            if (resp.exito) {
                cargarGestoresAsignadosPorNino(nino_id);
            } else {
                mostrarAlerta('No se pudo eliminar.', 'danger');
            }
        }, 'json').fail(() => {
            mostrarAlerta('Error de servidor al eliminar.', 'danger');
        });
    });

    $(document).on('click', '.asignar-directo', function () {
        const nino_id = $(this).data('nino');
        const gestor_id = $(`.select-gestor[data-nino="${nino_id}"]`).val();

        if (!nino_id || !gestor_id) {
            mostrarAlerta('Debe seleccionar un gestor.', 'warning');
            return;
        }

        $.post('../Ajax/gestorNinoController.php', {
            accion: 'asignar',
            gestor_id,
            nino_id
        }, function (resp) {
            if (resp.exito) {
                cargarGestoresAsignadosPorNino(nino_id);
                mostrarAlerta('Asignado correctamente.');
            } else {
                mostrarAlerta('No se pudo asignar.', 'danger');
            }
        }, 'json').fail(() => {
            mostrarAlerta('Error al intentar asignar gestor.', 'danger');
        });
    });

    $('#form-buscar-nino').submit(function (e) {
        e.preventDefault();
        const query = $('#buscar-nino').val().trim();
        if (!query) return;

        $.post('../Ajax/gestorNinoController.php', {
            accion: 'buscar_nino',
            query
        }, function (data) {
            const ul = $('#resultado-busqueda-nino');
            ul.empty();

            if (!Array.isArray(data)) {
                ul.html('<li class="list-group-item text-danger">Error en la búsqueda</li>');
                return;
            }

            if (data.length === 0) {
                ul.append('<li class="list-group-item">No se encontraron coincidencias</li>');
                return;
            }

            data.forEach(n => {
                ul.append(`<li class="list-group-item d-flex justify-content-between align-items-center">
                    ${n.full_name} (${n.Child_Number})
                    <button class="btn btn-sm btn-primary ver-gestores-nino" data-id="${n.id_nino}" data-nombre="${n.full_name}">Gestores</button>
                </li>`);
            });
        }, 'json').fail(() => {
            mostrarAlerta('Error de servidor en búsqueda.', 'danger');
        });
    });
    
    
    // Evento: botón "Ver Gestores" en búsqueda por niño
    $(document).on('click', '.ver-gestores-nino', function () {
        const nino_id = $(this).data('id');
        const nombre = $(this).data('nombre');
    
        $('#titulo-nino').text(nombre);
        $('#modal-gestores-nino').modal('show');
    
        // Cargar gestores asignados al niño
        $.post('../Ajax/gestorNinoController.php', {
            accion: 'gestores_nino',
            nino_id
        }, function (data) {
            const ul = $('#lista-gestores-nino');
            ul.empty();
    
            if (!Array.isArray(data)) {
                ul.append('<li class="list-group-item text-danger">Error al cargar gestores</li>');
                return;
            }
    
            if (data.length === 0) {
                ul.append('<li class="list-group-item">Sin gestores asignados</li>');
                return;
            }
    
            data.forEach(g => {
                ul.append(`<li class="list-group-item d-flex justify-content-between align-items-center">
                    ${g.nombre_completo}
                    <button class="btn btn-danger btn-sm btn-remove" data-id="${g.Cedula}" data-nino="${nino_id}">×</button>
                </li>`);
            });
        }, 'json');
    
        // Cargar lista de gestores disponibles
        cargarGestoresDisponibles(() => {
            const select = $('#nuevo-gestor');
            select.empty();
            gestoresDisponibles.forEach(g => {
                select.append(`<option value="${g.Cedula}">${g.nombre_completo}</option>`);
            });
            $('#btn-asignar-gestor-nino').data('nino', nino_id);
        });
    });
    
    // Evento: botón "Asignar Gestor" en el modal
    $('#btn-asignar-gestor-nino').click(function () {
        const nino_id = $(this).data('nino');
        const gestor_id = $('#nuevo-gestor').val();
    
        if (!nino_id || !gestor_id) {
            mostrarAlerta('Debe seleccionar un gestor.', 'warning');
            return;
        }
    
        $.post('../Ajax/gestorNinoController.php', {
            accion: 'asignar',
            gestor_id,
            nino_id
        }, function (resp) {
            if (resp.exito) {
                mostrarAlerta('Gestor asignado correctamente.');
                $(`button.ver-gestores-nino[data-id="${nino_id}"]`).click();
            } else {
                mostrarAlerta('No se pudo asignar.', 'danger');
            }
        }, 'json');
    });
    
    cargarVillages();
});