<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once "../Modelo/ModeloGestionCorrespondencia.php";

ob_start();
register_shutdown_function(function () {
    $out = ob_get_contents();
    if (!empty($out)) {
        file_put_contents(__DIR__ . "/../Logs/salida_inesperada.log", $out);
    }
});

$gestion = new ModeloGestionCorrespondencia();
$op = $_GET["op"] ?? '';

switch ($op) {

    case 'getResumen':
        echo json_encode(["data" => $gestion->getResumen()]);
        break;

    case 'getTiposCartas':
        echo json_encode(["data" => $gestion->getTiposCartas()]);
        break;

    case 'getCartasPorTipo':
        $tipoCarta = $_POST["tipoCarta"] ?? '';
        echo json_encode(["data" => $gestion->getCartasPorTipo($tipoCarta)]);
        break;

    case 'getCartasPorPaquete':
        $tipoCarta = $_POST["tipoCarta"] ?? '';
        $fechaRecepcion = $_POST["fechaRecepcion"] ?? '';
        echo json_encode(["data" => $gestion->getCartasPorPaquete($tipoCarta, $fechaRecepcion)]);
        break;

    case 'getPaquetes':
        header('Content-Type: application/json; charset=utf-8');
        $paquetes = $gestion->getPaquetes();
        file_put_contents(__DIR__ . "/../Logs/debug_getPaquetes.log", print_r($paquetes, true), FILE_APPEND);
        echo json_encode(["data" => $paquetes]);
        break;

    case 'getCartaPorCodigo':
        $codigo = $_POST["codigo_mcs"] ?? '';
        $carta = $gestion->getCartaPorCodigo($codigo);
        echo json_encode($carta ? ["status" => true, "data" => $carta] : ["status" => false, "message" => "Carta no encontrada"]);
        break;

    case 'editarCarta':
        $datos = [
            ':codigo_mcs' => $_POST['codigo_mcs'] ?? '',
            ':fecha_mcs' => $_POST['fecha_mcs'] ?? '',
            ':fecha_vencimiento' => $_POST['fecha_vencimiento'] ?? '',
            ':fecha_recepcion' => $_POST['fecha_recepcion'] ?? '',
            ':tipo_carta' => $_POST['tipoCarta'] ?? ''
        ];
        $success = $gestion->editarCarta($datos);
        echo json_encode(["status" => $success]);
        break;

    case 'eliminarCarta':
        $codigo = $_POST["codigo_mcs"] ?? '';
        $success = $gestion->eliminarCarta($codigo);
        echo json_encode(["status" => $success]);
        break;

    case 'eliminarPaquete':
        $tipoCarta = $_POST['tipoCarta'] ?? '';
        $fechaRecepcion = $_POST['fechaRecepcion'] ?? '';
        error_log("AJAX eliminarPaquete => tipoCarta: $tipoCarta | fechaRecepcion: $fechaRecepcion");
        $success = $gestion->eliminarPaquete($tipoCarta, $fechaRecepcion);
        echo json_encode(["status" => $success]);
        break;

    case 'cargar':
        if (ob_get_length()) ob_clean();
        header('Content-Type: application/json; charset=utf-8');

        $logFile = __DIR__ . "/../Logs/debug_cargar_" . date("Y-m-d") . ".log";
        function logDebug($mensaje)
        {
            global $logFile;
            file_put_contents($logFile, "[" . date("Y-m-d H:i:s") . "] " . $mensaje . PHP_EOL, FILE_APPEND);
        }

        logDebug("====================================");
        logDebug("AJAX cargar => tipoCarta: " . ($_POST["tipoCarta"] ?? 'NULO') .
            " | fecha_recepcion: " . ($_POST["fecha_recepcion"] ?? 'NULO') .
            " | archivo: " . (isset($_FILES["archivo"]) ? $_FILES["archivo"]["name"] : 'NULO'));

        $tipoCarta = $_POST["tipoCarta"] ?? null;
        $fechaRecepcion = $_POST["fecha_recepcion"] ?? null;
        $archivo = $_FILES['archivo']['tmp_name'] ?? null;

        if (!$tipoCarta || !$fechaRecepcion || !$archivo) {
            logDebug("❌ ERROR: Datos incompletos o archivo no recibido");
            echo json_encode(["status" => false, "message" => "Datos incompletos o archivo no recibido"]);
            exit;
        }

        try {
            logDebug("📥 Procesando archivo temporal: $archivo");

            $datos = $gestion->procesarExcel($archivo, intval($tipoCarta), $fechaRecepcion);

            logDebug("✅ Registros insertados: " . count($datos));
            echo json_encode([
                "status" => true,
                "total" => count($datos),
                "data" => $datos
            ]);
        } catch (Exception $e) {
            logDebug("❌ ERROR FATAL: " . $e->getMessage());
            echo json_encode(["status" => false, "message" => $e->getMessage()]);
        }
        exit;

    case 'descargarTodas':
        // ✅ Limpia cualquier buffer
        while (ob_get_level()) {
            ob_end_clean();
        }

        // ✅ Obtiene los datos
        $data = $gestion->obtenerTodasLasCartas();

        // ✅ Envía como CSV limpio (sin advertencia en Excel)
        header("Content-Type: text/csv; charset=utf-8");
        header("Content-Disposition: attachment; filename=cartas_todas_gestion.csv");

        // Encabezados CSV
        echo "COMMUNITY ID;VILLAGE;CHILD NUMBER;FULL NAME;TIPO CARTA;FECHA RECEPCION;GESTOR\n";

        foreach ($data as $row) {
            echo "{$row['community_id']};{$row['village']};{$row['child_number']};{$row['full_name']};{$row['tipocarta']};{$row['fecha_recepcion']};{$row['gestor']}\n";
        }
        exit;

    default:
        echo json_encode(["status" => false, "message" => "Operación no válida"]);
        break;
}