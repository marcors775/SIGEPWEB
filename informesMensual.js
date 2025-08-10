// Función para convertir el nombre completo del mes y año al número de mes y año
function convertirMesANumero(mesCompleto) {
    const mesesMap = {
        "enero": "01",
        "febrero": "02",
        "marzo": "03",
        "abril": "04",
        "mayo": "05",
        "junio": "06",
        "julio": "07",
        "agosto": "08",
        "septiembre": "09",
        "octubre": "10",
        "noviembre": "11",
        "diciembre": "12"
    };

    if (!mesCompleto || typeof mesCompleto !== "string") {
        console.error("Formato de mes inválido:", mesCompleto);
        return null;
    }

    // Normalizar el texto: eliminar espacios extras y convertir a minúsculas
    mesCompleto = mesCompleto.trim().toLowerCase();
    const partes = mesCompleto.split(" "); // Divide en ["mes", "año"]

    if (partes.length !== 2) {
        console.error("Formato inesperado del mes:", mesCompleto);
        return null;
    }

    const mesNombre = partes[0];
    const anio = partes[1];

    // Validar que el mes existe en el mapa y que el año es numérico
    const mesNumero = mesesMap[mesNombre];
    if (!mesNumero || isNaN(anio) || anio <= 0) {
        console.error("Mes o año inválido:", mesCompleto);
        return null;
    }

    return {
        mesNumero: mesNumero,
        anio: anio
    };
}

// Función para ver detalles del informe
function verDetalles(mesCompleto) {
    const conversion = convertirMesANumero(mesCompleto);

    if (!conversion) {
        console.error("Mes inválido:", mesCompleto);
        alert("No se reconoce el mes seleccionado.");
        return;
    }

    const { mesNumero, anio } = conversion;
    const mesFormato = `${anio}-${mesNumero}`; // Formato esperado: YYYY-MM

    fetch(`../Ajax/informesMensualesA.php?op=obtenerInformeMensual&mes=${mesFormato}`)
        .then(response => response.json())
        .then(data => {
            const modalBody = document.querySelector("#modalDetalles .modal-body");
            modalBody.innerHTML = ""; // Limpiar el contenido del modal

            if (!Array.isArray(data)) {
                modalBody.innerHTML = `<p>${data.error || "Datos inválidos recibidos."}</p>`;
                return;
            }

            // Construir la tabla con los datos obtenidos
            const table = document.createElement("table");
            table.classList.add("table", "table-bordered");
            const headers = `
                <th>Total Cartas por Enviar</th>
                <th>Cartas Recibidas en el Mes</th>
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
                    <td>${row.enviadas_mes_actual || 0}</td>
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
            modalBody.appendChild(table);

            const modal = new bootstrap.Modal(document.getElementById('modalDetalles'));
            modal.show();
        })
        .catch(error => {
            console.error("Error al cargar los detalles:", error);
            alert("Hubo un problema al cargar los detalles del informe.");
        });
}

// Función para descargar el PDF
function descargarPDF(mesCompleto) {
    const conversion = convertirMesANumero(mesCompleto);

    if (!conversion) {
        console.error("Mes inválido:", mesCompleto);
        alert("No se reconoce el mes seleccionado.");
        return;
    }

    const { mesNumero, anio } = conversion;
    const mesFormato = `${anio}-${mesNumero}`;

    fetch(`../Ajax/informesMensualesA.php?op=obtenerInformeMensual&mes=${mesFormato}`)
        .then(response => response.json())
        .then(data => {
            if (!Array.isArray(data) || data.length === 0) {
                console.error("Datos inválidos recibidos.");
                alert("No se pueden generar los detalles del PDF.");
                return;
            }

            // Crear un nuevo documento PDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('l', 'mm', 'a4');

            doc.setFontSize(14);
            doc.text(`Informe Mensual: ${mesCompleto}`, 10, 10);

            // Definir las cabeceras de la tabla
            const headers = [
                "Tipo Carta",
                "Total Cartas por Enviar",
                "Cartas Recibidas en el Mes",
                "Cartas Enviadas con Retraso",
                "Porcentaje de Retraso",
                "Promedio de Cumplimiento",
                "Por Enviar a la Fecha",
                "Por Enviar Fuera de Tiempo",
                "Total Promotores/Gestores"
            ];

            // Crear las filas con los datos
            const rows = data.map(row => [
                row.tipo_carta_nombre,
                row.total_cartas_por_enviar || 0,
                row.enviadas_mes_actual || 0,
                row.enviadas_con_retraso || 0,
                `${row.porcentaje_retraso || 0}%`,
                `${row.promedio_cumplimiento_dias_envio || 0}%`,
                row.por_enviar_a_fecha || 0,
                row.por_enviar_fuera_tiempo || 0,
                row.total_promotores_gestores || 0
            ]);

            // Agregar la tabla al PDF
            doc.autoTable({
                head: [headers],
                body: rows,
                startY: 20,
                theme: 'striped'
            });

            // Descargar el PDF
            doc.save(`Informe_Mensual_${mesFormato}.pdf`);
        })
        .catch(error => {
            console.error("Error al cargar los detalles para el PDF:", error);
            alert("Hubo un problema al generar el PDF.");
        });
}


// Cargar los meses disponibles al iniciar la página
function cargarMeses() {
    fetch('../Ajax/informesMensualesA.php?op=obtenerMeses')
        .then(response => response.json())
        .then(data => {
            const tbody = document.querySelector("#tablaMeses tbody");
            tbody.innerHTML = ""; // Limpiar la tabla

            if (!Array.isArray(data) || data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="3">${data.error || "No hay meses disponibles."}</td></tr>`;
                return;
            }

            data.forEach((mes, index) => {
                const mesNormalizado = mes.mes_nombre.trim(); // Asegurarse de eliminar espacios extras
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${mesNormalizado}</td>
                    <td>
                        <button class="btn btn-primary" onclick="verDetalles('${mesNormalizado}')">Ver Detalles</button>
                        <button class="btn btn-success" onclick="descargarPDF('${mesNormalizado}')">Descargar PDF</button>
                        <button class="btn btn-info" onclick="verEstadisticas('${mesNormalizado}')">Ver Estadísticas</button>
                    </td>
                    `;
                tbody.appendChild(tr);
            });
        })
        .catch(error => {
            console.error("Error al cargar los meses:", error);
            alert("Hubo un problema al cargar los meses.");
        });
}
function verEstadisticas(mesNormalizado) {
    // Convertir el mes a un formato de semestre
    const conversion = convertirMesANumero(mesNormalizado);
    if (!conversion) {
        console.error("Mes inválido:", mesNormalizado);
        alert("No se reconoce el mes seleccionado.");
        return;
    }

    const { mesNumero, anio } = conversion;

    // Determinar el semestre basado en el mes
    let semestre;
    if (mesNumero >= 1 && mesNumero <= 6) {
        semestre = `${anio}-1`; // Semestre 1 (enero - junio), sin el cero
    } else if (mesNumero >= 7 && mesNumero <= 12) {
        semestre = `${anio}-2`; // Semestre 2 (julio - diciembre), sin el cero
    } else {
        console.error("Mes inválido para semestre:", mesNormalizado);
        alert("Mes fuera de rango para semestre.");
        return;
    }

    // Llamar a la API con el semestre corregido
    fetch(`../Ajax/informesSemestralA.php?op=obtenerInformeSemestral&semestre=${semestre}`)
        .then(response => response.json()) // Convertir la respuesta a JSON
        .then(data => {
            // Verificar si la respuesta es un array
            if (!Array.isArray(data)) {
                console.error("Datos inválidos recibidos para las estadísticas:", data);
                alert("No se pueden mostrar las estadísticas. Datos inválidos.");
                return;
            }

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
                            label: "Cartas Por Enviar",
                            data: data.map(row => row.total_cartas_por_enviar || 0),
                            backgroundColor: "blue"
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
            alert("Hubo un error al obtener las estadísticas.");
        });
}


// Llamar a la función para cargar los meses al cargar la página
window.onload = cargarMeses;
