// Función para ver detalles del informe anual
async function verDetallesAnualesT(anio) {
    if (!anio || isNaN(anio)) {
        console.error("Año inválido:", anio);
        alert("No se reconoce el año seleccionado.");
        return;
    }

    try {
        const response = await fetch(`../Ajax/informesAnualesA.php?op=obtenerInformeAnualT&anio=${anio}`);
        if (!response.ok) throw new Error(`Error en la respuesta del servidor: ${response.statusText}`);

        const data = await response.json();
        const modalBody = document.querySelector("#modalDetalles .modal-body");
        modalBody.innerHTML = ""; // Limpiar contenido previo

        if (!Array.isArray(data) || data.length === 0) {
            modalBody.innerHTML = `<p>No hay datos disponibles para el año seleccionado.</p>`;
            return;
        }

        // Crear la tabla con los datos obtenidos
        const table = document.createElement("table");
        table.classList.add("table", "table-bordered", "table-striped", "table-hover");

        table.innerHTML = `
            <thead>
                <tr>
                    <th>Tipo de Carta</th>
                    <th>Total por Enviar</th>
                    <th>Enviadas en el Año</th>
                    <th>Enviadas con Retraso</th>
                    <th>% de Retraso</th>
                    <th>Promedio de Cumplimiento (días)</th>
                    <th>Por Enviar a la Fecha</th>
                    <th>Por Enviar Fuera de Tiempo</th>
                    <th>Total de Promotores/Gestores</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(row => `
                    <tr>
                        <td>${row.tipo_carta_nombre}</td>
                        <td>${row.total_cartas_por_enviar || 0}</td>
                        <td>${row.enviadas_anio_actual || 0}</td>
                        <td>${row.enviadas_con_retraso || 0}</td>
                        <td>${row.porcentaje_retraso || 0}%</td>
                        <td>${row.promedio_cumplimiento_dias_envio || 0}</td>
                        <td>${row.por_enviar_a_fecha || 0}</td>
                        <td>${row.por_enviar_fuera_tiempo || 0}</td>
                        <td>${row.total_promotores_gestores || 0}</td>
                    </tr>
                `).join('')}
            </tbody>
        `;

        modalBody.appendChild(table);

        // Mostrar el modal
        new bootstrap.Modal(document.getElementById('modalDetalles')).show();
    } catch (error) {
        console.error("Error al cargar los detalles:", error);
        alert("Hubo un problema al cargar los detalles del informe.");
    }
}

// Función para cargar los años disponibles
async function cargarAnios() {
    try {
        const response = await fetch('../Ajax/informesAnualesA.php?op=obtenerAnios');
        if (!response.ok) throw new Error(`Error en la respuesta del servidor: ${response.statusText}`);

        const data = await response.json();
        const tbody = document.querySelector("#tablaAnios tbody");
        tbody.innerHTML = ""; // Limpiar la tabla

        if (!Array.isArray(data) || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3">No hay años disponibles.</td></tr>`;
            return;
        }

        data.forEach((item, index) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.anio}</td>
                <td>
                    <button class="btn btn-primary" onclick="verDetallesAnualesT(${item.anio})">Ver Detalles</button>
                    <button class="btn btn-success" onclick="descargarPDF(${item.anio})">Descargar PDF</button>
                    <button class="btn btn-info" onclick="verEstadisticas(${item.anio})">Ver Estadísticas</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Error al cargar los años:", error);
        document.querySelector("#tablaAnios tbody").innerHTML = `<tr><td colspan="3">Error al cargar los años.</td></tr>`;
    }
}

// Función para descargar el PDF
function descargarPDF(anio) {
    fetch(`../Ajax/informesAnualesA.php?op=obtenerInformeAnualT&anio=${anio}`)
        .then(response => response.json())
        .then(data => {
            if (!Array.isArray(data) || data.length === 0) {
                console.error("Datos inválidos recibidos.");
                alert("No se pueden generar los detalles del PDF.");
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('l', 'mm', 'a4');

            doc.setFontSize(14);
            doc.text(`Informe Anual: ${anio}`, 10, 10);

            const headers = [
                "Tipo Carta",
                "Total Cartas por Enviar",
                "Cartas Recibidas en el Año",
                "Cartas Enviadas con Retraso",
                "Porcentaje de Retraso",
                "Promedio de Cumplimiento",
                "Por Enviar a la Fecha",
                "Por Enviar Fuera de Tiempo",
                "Total Promotores/Gestores"
            ];

            const rows = data.map(row => [
                row.tipo_carta_nombre,
                row.total_cartas_por_enviar || 0,
                row.enviadas_anio_actual || 0,
                row.enviadas_con_retraso || 0,
                `${row.porcentaje_retraso || 0}%`,
                row.promedio_cumplimiento_dias_envio || 0,
                row.por_enviar_a_fecha || 0,
                row.por_enviar_fuera_tiempo || 0,
                row.total_promotores_gestores || 0
            ]);

            doc.autoTable({ head: [headers], body: rows, startY: 20, theme: 'striped' });
            doc.save(`Informe_Anual_${anio}.pdf`);
        })
        .catch(error => {
            console.error("Error al cargar los detalles para el PDF:", error);
            alert("Hubo un problema al generar el PDF.");
        });
}

// Función para ver estadísticas
function verEstadisticas(anio) {
    fetch(`../Ajax/informesAnualesA.php?op=obtenerInformeAnualT&anio=${anio}`)
        .then(response => response.json())
        .then(data => {
            if (!Array.isArray(data) || data.length === 0) {
                console.error("Datos inválidos para estadísticas.");
                alert("No hay datos disponibles para mostrar estadísticas.");
                return;
            }

            const ctx = document.getElementById("graficoBarras").getContext("2d");

            // Verificar si ya existe un gráfico y destruirlo
            if (window.chartInstance) window.chartInstance.destroy();

            window.chartInstance = new Chart(ctx, {
                type: "bar",
                data: {
                    labels: data.map(row => row.tipo_carta_nombre),
                    datasets: [
                        { label: "Cartas Enviadas", data: data.map(row => row.total_cartas_por_enviar || 0), backgroundColor: "blue" },
                        { label: "Cartas Recibidas", data: data.map(row => row.cartas_recibidas_anio || 0), backgroundColor: "green" },
                        { label: "Cartas con Retraso", data: data.map(row => row.enviadas_con_retraso || 0), backgroundColor: "red" },
                        { label: "Total Promotores/Gestores", data: data.map(row => row.total_promotores_gestores || 0), backgroundColor: "purple" },
                        { label: "Promedio de Cumplimiento", data: data.map(row => row.promedio_cumplimiento_dias_envio || 0), backgroundColor: "orange" }
                    ]
                },
                options: { responsive: true }
            });

            new bootstrap.Modal(document.getElementById('modalEstadisticas')).show();
        })
        .catch(error => console.error('Error al obtener las estadísticas:', error));
}

// Cargar los años al iniciar la página
document.addEventListener("DOMContentLoaded", cargarAnios);
