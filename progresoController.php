<?php
require_once "../Config/conexion.php";
require_once "../Modelo/progresoM.php";
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');

$action = $_GET['action'] ?? '';
$progreso = new progreso(Fn_getConnect());

try {
    if ($action === 'getComunidades') {
        $comunidades = $progreso->obtenerAldeasConConteo();
        echo json_encode($comunidades);
    } elseif ($action === 'getProgreso') {
        $aldea = $_GET['aldea'] ?? '';
        if (!empty($aldea)) {
            $progresoData = $progreso->obtenerNiñosPorAldea($aldea);
            echo json_encode($progresoData);
        } else {
            echo json_encode($progreso->obtenerAldeasConConteo());
        }
    } else {
        echo json_encode(['error' => 'Acción no válida']);
    }
} catch (Exception $e) {
    // Maneja el error y devuelve un mensaje JSON con el error
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>