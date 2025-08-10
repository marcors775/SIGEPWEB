// Función para cargar los semestres disponibles
function cargarSemestres() {
    fetch('../Ajax/informesSemestralA.php?op=obtenerSemestres')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }
            return response.json();
        })
        .then(data => {
            const tbody = document.querySelector("#tablaSemestres tbody");
            tbody.innerHTML = ""; // Limpiar la tabla

            if (data.error) {
                tbody.innerHTML = `<tr><td colspan="3">${data.error}</td></tr>`;
                return;
            }

            if (data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="3">No hay semestres disponibles.</td></tr>`;
                return;
            }

            data.forEach((semestreObj, index) => {
                const semestre = semestreObj.semestre_disponible;

                // Validar el formato del semestre
                if (!semestre || typeof semestre !== 'string' || !/^\d{4}-(1|2)$/.test(semestre.trim())) {
                    console.warn(`Semestre inválido:`, semestreObj);
                    return;
                }

                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${semestre.trim()}</td>
                    <td>
                        <button class="btn btn-primary" onclick="verDetalles('${semestre.trim()}')">Ver Detalles</button>
                        <button class="btn btn-success" onclick="exportarPDF('${semestre.trim()}')">Exportar a PDF</button>
                        <button class="btn btn-info" onclick="verEstadisticas('${semestre}')">Ver Estadísticas</button>
                    
                    </td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(error => {
            console.error("Error al cargar los semestres:", error);
            const tbody = document.querySelector("#tablaSemestres tbody");
            tbody.innerHTML = `<tr><td colspan="3">Error al cargar los semestres.</td></tr>`;
        });
}

// Función para ver los detalles del semestre
function verDetalles(semestre) {
    if (!/^\d{4}-(1|2)$/.test(semestre)) {
        console.error("Formato inválido para el semestre:", semestre);
        alert("Formato de semestre inválido. Por favor, selecciona un semestre válido.");
        return;
    }

    // Mostrar el modal
    const modal = new bootstrap.Modal(document.getElementById('modalDetalles'));
    modal.show();

    // Limpiar cualquier contenido previo en el modal
    const modalBody = document.querySelector("#modalDetalles .modal-body");
    modalBody.innerHTML = '';  // Limpiar el contenido anterior

    // Ahora pasamos el semestre al backend
    fetch(`../Ajax/informesSemestralA.php?op=obtenerInformeSemestral&semestre=${encodeURIComponent(semestre)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }
            return response.json();
        })
        .then(data => {
            // Verificar si hay un error en la respuesta
            if (data.error) {
                modalBody.innerHTML = `<p><strong>Error:</strong> ${data.error}</p>`;  // Mostrar el error en el modal
                return;
            }

            // Verificar si data es un arreglo
            if (!Array.isArray(data)) {
                modalBody.innerHTML = `<p><strong>Error:</strong> Datos no válidos recibidos.</p>`;
                return;
            }

            // Si es un arreglo, construir la tabla con los datos obtenidos
            const table = document.createElement("table");
            table.classList.add("table", "table-bordered");

            const headers = `
                <th>Total Cartas por Enviar</th>
                <th>Cartas Recibidas en el Semestre</th>
                <th>Cartas Enviadas en el Semestre</th>
                <th>Cartas Enviadas con Retraso</th>
                <th>Porcentaje de Retraso</th>
                <th>Promedio de Cumplimiento</th>
                <th>Por Enviar a la Fecha</th>
                <th>Por Enviar Fuera de Tiempo</th>
                <th>Total Promotores/Gestores</th>
            `;

// Crear las filas con los datos de cada semestre
            const rows = data.map(row => `
                <tr>
                    <td>${row.tipo_carta_nombre}</td>
                    <td>${row.total_cartas_por_enviar || 0}</td>
                    <td>${row.cartas_recibidas_semestre || 0}</td>
                    <td>${row.enviadas_semestre_actual || 0}</td>
                    <td>${row.enviadas_con_retraso || 0}</td>
                    <td>${row.porcentaje_retraso || 0}%</td>
                    <td>${row.promedio_cumplimiento_dias_envio || 0}%</td>
                    <td>${row.por_enviar_a_fecha || 0}</td>
                    <td>${row.por_enviar_fuera_tiempo || 0}</td>
                    <td>${row.total_promotores_gestores || 0}</td>
                </tr>
            `).join('');

            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Tipo Cartas</th>${headers}
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            `;

            modalBody.appendChild(table);  // Agregar la nueva tabla al modal
        })
        .catch(error => {
            console.error("Error al cargar los detalles:", error);
            modalBody.innerHTML = `<p>Error al cargar los detalles del semestre. ${error.message}</p>`;
        });
}

// Función para exportar la tabla a PDF
function exportarPDF(semestre) {
    const { jsPDF } = window.jspdf;
    
    // Crear el documento PDF con orientación vertical (default 'p')
    const doc = new jsPDF('l', 'mm', 'a4');

    // Asegurarse de que el modal y la tabla existen antes de intentar acceder a ellos
    const modalBody = document.querySelector("#modalDetalles .modal-body");
    if (!modalBody) {
        alert("El contenido del modal no está disponible.");
        return;
    }

    if (!modalBody.innerHTML) {
        alert("No hay datos para exportar.");
        return;
    }

    const table = modalBody.querySelector("table");
    if (!table) {
        alert("No se encontró la tabla para exportar.");
        return;
    }

    // Agregar el semestre al inicio del documento PDF
    doc.setFontSize(16);
    doc.text(`Informe Semestral: ${semestre}`, 14, 20);  // Coloca el semestre en la parte superior

    // Agregar un salto de línea antes de la tabla
    doc.text("", 14, 30);

    // Obtener los encabezados y las filas de la tabla
    const headers = Array.from(table.querySelectorAll("thead th")).map(th => th.textContent.trim());
    const rows = Array.from(table.querySelectorAll("tbody tr")).map(tr => {
        return Array.from(tr.querySelectorAll("td")).map(td => td.textContent.trim());
    });

    // Agregar la tabla al PDF
    doc.autoTable({
        head: [headers],
        body: rows,
        theme: 'grid',
        startY: 25,  // Empieza la tabla justo después del encabezado
    });
    
    // Guardar el documento como un archivo PDF
    doc.save(`informe_semestre_${semestre}.pdf`);
}

// Función para mostrar estadísticas con diagrama de barras
function verEstadisticas(semestre) {
    fetch(`../Ajax/informesSemestralA.php?op=obtenerInformeSemestral&semestre=${semestre}`)
        .then(response => response.json())
        .then(data => {
            const ctx = document.getElementById("graficoBarras").getContext("2d");

            // Verificar si ya existe un gráfico y destruirlo
            if (window.chartInstance) {
                window.chartInstance.destroy();
            }

            // Crear un nuevo gráfico
            window.chartInstance = new Chart(ctx, {
                type: "bar",
                data: {
                    labels: data.map(row => row.tipo_carta_nombre),
                    datasets: [
                        {
                            label: "Cartas Enviadas",
                            data: data.map(row => row.total_cartas_por_enviar || 0),
                            backgroundColor: "blue"
                        },
                        {
                            label: "Cartas Recibidas",
                            data: data.map(row => row.cartas_recibidas_semestre || 0),
                            backgroundColor: "green"
                        },
                        {
                            label: "Cartas con Retraso",
                            data: data.map(row => row.enviadas_con_retraso || 0),
                            backgroundColor: "red"
                        },
                        {
                            label: "Total Promotores/Gestores",
                            data: data.map(row => row.total_promotores_gestores || 0),
                            backgroundColor: "purple"
                        },
                        {
                            label: "Promedio de Cumplimiento",
                            data: data.map(row => row.promedio_cumplimiento_dias_envio || 0),
                            backgroundColor: "orange"
                        }
                    ]
                },
                options: { responsive: true }
            });

            // Mostrar el modal de estadísticas
            new bootstrap.Modal(document.getElementById('modalEstadisticas')).show();
        })
        .catch(error => {
            console.error('Error al obtener las estadísticas:', error);
        });
}


// Cargar los semestres al iniciar la página
document.addEventListener("DOMContentLoaded", cargarSemestres);
