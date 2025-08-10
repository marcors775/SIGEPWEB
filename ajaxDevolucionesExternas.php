<?php
require_once "../Config/sesion_ajax.php";
require_once "../Modelo/ModeloDevolucionesExternas.php";

$modelo = new ModeloDevolucionesExternas();
$accion = $_POST['accion'] ?? ($_GET['accion'] ?? '');
$usuario = $_SESSION['usu'] ?? null;

function logDevolucionesExternas($accion, $detalle = "")
{
    $logFile = __DIR__ . "/../Logs/devolucionesExternas.log";
    $fechaHora = date("Y-m-d H:i:s");
    $usuario = $_SESSION['usu'] ?? 'sin_sesion';
    @file_put_contents($logFile, "[{$fechaHora}] [Usuario: {$usuario}] [Acción: {$accion}] {$detalle}\n", FILE_APPEND);
}

try {
    switch ($accion) {
        case "buscarCartas":
            $codigo = $_POST['codigo_mcs'] ?: null;
            $child = $_POST['child_number'] ?: null;
            $data = $modelo->buscarCartasEnviadas($codigo, $child);
            logDevolucionesExternas("Buscar Cartas", "Total: " . count($data));
            echo json_encode($data, JSON_UNESCAPED_UNICODE);
            break;

        case "registrarDevolucion":
            $resultado = $modelo->registrarDevolucionExterna(
                $_POST['codigo_mcs'],
                $_POST['hoja_ruta_id'] ?: null,
                $_POST['motivo_id'],
                $_POST['detalle'] ?? '',
                $usuario,
                $_POST['fecha_devolucion'] ?? date("Y-m-d")
            );
            logDevolucionesExternas("Registrar Devolución", json_encode($resultado));
            echo json_encode($resultado, JSON_UNESCAPED_UNICODE);
            break;

        case "listarHistorial":
            $data = $modelo->listarHistorialDevoluciones(
                $_POST['fecha_inicio'] ?: null,
                $_POST['fecha_fin'] ?: null,
                $_POST['numero_hr'] ?: null,
                $_POST['motivo_id'] ?: null
            );
            logDevolucionesExternas("Listar Historial", "Total: " . count($data));
            echo json_encode($data, JSON_UNESCAPED_UNICODE);
            break;

        case "obtenerMotivos":
            $data = $modelo->obtenerMotivosDevolucion();
            logDevolucionesExternas("Obtener Motivos", "Total: " . count($data));
            echo json_encode($data, JSON_UNESCAPED_UNICODE);
            break;

        case "eliminarDevolucion":
            $id = $_POST['id'] ?? 0;
            $resultado = $modelo->eliminarDevolucionExterna($id);
            logDevolucionesExternas("Eliminar Devolución", json_encode($resultado));
            echo json_encode($resultado, JSON_UNESCAPED_UNICODE);
            break;

        case "registrarReenvio":
            $id = $_POST['id'] ?? 0;
            $fecha = $_POST['fecha_reenvio'] ?? date("Y-m-d");
            $medio = $_POST['medio_reenvio'] ?? 'Otro';
            $resultado = $modelo->registrarReenvioDevolucion($id, $fecha, $medio);
            logDevolucionesExternas("Registrar Reenvío", json_encode($resultado));
            echo json_encode($resultado, JSON_UNESCAPED_UNICODE);
            break;

        default:
            logDevolucionesExternas("Acción no válida", "Acción recibida: {$accion}");
            echo json_encode(["error" => "Acción no válida"], JSON_UNESCAPED_UNICODE);
            break;
    }
} catch (Throwable $e) {
    $mensaje = "Error: " . $e->getMessage() . " en " . $e->getFile() . " línea " . $e->getLine();
    logDevolucionesExternas("Error General", $mensaje);
    echo json_encode(["error" => $mensaje], JSON_UNESCAPED_UNICODE);
}
