<?php
require_once "../Modelo/actualizarNino.php";
require_once "../Ajax/sesion_ajax.php"; // Asegura sesión activa y conexión

$nino = new Nino();
$opcion = $_POST['opcion'] ?? '';

switch ($opcion) {
    case 'listarAldeas':
        echo json_encode($nino->listarAldeas());
        break;

    case 'listarNinosPorAldea':
        $aldea = $_POST['aldea'] ?? '';
        echo json_encode($nino->listarNinosPorAldea($aldea));
        break;

    case 'obtenerNino':
        $numero_nino = $_POST['numero_nino'] ?? 0;
        echo json_encode($nino->obtenerNino($numero_nino));
        break;

    case 'actualizarNino':

        // 🔁 Traducir 'aldea' textual a 'village_id'
        $village_id = null;
        if (!empty($_POST['aldea'])) {
            if ($conn) { // $conn debe estar disponible desde sesion_ajax.php
                $stmt = $conn->prepare("SELECT id FROM village WHERE nombre = ?");
                $stmt->bind_param("s", $_POST['aldea']);
                $stmt->execute();
                $stmt->bind_result($village_id);
                $stmt->fetch();
                $stmt->close();
            }
        }

        // 📦 Armar array de datos a enviar al modelo
        $datos = [
            'numero_nino' => $_POST['numero_nino'],
            'nombre_completo' => $_POST['nombre_completo'],
            'village_id' => $village_id,
            'fecha_nacimiento' => $_POST['fecha_nacimiento'],
            'comunidad' => $_POST['comunidad'],
            'genero' => $_POST['genero'],
            'estado_patrocinio' => $_POST['estado_patrocinio'],
            'fecha_inscripcion' => $_POST['fecha_inscripcion'],
            'socio_local' => $_POST['socio_local'],
            'nombre_alianza' => $_POST['nombre_alianza'],
            'nombre_contacto_principal' => $_POST['nombre_contacto_principal']
        ];

        $resultado = $nino->actualizarNino($datos);

        echo json_encode([
            'status' => $resultado === true ? 'success' : 'error',
            'message' => $resultado === true ? 'Datos actualizados correctamente' : $resultado
        ]);
        break;

    default:
        echo json_encode(['status' => 'error', 'message' => 'Opción no válida']);
        break;
}
?>