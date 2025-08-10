<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();
$_SESSION['Cedula'] = 1003220983; // Cambia por un ID válido de tu tabla gestor

include_once '../Config/conexion.php';
require_once '../Modelo/PlanificacionModelo.php';

try {
    $datos = PlanificacionModelo::listarPorGestor($_SESSION['Cedula']);
    header('Content-Type: application/json');
    echo json_encode($datos);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
