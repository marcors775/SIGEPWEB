document.addEventListener('DOMContentLoaded', function() {
    // Hacer una llamada AJAX para obtener los datos de los niños para modificar
    fetch('../Ajax/obtenerNinos.php')
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('tablaBody');
            data.forEach(nino => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><input type="text" name="numero_nino[]" value="${nino.numero_nino}" readonly class="form-control"></td>
                    <td><input type="text" name="nombre_completo[]" value="${nino.nombre_completo}" class="form-control"></td>
                    <td><input type="text" name="aldea[]" value="${nino.aldea}" class="form-control"></td>
                    <td><input type="date" name="fecha_nacimiento[]" value="${nino.fecha_nacimiento}" class="form-control"></td>
                    <td><input type="text" name="comunidad[]" value="${nino.comunidad}" class="form-control"></td>
                    <td><input type="text" name="genero[]" value="${nino.genero}" class="form-control"></td>
                    <td><input type="text" name="estado_patrocinio[]" value="${nino.estado_patrocinio}" class="form-control"></td>
                    <td><input type="date" name="fecha_inscripcion[]" value="${nino.fecha_inscripcion}" class="form-control"></td>
                    <td>
                        <button type="submit" name="modificar" class="btn btn-primary btn-sm">Modificar</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        })
        .catch(error => console.error('Error al cargar los datos:', error));
});
