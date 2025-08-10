const colorMap = {};
const coloresBase = [
  "#007bff", "#28a745", "#ffc107", "#dc3545", "#17a2b8",
  "#6f42c1", "#e83e8c", "#fd7e14", "#20c997", "#6610f2"
];
let filtroUsuarioActivo = null;
let calendar;

function getColorForUser(nombre) {
  if (!colorMap[nombre]) {
    const color = coloresBase[Object.keys(colorMap).length % coloresBase.length];
    colorMap[nombre] = color;
    actualizarLeyendaUsuarios();
  }
  return colorMap[nombre];
}

function actualizarLeyendaUsuarios() {
  const leyenda = document.getElementById("leyendaUsuarios");
  if (!leyenda) return;

  leyenda.innerHTML = "";

  // Crear etiquetas por usuario con funcionalidad de filtro
  Object.entries(colorMap).forEach(([nombre, color]) => {
    const span = document.createElement("span");
    span.className = "badge badge-pill mr-2 mb-1";
    span.style.backgroundColor = color;
    span.style.cursor = "pointer";
    span.textContent = nombre;

    span.onclick = () => {
      filtroUsuarioActivo = nombre;
      calendar.refetchEvents();
    };

    leyenda.appendChild(span);
  });

  // 🔄 Siempre mostrar el botón si hay filtro activo
  if (filtroUsuarioActivo) {
    const btn = document.createElement("button");
    btn.id = "btnVerTodos";
    btn.className = "btn btn-outline-primary btn-sm ml-2";
    btn.textContent = "🔄 Ver todos";
    btn.onclick = () => {
      filtroUsuarioActivo = null;
      calendar.refetchEvents();
      actualizarLeyendaUsuarios(); // Redibujar sin filtro
    };
    leyenda.appendChild(btn);
  }
}

function mostrarBotonVerTodos() {
  if (document.getElementById("btnVerTodos")) return;
  const leyenda = document.getElementById("leyendaUsuarios");
  const btn = document.createElement("button");
  btn.id = "btnVerTodos";
  btn.className = "btn btn-outline-primary btn-sm ml-2";
  btn.textContent = "🔄 Ver todos";
  btn.onclick = () => {
    filtroUsuarioActivo = null;
    calendar.refetchEvents();
    document.getElementById("btnVerTodos")?.remove();
  };
  leyenda.appendChild(btn);
}

document.addEventListener("DOMContentLoaded", function () {
  const calendarEl = document.getElementById("calendar");
  const modoVista = document.getElementById("modoVista");

calendar = new FullCalendar.Calendar(calendarEl, {
  initialView: "timeGridWeek",
  locale: "es",
  allDaySlot: false,
  slotMinTime: "07:00:00",
  slotMaxTime: "20:00:00",
  height: "auto",
  buttonText: {
    today: 'Hoy',
    month: 'Mes',
    week: 'Semana',
    day: 'Día'
  },
  headerToolbar: {
    left: "prev,next today",
    center: "title",
    right: "dayGridMonth,timeGridWeek,timeGridDay"
  },
  events: async function (info, successCallback, failureCallback) {
    const form = new FormData();
    const modo = modoVista?.value || "usuario";
    form.append("accion", modo === "global" ? "listar_global" : "listar_usuario");

    if (modo === "global") {
      form.append("fecha_inicio", info.startStr.split("T")[0]);
      form.append("fecha_fin", info.endStr.split("T")[0]);
    }

    const res = await fetch("../Ajax/ajax_planificacion.php", {
      method: "POST",
      body: form
    });

    const text = await res.text();
    try {
      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        const eventos = data
          .filter(item => modo !== "global" || !filtroUsuarioActivo || item.Nombre_Completo === filtroUsuarioActivo)
          .map(item => {
            if (modo === "global" && item.Nombre_Completo) {
              getColorForUser(item.Nombre_Completo);
            }
            return {
              id: item.id,
              title: modo === "global" && item.Nombre_Completo
                ? `[${item.Nombre_Completo}] ${item.titulo}`
                : item.titulo,
              start: item.fecha + "T" + item.hora_inicio,
              end: item.fecha + "T" + item.hora_fin,
              backgroundColor:
                modo === "global" && item.Nombre_Completo
                  ? getColorForUser(item.Nombre_Completo)
                  : (item.tipo_actividad === "Campo" ? "#28a745"
                    : item.tipo_actividad === "Reunión" ? "#ffc107"
                    : "#007bff"),
              borderColor: "#000000",
              extendedProps: {
                descripcion: item.descripcion,
                estado: item.estado,
                tipo_actividad: item.tipo_actividad
              }
            };
          });

        if (modo === "global") {
          actualizarLeyendaUsuarios();
        }

        successCallback(eventos);
      } else {
        failureCallback();
      }
    } catch (e) {
      alert("Error al procesar datos del servidor:\n" + text);
      failureCallback();
    }
  },
  eventClick: function (info) {
    const modo = modoVista?.value || "usuario";
    if (modo !== "usuario") return;

    const e = info.event;
    document.getElementById("edit-id").value = e.id;
    document.getElementById("edit-titulo").value = e.title;
    document.getElementById("edit-descripcion").value = e.extendedProps.descripcion;
    document.getElementById("edit-fecha").value = e.startStr.split("T")[0];
    document.getElementById("edit-hora_inicio").value = e.startStr.split("T")[1].substring(0, 5);
    document.getElementById("edit-hora_fin").value = e.endStr.split("T")[1].substring(0, 5);
    document.getElementById("edit-tipo").value = e.extendedProps.tipo_actividad;
    document.getElementById("edit-estado").value = e.extendedProps.estado;

    $('#modalEditarActividad').modal('show');
  }
});

calendar.render();

calendar.on("datesSet", async () => {
  const modo = modoVista?.value;
  const wrapper = document.getElementById("tablaGlobalWrapper");

  if (modo === "global") {
    const fechaInicio = calendar.view.activeStart.toISOString().split("T")[0];
    const fechaFin = calendar.view.activeEnd.toISOString().split("T")[0];

    if (wrapper) wrapper.style.display = "block";
    await cargarTablaGlobal(fechaInicio, fechaFin);
  } else {
    if (wrapper) wrapper.style.display = "none";
  }
});

async function cargarTablaGlobal(fechaInicio, fechaFin) {
  //console.log("📅 Cargando tabla entre:", fechaInicio, "y", fechaFin);

  const form = new FormData();
  form.append("accion", "listar_global");
  form.append("fecha_inicio", fechaInicio);
  form.append("fecha_fin", fechaFin);

  const res = await fetch("../Ajax/ajax_planificacion.php", {
    method: "POST",
    body: form
  });

  const data = await res.json();
  //console.log("📦 Datos recibidos:", data);

  const tabla = document.getElementById("tablaPlanificacionGlobal");
  if (!tabla) {
    console.warn("❌ No se encontró la tabla.");
    return;
  }

  const tbody = tabla.querySelector("tbody");
  if (!tbody) {
    console.warn("❌ No se encontró el <tbody> de la tabla.");
    return;
  }

  // 🔁 Reiniciar DataTable correctamente
  if ($.fn.DataTable.isDataTable(tabla)) {
    $(tabla).DataTable().clear().destroy();
  }

  tbody.innerHTML = "";

  data.forEach(item => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.fecha}</td>
      <td>${item.hora_inicio} - ${item.hora_fin}</td>
      <td>${item.Nombre_Completo || "Usuario"}</td>
      <td>${item.titulo}</td>
      <td>${item.tipo_actividad}</td>
      <td>${item.estado}</td>
    `;
    tbody.appendChild(row);
  });

  // ✅ Inicializar DataTable de nuevo
  $(tabla).DataTable({
    pageLength: 10,
    order: [[0, "desc"]],
    language: {
      url: "//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json"
    }
  });

  // Asegurar que la tabla esté visible
  const wrapper = document.getElementById("tablaGlobalWrapper");
  if (wrapper) wrapper.style.display = "block";
}


function crearBotonesUsuario() {
  const container = document.querySelector(".content-header");
  if (!container) return;

  // Eliminar botones anteriores si ya existen
  document.getElementById("btnExportMisExcel")?.remove();
  document.getElementById("btnExportMisPDF")?.remove();

  // Crear botón Excel
  const btnXLS = document.createElement("button");
  btnXLS.id = "btnExportMisExcel";
  btnXLS.className = "btn btn-success btn-sm ml-2";
  btnXLS.innerHTML = '<i class="fas fa-file-excel"></i> Exportar Excel';
  btnXLS.addEventListener("click", () => {
    const eventos = calendar.getEvents().map(e => ({
      Fecha: e.startStr.split("T")[0],
      "Hora inicio": e.startStr.split("T")[1].substring(0, 5),
      "Hora fin": e.endStr.split("T")[1].substring(0, 5),
      Actividad: e.title,
      Tipo: e.extendedProps.tipo_actividad,
      Estado: e.extendedProps.estado
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(eventos);
    XLSX.utils.book_append_sheet(wb, ws, "Mis actividades");
    XLSX.writeFile(wb, "mis_actividades.xlsx");
  });

  // Crear botón PDF
  const btnPDF = document.createElement("button");
  btnPDF.id = "btnExportMisPDF";
  btnPDF.className = "btn btn-danger btn-sm ml-2";
  btnPDF.innerHTML = '<i class="fas fa-file-pdf"></i> Exportar PDF';
  btnPDF.addEventListener("click", () => {
    const eventos = calendar.getEvents().map(e => [
      e.startStr.split("T")[0],
      e.startStr.split("T")[1].substring(0, 5),
      e.endStr.split("T")[1].substring(0, 5),
      e.title,
      e.extendedProps.tipo_actividad,
      e.extendedProps.estado
    ]);

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "A4" });

    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.setFont("helvetica", "bold");
    doc.text("Mis Actividades Programadas", doc.internal.pageSize.getWidth() / 2, 40, { align: "center" });

    doc.autoTable({
      startY: 60,
      head: [["Fecha", "Hora Inicio", "Hora Fin", "Actividad", "Tipo", "Estado"]],
      body: eventos,
      margin: { left: 40, right: 40 },
      tableWidth: "auto",
      styles: {
        fontSize: 9,
        halign: "center",
        overflow: "linebreak",
        cellWidth: "wrap"
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: "bold"
      },
      theme: "grid"
    });

    doc.save("mis_actividades.pdf");
  });

  // Añadir al contenedor
  container.appendChild(btnXLS);
  container.appendChild(btnPDF);
}

modoVista.addEventListener("change", async function () {
  // 🔄 Limpiar leyendas y filtros si cambia de vista
  Object.keys(colorMap).forEach(key => delete colorMap[key]);
  filtroUsuarioActivo = null;
  actualizarLeyendaUsuarios();

  // Limpiar botones de exportación anteriores
  document.getElementById("btnExportMisExcel")?.remove();
  document.getElementById("btnExportMisPDF")?.remove();

  calendar.refetchEvents(); // Recarga eventos según la nueva vista

  const modo = modoVista.value;
  const wrapper = document.getElementById("tablaGlobalWrapper");
  const tabla = document.getElementById("tablaPlanificacionGlobal");

  if (!tabla || !wrapper) return;

  if (modo === "usuario") {
    wrapper.style.display = "none";
    crearBotonesUsuario();
    return;
  }

  if (modo === "global") {
    wrapper.style.display = "block";
    // No llamamos cargarTablaGlobal aquí porque ya se llama en datesSet
  }
});


  if (modoVista.value === "usuario") crearBotonesUsuario();
  document.getElementById("formActividad").addEventListener("submit", async function (e) {
    e.preventDefault();
    const formData = new FormData(this);
    formData.append("accion", "registrar");

    const res = await fetch("../Ajax/ajax_planificacion.php", {
      method: "POST",
      body: formData
    });

    const text = await res.text();
    try {
  const result = JSON.parse(text);
  if (result.status === "ok") {
    alert("✅ Actividad registrada.");
    $('#modalNuevaActividad').modal('hide');
    this.reset();
    calendar.refetchEvents();

    // ✅ Si estamos en vista global, actualizar la tabla también
    if (modoVista.value === "global") {
      const fechaInicio = calendar.view.activeStart.toISOString().split("T")[0];
      const fechaFin = calendar.view.activeEnd.toISOString().split("T")[0];
      await cargarTablaGlobal(fechaInicio, fechaFin);
    }

  } else {
    alert("❌ Error al registrar: " + (result.error || "Respuesta inesperada"));
    console.error(result);
  }
} catch (e) {
  console.error("❌ Error procesando respuesta:", e, text);
  alert("❌ Error del servidor:\n" + text);
}
  });

  document.getElementById("formEditarActividad").addEventListener("submit", async function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    formData.append("accion", "editar");

    const res = await fetch("../Ajax/ajax_planificacion.php", {
      method: "POST",
      body: formData
    });

    const text = await res.text();
    try {
      const result = JSON.parse(text);
      if (result.status === "ok") {
        alert("✅ Actividad actualizada.");
        $('#modalEditarActividad').modal('hide');
        calendar.refetchEvents();
      } else {
        alert("❌ Error al actualizar.");
      }
    } catch (e) {
      alert("❌ Error del servidor:\n" + text);
    }
  });
document.getElementById("btnExportCalendarioPDF")?.addEventListener("click", () => {
  const calendario = document.getElementById("calendar");
  const exportBtn = document.getElementById("btnExportCalendarioPDF");

  // Oculta el botón antes de capturar
  exportBtn.style.visibility = "hidden";

  html2canvas(calendario, {
    scrollY: -window.scrollY,
    useCORS: true,
    scale: 2 // mejora la resolución
  }).then(canvas => {
    exportBtn.style.visibility = "visible";

    const imgData = canvas.toDataURL("image/png");
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("landscape", "pt", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
    const imgWidth = canvas.width * ratio;
    const imgHeight = canvas.height * ratio;

    const x = (pageWidth - imgWidth) / 2; // centrado horizontal
    const y = 40; // margen superior

    pdf.setFontSize(14);
    pdf.text("Calendario de Actividades", pageWidth / 2, 30, { align: "center" });
    pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
    pdf.save("calendario_planificacion.pdf");
  }).catch(error => {
    exportBtn.style.visibility = "visible";
    alert("❌ Error al generar PDF del calendario.");
    console.error(error);
  });
});
  document.getElementById("btnEliminar").addEventListener("click", async function () {
    const id = document.getElementById("edit-id").value;
    if (!confirm("¿Deseas eliminar esta actividad?")) return;

    const formData = new FormData();
    formData.append("accion", "eliminar");
    formData.append("id", id);

    const res = await fetch("../Ajax/ajax_planificacion.php", {
      method: "POST",
      body: formData
    });

    const text = await res.text();
    try {
      const result = JSON.parse(text);
      if (result.status === "ok") {
        alert("🗑️ Actividad eliminada.");
        $('#modalEditarActividad').modal('hide');
        calendar.refetchEvents();
        if (modoVista.value === "global") {
          await cargarTablaGlobal(calendar.view.activeStart.toISOString(), calendar.view.activeEnd.toISOString());
        }
      } else {
        alert("❌ Error al eliminar.");
      }
    } catch (e) {
      alert("❌ Error del servidor:\n" + text);
    }
  });
});
// Funciones para exportar la tabla global
document.addEventListener("DOMContentLoaded", function () {
  const btnExportExcel = document.getElementById("btnExportExcel");
  const btnExportPDF = document.getElementById("btnExportPDF");

  if (btnExportExcel) {
    btnExportExcel.addEventListener("click", () => {
      const tabla = document.getElementById("tablaPlanificacionGlobal");
      if (!tabla) return;

      const rows = Array.from(tabla.querySelectorAll("tbody tr"));
      const datos = rows.map(row => {
        const celdas = row.querySelectorAll("td");
        return {
          Fecha: celdas[0].innerText,
          Hora: celdas[1].innerText,
          Usuario: celdas[2].innerText,
          Actividad: celdas[3].innerText,
          Tipo: celdas[4].innerText,
          Estado: celdas[5].innerText
        };
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(datos);
      XLSX.utils.book_append_sheet(wb, ws, "Planificación Global");
      XLSX.writeFile(wb, "planificacion_global.xlsx");
    });
  }

  if (btnExportPDF) {
    btnExportPDF.addEventListener("click", () => {
      const tabla = document.getElementById("tablaPlanificacionGlobal");
      if (!tabla) return;

      const rows = Array.from(tabla.querySelectorAll("tbody tr"));
      const datos = rows.map(row => {
        const celdas = row.querySelectorAll("td");
        return [
          celdas[0].innerText,
          celdas[1].innerText,
          celdas[2].innerText,
          celdas[3].innerText,
          celdas[4].innerText,
          celdas[5].innerText
        ];
      });

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF("landscape", "pt", "A4");

      doc.setFontSize(14);
      doc.text("Planificación Detallada", doc.internal.pageSize.getWidth() / 2, 30, { align: "center" });

      doc.autoTable({
        head: [["Fecha", "Hora", "Usuario", "Actividad", "Tipo", "Estado"]],
        body: datos,
        startY: 60,
        theme: "grid",
        styles: { fontSize: 9, halign: "center" },
        headStyles: { fillColor: [40, 167, 69] }
      });

      doc.save("planificacion_global.pdf");
    });
  }
});