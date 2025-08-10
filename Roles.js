$(document).ready(function () {
    console.log("✅ Roles.js cargado correctamente");

    let rolesDisponibles = [];

    // 🔄 Cargar lista de roles desde la base de datos
    $.get("../Ajax/permisosA.php?op=roles", function (data) {
        if (!Array.isArray(data)) {
            console.error("❌ La respuesta de roles no es una lista:", data);
            return;
        }

        // 🧩 Ordenar roles alfabéticamente por tipo_rol
        rolesDisponibles = data.sort((a, b) => a.tipo_rol.localeCompare(b.tipo_rol));
        cargarUsuarios();
    });

    function cargarUsuarios() {
        $.ajax({
            url: "../Ajax/roles.php?op=usuarios",
            method: "GET",
            dataType: "json",
            success: function (usuarios) {
                if (!Array.isArray(usuarios)) {
                    console.error("❌ No se recibió una lista de usuarios:", usuarios);
                    return;
                }

                const tbody = $("#tablaUsuarios tbody");
                tbody.empty();

                usuarios.forEach(u => {
                    const roles = u.roles.length > 0
                        ? u.roles.map(r => `
                            <span class="badge badge-success m-1">
                                ${r}
                                <button class="btn btn-sm btn-danger ml-1" onclick="eliminarRol(${u.Cedula}, '${r}')">x</button>
                            </span>
                        `).join("")
                        : '<span class="text-muted">Sin roles</span>';

                    const opciones = [`<option value="">Seleccione un rol</option>`];
                    rolesDisponibles.forEach(r => {
                        opciones.push(`<option value="${r.tipo_rol}">${r.tipo_rol}</option>`);
                    });

                    const selector = `
                        <select class="form-control form-control-sm" id="rol-${u.Cedula}">
                            ${opciones.join("")}
                        </select>
                        <button class="btn btn-sm btn-primary mt-1" onclick="asignarRol(${u.Cedula})">Asignar</button>
                    `;

                    tbody.append(`
                        <tr>
                            <td>${u.Cedula}</td>
                            <td>${u.nombre_completo}</td>
                            <td>${u.correo_electronico}</td>
                            <td>${roles}</td>
                            <td>${selector}</td>
                        </tr>
                    `);
                });
            },
            error: function (xhr) {
                console.error("❌ Error AJAX:", xhr.status, xhr.responseText);
                Swal.fire({
                    icon: 'error',
                    title: 'Error al cargar usuarios',
                    text: 'Revisa la consola o el servidor'
                });
            }
        });
    }

    // 🔄 Asignar rol
    window.asignarRol = function (cedula) {
        const rol = $(`#rol-${cedula}`).val();
        if (!rol) {
            Swal.fire({
                icon: 'warning',
                title: '⚠️ Selecciona un rol primero'
            });
            return;
        }

        $.post("../Ajax/roles.php?op=asignar", { cedula, rol }, function () {
            Swal.fire({
                icon: 'success',
                title: 'Rol asignado',
                toast: true,
                timer: 2000,
                position: 'top-end',
                showConfirmButton: false
            });
            cargarUsuarios();
        }).fail(function (xhr) {
            let msg = 'Ocurrió un error';
            if (xhr.responseJSON?.message) {
                msg = xhr.responseJSON.message;
            } else if (xhr.responseText) {
                msg = xhr.responseText;
            }
            console.error("❌ Error al asignar rol:", msg);
            Swal.fire({
                icon: 'error',
                title: 'Error al asignar rol',
                text: msg
            });
        });
    };

    // 🗑️ Eliminar rol
    window.eliminarRol = function (cedula, rol) {
        Swal.fire({
            title: `¿Eliminar el rol '${rol}'?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then(result => {
            if (result.isConfirmed) {
                $.post("../Ajax/roles.php?op=eliminar", { cedula, rol }, function () {
                    Swal.fire({
                        icon: 'info',
                        title: 'Rol eliminado',
                        toast: true,
                        timer: 2000,
                        position: 'top-end',
                        showConfirmButton: false
                    });
                    cargarUsuarios();
                }).fail(function (xhr) {
                    let msg = 'Ocurrió un error';
                    if (xhr.responseJSON?.message) {
                        msg = xhr.responseJSON.message;
                    } else if (xhr.responseText) {
                        msg = xhr.responseText;
                    }
                    console.error("❌ Error al eliminar rol:", msg);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error al eliminar rol',
                        text: msg
                    });
                });
            }
        });
    };
});
