document.addEventListener("DOMContentLoaded", function () {
    const tablaProgreso = document.getElementById("tablaProgreso").querySelector("tbody");

    // Referencia al modal
    const modalDetalles = document.getElementById("modalDetalles");
    const modalBody = modalDetalles.querySelector(".modal-body");

    // Cargar comunidades en el filtro
    function cargarComunidades() {
        fetch("../Ajax/progresoController.php?action=getComunidades")
            .then(response => {
                if (!response.ok) {
                    throw new Error("Error en la respuesta de la red");
                }
                return response.json();
            })
            .catch(error => console.error("Error al cargar comunidades:", error));
    }

    // Cargar la tabla de progreso
    function cargarTabla(comunidad = "") {
        fetch("../Ajax/progresoController.php?action=getProgreso&aldea=" + encodeURIComponent(comunidad))
            .then(response => {
                if (!response.ok) {
                    throw new Error("Error en la respuesta de la red");
                }
                return response.text();
            })
            .then(text => {
                try {
                    const data = JSON.parse(text);
                    tablaProgreso.innerHTML = "";
                    data.forEach(row => {
                        tablaProgreso.innerHTML += `
                            <tr>
                                <td>${row.aldea}</td>
                                <td>${row.total_niños_con_cartas}</td>
                                <td>
                                    <button class="btn btn-primary btn-sm" onclick="verDetalles('${row.aldea}')">Ver Detalles</button>
                                    <button class="btn btn-success btn-sm" onclick="descargarPDF('${row.aldea}')">Descargar PDF</button>
                                </td>
                            </tr>`;
                    });

                    // Inicializar DataTable después de cargar los datos
                    $('#tablaProgreso').DataTable({
                        "responsive": true,
                        "language": {
                            "search": "Buscar:",
                            "lengthMenu": "Mostrar _MENU_ registros",
                            "zeroRecords": "No se encontraron resultados",
                            "info": "Mostrando _PAGE_ de _PAGES_",
                            "infoEmpty": "No hay registros disponibles",
                            "infoFiltered": "(filtrado de _MAX_ registros)"
                        }
                    });
                } catch (error) {
                    console.error("Error al parsear JSON:", error);
                }
            })
            .catch(error => console.error("Error al cargar la tabla de progreso:", error));
    }

    // Mostrar detalles de una comunidad
    window.verDetalles = function (aldea) {
        fetch(`../Ajax/progresoController.php?action=getProgreso&aldea=${encodeURIComponent(aldea)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Error al obtener los detalles");
                }
                return response.json();
            })
            .then(data => {
                // Crear el contenido para el modal
                modalBody.innerHTML = `
    <h5>Detalles de la Aldea: ${aldea}</h5>
    <div class="table-responsive">
        <table id="tablaDetalleAldea" class="table table-striped">
            <thead>
                <tr>
                    <th>Numero Niño</th>
                    <th>Nombre Niño</th>
                    <th>Comunidad</th>
                    <th>Código MCS</th>
                    <th>Observaciones</th>
                    <th>Punto Focal</th>
                    <th>Tipo Carta</th>
                    <th>Fecha MCS</th>
                    <th>Fecha Vencimiento</th>
                    <th>Fecha Recepcion</th>
                    <th>Fecha Envío</th>
                    <th>Días Transcurridos</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(row => `
                    <tr>
                        <td>${row.numero_nino}</td>
                        <td>${row.nombre_completo}</td>
                        <td>${row.comunidad}</td>
                        <td>${row.codigo_mcs}</td>
                        <td>${row.observaciones}</td>
                        <td>${row.punto_focal}</td>
                        <td>${row.tipo_carta_nombre}</td>
                        <td>${row.fecha_mcs}</td>
                        <td>${row.fecha_vencimiento}</td>
                        <td>${row.fecha_recepcion}</td>
                        <td>${row.fecha_envio}</td>
                        <td>${row.dias_transcurridos}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>`;

                // Inicializar DataTable
                $(document).ready(function() {
                    $('#tablaDetalleAldea').DataTable({
                        "paging": true,
                        "searching": true,
                        "ordering": true,
                        "info": true,
                        "language": {
                            "url": "https://cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json" // Español
                        }
                    });
                });

                // Mostrar el modal de detalles
                const modal = new bootstrap.Modal(modalDetalles);
                modal.show();
            })
            .catch(error => console.error("Error al cargar detalles:", error));
    };

    // Función para generar y descargar el PDF con una tabla bonita
    window.descargarPDF = function (aldea) {
        fetch(`../Ajax/progresoController.php?action=getProgreso&aldea=${encodeURIComponent(aldea)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Error al obtener los datos para el PDF");
                }
                return response.json();
            })
            .then(data => {
                const { jsPDF } = window.jspdf; // Usando jsPDF
                const doc = new jsPDF({ orientation: "landscape" }); // Hoja en horizontal

                const margin = 20;
                const pageWidth = doc.internal.pageSize.getWidth();
                const contentWidth = pageWidth - 2 * margin;

                // Función para agregar encabezado
                const agregarEncabezado = () => {
                    doc.setFontSize(16);
                    doc.setFont("Helvetica", "bold");
                    doc.text(`Reporte de Progreso`, margin, 30);

                    doc.setFontSize(12);
                    doc.setFont("Helvetica", "normal");
                    doc.text(`Aldea: ${aldea}`, margin, 40);

                    doc.setFontSize(10);
                    doc.text(`Generado el: ${new Date().toLocaleDateString()}`, margin, 50);

                    doc.setLineWidth(0.5);
                    doc.line(margin, 55, pageWidth - margin, 55); // Línea divisoria
                };

                // Función para agregar pie de página
                const agregarPieDePagina = () => {
                    const pageCount = doc.internal.getNumberOfPages();
                    for (let i = 1; i <= pageCount; i++) {
                        doc.setPage(i);
                        doc.setFontSize(8);
                        doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 10);
                    }
                };

                // Función para generar la tabla
                const generarTabla = () => {
                    const columns = [
                        { header: 'N. Niño', dataKey: 'numero_nino' },
                        { header: 'Nombre Niño', dataKey: 'nombre_completo' },
                        { header: 'Comunidad', dataKey: 'comunidad' },
                        { header: 'Código MCS', dataKey: 'codigo_mcs' },
                        { header: 'Fecha MCS', dataKey: 'fecha_mcs' },
                        { header: 'Fecha Envío', dataKey: 'fecha_envio' },
                        { header: 'Punto Focal', dataKey: 'punto_focal' },
                        { header: 'Tipo Carta', dataKey: 'tipo_carta_nombre' },
                        { header: 'Fecha Venc.', dataKey: 'fecha_vencimiento' },
                        { header: 'Fecha Rec.', dataKey: 'fecha_recepcion' },
                        { header: 'Obs.', dataKey: 'observaciones' },
                        { header: 'Días Transc.', dataKey: 'dias_transcurridos' }
                    ];

                    const rows = data.map(row => ({
                        numero_nino: row.numero_nino,
                        nombre_completo: row.nombre_completo,
                        comunidad: row.comunidad,
                        codigo_mcs: row.codigo_mcs,
                        fecha_mcs: row.fecha_mcs,
                        fecha_envio: row.fecha_envio,
                        punto_focal: row.punto_focal,
                        tipo_carta_nombre: row.tipo_carta_nombre,
                        fecha_vencimiento: row.fecha_vencimiento,
                        fecha_recepcion: row.fecha_recepcion,
                        observaciones: row.observaciones,
                        dias_transcurridos: row.dias_transcurridos
                    }));

                    doc.autoTable({
                        startY: 60, // Comienza debajo del encabezado
                        head: [columns.map(col => col.header)],
                        body: rows.map(row => columns.map(col => row[col.dataKey])),
                        theme: 'grid',
                        headStyles: {
                            fillColor: [0, 102, 204],
                            textColor: [255, 255, 255],
                            fontSize: 8,
                            cellPadding: 2,
                            halign: 'center'
                        },
                        styles: {
                            fontSize: 8,
                            cellPadding: 2
                        },
                        bodyStyles: {
                            textColor: [0, 0, 0]
                        },
                        alternateRowStyles: {
                            fillColor: [240, 240, 240]
                        },
                        margin: { top: 60, left: margin, right: margin },
                        tableWidth: contentWidth
                    });
                };

                // Construir el PDF
                agregarEncabezado();
                generarTabla();
                agregarPieDePagina();

                // Descargar el PDF
                doc.save(`reporte_progreso_${aldea}.pdf`);
            })
            .catch(error => console.error("Error al generar el PDF:", error));
    };

    // Inicializar la página
    cargarComunidades();
    cargarTabla();
});