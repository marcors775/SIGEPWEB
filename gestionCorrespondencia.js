const dataTableConfig = {
  language: {
    lengthMenu: "Mostrar _MENU_ registros por página",
    zeroRecords: "No se encontraron resultados",
    info: "Mostrando _START_ a _END_ de _TOTAL_ registros",
    infoEmpty: "Mostrando 0 a 0 de 0 registros",
    infoFiltered: "(filtrado de _MAX_ registros totales)",
    search: "Buscar:",
    paginate: {
      first: "Primero",
      last: "Último",
      next: "Siguiente",
      previous: "Anterior"
    }
  }
};

let tablaCartasGlobal = null;

$(document).ready(function () {
  cargarTiposCartas();
  inicializarResumen();
  inicializarPaquetes();

  // ✅ Botón para descargar todas las cartas
  $("#tablaResumen").before(`
    <button id="btnDescargarTodoGestion" class="btn btn-success mb-3">
      <i class="fas fa-download"></i> Descargar todas las cartas
    </button>
  `);

  $("#btnDescargarTodoGestion").on("click", function () {
    window.open('../Ajax/ajaxGestionCorrespondencia.php?op=descargarTodas', '_blank');
  });

  $('a[data-toggle="tab"][href="#tabPaquetes"]').on('shown.bs.tab', function () {
    inicializarPaquetes();
  });

  // 📩 Carga de correspondencia
  $("#formCorrespondencia").off("submit").on("submit", function (e) {
    e.preventDefault();
    const formData = new FormData(this);
    formData.append("fecha_recepcion", $("#fecha_recepcion").val());

    $.ajax({
      url: "../Ajax/ajaxGestionCorrespondencia.php?op=cargar",
      type: "POST",
      data: formData,
      contentType: false,
      processData: false,
      dataType: "json",
      success: function (data) {
        if (data.status) {
          $('#tablaResumen').DataTable().ajax.reload();
          inicializarPaquetes();
          const total = data.total !== undefined ? data.total : (data.data ? data.data.length : 0);
          Swal.fire('Éxito', `Se cargaron ${total} registros.`, 'success');
          $("#formCorrespondencia")[0].reset();
        } else {
          Swal.fire('Error', data.message || 'No se pudo cargar el archivo.', 'error');
        }
      },
      error: function (xhr) {
        console.error("Error AJAX:", xhr.responseText);
        Swal.fire('Error', 'No se pudo enviar el formulario.', 'error');
      }
    });
  });
});

function cargarTiposCartas() {
  $.ajax({
    url: "../Ajax/ajaxGestionCorrespondencia.php?op=getTiposCartas",
    type: "GET",
    dataType: "json",
    success: function (result) {
      const tipos = result.data || [];
      const select = $("#tipoCarta");
      select.empty().append('<option value="">Seleccione...</option>');
      tipos.forEach(function (tipo) {
        select.append(`<option value="${tipo.codigo}">${tipo.tipocarta}</option>`);
      });
    },
    error: function () {
      Swal.fire('Error', 'No se pudo cargar tipos de cartas.', 'error');
    }
  });
}

function inicializarResumen() {
  $('#tablaResumen').DataTable({
    ...dataTableConfig,
    ajax: {
      url: "../Ajax/ajaxGestionCorrespondencia.php?op=getResumen",
      dataSrc: "data"
    },
    columns: [
      { data: "tipocarta" },
      { data: "total" },
      {
        data: null,
        render: function (data) {
          let tipoNormalizado = 'welcome';
          if (data.tipocarta.toLowerCase().includes('contestacion')) tipoNormalizado = 'reply';
          else if (data.tipocarta.toLowerCase().includes('agradecimiento')) tipoNormalizado = 'dfc';
          return `
            <button class="btn btn-primary btn-sm" onclick="verCartas('${data.codigo}', '${tipoNormalizado}')">
              <i class="fas fa-eye"></i> Ver Cartas
            </button>`;
        }
      }
    ],
    responsive: true,
    pageLength: 10
  });
}

function inicializarPaquetes() {
  $.ajax({
    url: "../Ajax/ajaxGestionCorrespondencia.php?op=getPaquetes",
    type: "GET",
    dataType: "json",
    success: function (response) {
      if (!response || !response.data || typeof response.data !== 'object') {
        $("#contenedorPaquetes").html("<p class='text-center text-muted'>No se encontraron registros.</p>");
        return;
      }

      const grupos = response.data;
      const contenedor = $("#contenedorPaquetes");
      contenedor.empty();

      Object.keys(grupos).forEach((mesAnio, index) => {
        const totalMes = grupos[mesAnio].reduce((sum, item) => sum + parseInt(item.total), 0);
        const collapseId = `collapseMes${index}`;

        let html = `
          <div class="card mb-2">
            <div class="card-header bg-dark text-white d-flex justify-content-between align-items-center" 
                 style="cursor:pointer" 
                 data-toggle="collapse" data-target="#${collapseId}">
              <strong>${mesAnio}</strong>
              <div>
                <span class="badge badge-primary p-2 mr-2">Total: ${totalMes}</span>
                <button class="btn btn-sm btn-info">Ver Detalles</button>
              </div>
            </div>
            <div id="${collapseId}" class="collapse">
              <div class="card-body p-2">
                <table class="table table-sm table-striped">
                  <thead class="thead-light">
                    <tr>
                      <th>Tipo Carta</th>
                      <th>Fecha Recepción</th>
                      <th>Total</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
        `;

        grupos[mesAnio].forEach(item => {
          html += `
            <tr>
              <td>${item.tipocarta}</td>
              <td>${item.fecha_recepcion}</td>
              <td>${item.total}</td>
              <td>
                <button class="btn btn-info btn-sm mx-1" 
                  onclick="verCartasPaquete('${item.tipoCarta}', '${item.fecha_recepcion}', '${item.tipocarta}')">
                  <i class="fas fa-eye"></i> Ver
                </button>
                <button class="btn btn-danger btn-sm mx-1" 
                  onclick="eliminarPaquete('${item.tipoCarta}', '${item.fecha_recepcion}')">
                  <i class="fas fa-trash"></i> Eliminar
                </button>
              </td>
            </tr>`;
        });

        html += `
                  </tbody>
                </table>
              </div>
            </div>
          </div>`;
        contenedor.append(html);
      });
    },
    error: function (xhr) {
      console.error("Error AJAX (Paquetes):", xhr.responseText);
      $("#contenedorPaquetes").html("<p class='text-center text-danger'>Error al cargar los paquetes.</p>");
    }
  });
}

function getColumnsByTipo(tipoNombre) {
  const nombreLower = tipoNombre.toLowerCase();

  if (nombreLower.includes("contestacion") || nombreLower.includes("reply")) {
    return [
      { title: "Community ID", data: "community_id" },
      { title: "Village", data: "village" },
      { title: "Child Number", data: "child_number" },
      { title: "Participant: Full Name", data: "full_name" },
      { title: "Mail Control Slip: MCS ID", data: "codigo_mcs" },
      { title: "MCS Date", data: "fecha_mcs" },
      { title: "Due Date", data: "fecha_vencimiento" },
      { title: "Reception Date", data: "fecha_recepcion" },
      { title: "Comments", data: "comments" },
      { title: "Tipo de Carta", data: "tipocarta" },
      { title: "Gestor", data: "gestor" }
    ];
  }

  if (nombreLower.includes("agradecimiento") || nombreLower.includes("dfc")) {
    return [
      { title: "Community ID", data: "community_id" },
      { title: "Village", data: "village" },
      { title: "Child Number", data: "child_number" },
      { title: "Participant: Full Name", data: "full_name" },
      { title: "DFC Amount", data: "dfc_amount" },
      { title: "Mail Control Slip: MCS ID", data: "codigo_mcs" },
      { title: "MCS Date", data: "fecha_mcs" },
      { title: "Due Date", data: "fecha_vencimiento" },
      { title: "Reception Date", data: "fecha_recepcion" },
      { title: "DFC Purpose", data: "dfc_purpose" },
      { title: "Alliance Name", data: "alliance_name" },
      { title: "Tipo de Carta", data: "tipocarta" },
      { title: "Gestor", data: "gestor" }
    ];
  }

  return [
    { title: "Community ID", data: "community_id" },
    { title: "Village", data: "village" },
    { title: "Child Number", data: "child_number" },
    { title: "Participant: Full Name", data: "full_name" },
    { title: "Mail Control Slip: MCS ID", data: "codigo_mcs" },
    { title: "MCS Date", data: "fecha_mcs" },
    { title: "Due Date", data: "fecha_vencimiento" },
    { title: "Reception Date", data: "fecha_recepcion" },
    { title: "Tipo de Carta", data: "tipocarta" },
    { title: "Gestor", data: "gestor" }
  ];
}

function verCartas(tipoCarta, nombreTipo) {
  $('#modalVerCartasLabel').text('Cartas - ' + nombreTipo);

  if ($.fn.DataTable.isDataTable('#tablaCartas')) {
    $('#tablaCartas').DataTable().clear().destroy();
  }

  $('#tablaCartas').empty();

  tablaCartasGlobal = $('#tablaCartas').DataTable({
    ajax: {
      url: "../Ajax/ajaxGestionCorrespondencia.php?op=getCartasPorTipo",
      type: "POST",
      data: { tipoCarta: tipoCarta },
      dataSrc: "data"
    },
    columns: getColumnsByTipo(nombreTipo),
    responsive: true,
    scrollX: false,
    autoWidth: true,
    pageLength: 10,
    dom: 'Bfrtip',
    buttons: [
      { extend: 'excelHtml5', text: '<i class="fas fa-file-excel"></i> Excel', className: 'btn btn-success btn-sm' },
      { extend: 'pdfHtml5', text: '<i class="fas fa-file-pdf"></i> PDF', className: 'btn btn-danger btn-sm' },
      { extend: 'print', text: '<i class="fas fa-print"></i> Imprimir', className: 'btn btn-primary btn-sm' }
    ],
    language: dataTableConfig.language
  });

  $('#modalVerCartas').modal('show');
}

function verCartasPaquete(tipoCarta, fechaRecepcion, nombreTipo) {
  $('#modalVerCartasLabel').text(`Cartas - Paquete (${fechaRecepcion})`);

  if ($.fn.DataTable.isDataTable('#tablaCartas')) {
    $('#tablaCartas').DataTable().clear().destroy();
  }

  $('#tablaCartas').empty();

  tablaCartasGlobal = $('#tablaCartas').DataTable({
    ajax: {
      url: "../Ajax/ajaxGestionCorrespondencia.php?op=getCartasPorPaquete",
      type: "POST",
      data: { tipoCarta: tipoCarta, fechaRecepcion: fechaRecepcion },
      dataSrc: "data"
    },
    columns: getColumnsByTipo(nombreTipo),
    responsive: true,
    scrollX: false,
    autoWidth: true,
    pageLength: 10,
    dom: 'Bfrtip',
    buttons: [
      { extend: 'excelHtml5', text: '<i class="fas fa-file-excel"></i> Excel', className: 'btn btn-success btn-sm' },
      { extend: 'pdfHtml5', text: '<i class="fas fa-file-pdf"></i> PDF', className: 'btn btn-danger btn-sm' },
      { extend: 'print', text: '<i class="fas fa-print"></i> Imprimir', className: 'btn btn-primary btn-sm' }
    ],
    language: dataTableConfig.language
  });

  $('#modalVerCartas').modal('show');
}

function eliminarPaquete(tipoCarta, fechaRecepcion) {
  Swal.fire({
    title: '¿Eliminar paquete?',
    text: `Se eliminarán todas las cartas del tipo ${tipoCarta} con fecha ${fechaRecepcion}`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      $.ajax({
        url: "../Ajax/ajaxGestionCorrespondencia.php?op=eliminarPaquete",
        type: "POST",
        dataType: "json",
        data: { tipoCarta: tipoCarta, fechaRecepcion: fechaRecepcion },
        success: function (data) {
          if (data.status) {
            Swal.fire('Eliminado', 'Paquete eliminado correctamente.', 'success');
            inicializarPaquetes();
            $('#tablaResumen').DataTable().ajax.reload(null, false);
          } else {
            Swal.fire('Error', data.message || 'No se pudo eliminar el paquete.', 'error');
          }
        },
        error: function () {
          Swal.fire('Error', 'No se pudo eliminar el paquete.', 'error');
        }
      });
    }
  });
}