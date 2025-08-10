<?php
session_start();
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require '../Modelo/ingresarInformacionM.php';

header('Content-Type: application/json');

if (!isset($_SESSION['usu'])) {
    echo json_encode(['error' => 'No autorizado']);
    http_response_code(403);
    exit();
}

try {
    $niñoModel = new NiñoModel();
    
    if (isset($_GET['mes'])) {
        $niños = $niñoModel->obtenerNiñosPorMes($_GET['mes']);
    } else {
        $niños = $niñoModel->obtenerNiños();
    }

    if ($niños) {
        echo json_encode($niños);
    } else {
        echo json_encode(['mensaje' => 'No se encontraron niños']);
    }
} catch (Exception $e) {
    echo json_encode(['error' => 'Error al obtener los datos: ' . $e->getMessage()]);
    http_response_code(500);
    exit();
}
