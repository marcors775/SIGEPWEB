<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once '../Modelo/informesMensual.php';

$action = $_GET['op'] ?? ''; // Obtener la acción de la URL

$model = new Informes();

if ($action === 'obtenerMeses') {
    $model->obtenerMesesDisponibles();
} elseif ($action === 'obtenerInformeMensual') {
    $mes = $_GET['mes'] ?? '';
    $model->obtenerInformeMensual($mes);
} else {
    echo json_encode(['error' => 'Acción no válida']);
}
?>