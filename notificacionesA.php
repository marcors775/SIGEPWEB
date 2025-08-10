<?php

require_once '../Modelo/notificacionesM.php';
header('Content-Type: application/json');

$notificaciones = new Notificaciones();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $gestor = $_POST['gestor'] ?? null;

    if ($gestor) {
        echo json_encode($notificaciones->obtenerNotificacionesPorGestor($gestor));
    } else {
        echo json_encode(['error' => 'Gestor no especificado.']);
    }
    exit();
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode($notificaciones->obtenerGestores());
    exit();
}
?>