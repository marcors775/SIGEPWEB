<?php
require_once "../Config/conexion.php";

header("Content-Type: application/json");

$conexion = Fn_getConnect();
$rolId = $_POST['rol_id'] ?? null;

if (!$rolId) {
    http_response_code(400);
    echo json_encode(['error' => 'ID de rol no recibido']);
    exit;
}

// Establecer id_rol a NULL para los gestores que lo tengan asignado
$stmt = $conexion->prepare("UPDATE gestor SET id_rol = NULL WHERE id_rol = ?");
$stmt->bind_param("i", $rolId);

if ($stmt->execute()) {
    echo json_encode(['status' => 'ok']);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Error al liberar el rol: ' . $stmt->error]);
}
