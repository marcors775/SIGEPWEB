$(document).ready(function () {
    // ✅ Función para calcular edad a partir de fecha de nacimiento
    function calcularEdad(fechaNacimiento) {
        const hoy = new Date();
        const nacimiento = new Date(fechaNacimiento);
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        const mes = hoy.getMonth() - nacimiento.getMonth();
        if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
            edad--;
        }
        return edad;
    }

    var tabla = $('#tablaNinos').DataTable({
        ajax: {
            url: "../Ajax/actualizarRamController.php",
            method: "POST",
            data: { action: "obtener" },
            dataSrc: ""
        },
        columns: [
            { data: "Child_Number" },
            { data: "full_name" },
            { data: "village" },
            { data: "birthdate" }, // Mostrar fecha normal
            { 
                data: "birthdate",
                render: function(data) {
                    if (!data) return '';
                    return calcularEdad(data);
                }
            }, // Mostrar edad numérica
            { data: "community_number" },
            { data: "gender" },
            { data: "sponsorship_status" },
            { data: "enrolled_on_date" },
            { data: "local_partner" },
            { data: "alliance_name" },
            { data: "primary_contact_full_name" },
            {
                data: null,
                className: "text-center",
                render: function (data, type, row) {
                    if (row.sponsorship_status === 'Activo') {
                        return '<button class="btn btn-secondary btn-sm" disabled>No editable</button>';
                    }
                    return `
                        <button class="btn btn-primary btn-sm btnEditar">
                            <i class="fas fa-pen-to-square"></i> Editar
                        </button>
                    `;
                }
            }
        ],
        responsive: true,
        scrollY: "400px",
        scrollX: true,
        scrollCollapse: true,
        order: [[0, "asc"]],
        pageLength: 10,
        language: {
            lengthMenu: "Mostrar _MENU_ registros por página",
            search: "Buscar:",
            info: "Mostrando _START_ a _END_ de _TOTAL_ registros",
            infoEmpty: "No hay registros disponibles",
            infoFiltered: "(filtrado de _MAX_ registros)",
            paginate: {
                first: "Primero",
                last: "Último",
                next: "Siguiente",
                previous: "Anterior"
            }
        }
    });

    // ✅ Modal edición
    $('#tablaNinos').on('click', '.btnEditar', function () {
        var data = tabla.row($(this).parents('tr')).data();
        $('#child_number').val(data.Child_Number);
        $('#full_name').val(data.full_name);
        $('#village').val(data.village);
        $('#birthdate').val(data.birthdate);
        $('#community').val(data.community_number);
        $('#gender').val(data.gender);
        $('#local_partner').val(data.local_partner);
        $('#alliance_name').val(data.alliance_name);
        $('#primary_contact').val(data.primary_contact_full_name);
        $('#modalEdicion').modal('show');
    });

    // ✅ Validar formulario
    function validarFormulario() {
        const campos = [
            'full_name', 'village', 'birthdate',
            'community', 'gender', 'local_partner',
            'alliance_name', 'primary_contact'
        ];
        for (let campo of campos) {
            if (!$('#' + campo).val()) {
                Swal.fire('Error', 'Todos los campos son obligatorios', 'error');
                return false;
            }
        }
        return true;
    }

    // ✅ Guardar cambios
    $('#btnGuardar').click(function () {
        if (!validarFormulario()) return;

        $.ajax({
            url: '../Ajax/actualizarRamController.php',
            method: 'POST',
            data: {
                action: 'actualizar',
                Child_Number: $('#child_number').val(),
                full_name: $('#full_name').val(),
                village: $('#village').val(),
                birthdate: $('#birthdate').val(),
                community_number: $('#community').val(),
                gender: $('#gender').val(),
                local_partner: $('#local_partner').val(),
                alliance_name: $('#alliance_name').val(),
                primary_contact_full_name: $('#primary_contact').val()
            },
            success: function (response) {
                try {
                    var result = JSON.parse(response);
                    if (result.mensaje === 'Actualización exitosa') {
                        $('#modalEdicion').modal('hide');
                        tabla.ajax.reload();
                        Swal.fire('¡Éxito!', 'Datos actualizados correctamente', 'success');
                    } else {
                        Swal.fire('Error', result.mensaje, 'error');
                    }
                } catch (e) {
                    Swal.fire('Error', 'Error al procesar la respuesta del servidor', 'error');
                }
            },
            error: function () {
                Swal.fire('Error', 'Ocurrió un error al actualizar los datos', 'error');
            }
        });
    });

    // ✅ Limpiar modal al cerrar
    $('#modalEdicion').on('hidden.bs.modal', function () {
        $('#formEdicion')[0].reset();
    });
});