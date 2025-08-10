<?php
require_once "../Modelo/TiempoModel.php";

class ControladorTiempo {
    // Manejar las solicitudes
    public static function manejarSolicitud($accion, $params = []) {
        switch ($accion) {
            case "obtener":
                $tiempos = ModeloTiempo::obtenerTiempos();
                echo json_encode($tiempos);
                break;

            case "actualizar":
                if (isset($params['id'], $params['tiempo_maximo'])) {
                    $id = $params['id'];
                    $tiempo_maximo = $params['tiempo_maximo'];
                    ModeloTiempo::actualizarTiempo($id, $tiempo_maximo);
                    echo json_encode(["status" => "success", "message" => "Tiempo actualizado correctamente"]);
                } else {
                    echo json_encode(["status" => "error", "message" => "Parámetros inválidos"]);
                }
                break;

            case "obtenerTipos":
                $tipos = ModeloTiempo::obtenerTiposCarta();
                echo json_encode($tipos);
                break;
                
            case "agregarTipo":
                if (isset($params['nombre_tipo_carta'], $params['tiempo_inicial'])) {
                    $nombre = $params['nombre_tipo_carta'];
                    $tiempo = $params['tiempo_inicial'];
                    $resultado = ModeloTiempo::agregarTipoCarta($nombre, $tiempo);
                    if ($resultado) {
                        echo json_encode(["status" => "success", "message" => "Tipo de correspondencia creado correctamente"]);
                    } else {
                        echo json_encode(["status" => "error", "message" => "Error al crear el tipo de correspondencia"]);
                    }
                } else {
                    echo json_encode(["status" => "error", "message" => "Parámetros inválidos"]);
                }
                break;

            default:
                echo json_encode(["status" => "error", "message" => "Acción no válida"]);
                break;
        }
    }
}

// Manejar las solicitudes AJAX
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['accion'])) {
    $accion = $_POST['accion'];
    $params = $_POST;
    unset($params['accion']); // Eliminar la acción de los parámetros para evitar conflicto
    ControladorTiempo::manejarSolicitud($accion, $params);
} else {
    echo json_encode(["status" => "error", "message" => "Método no válido o acción no especificada"]);
}
?>