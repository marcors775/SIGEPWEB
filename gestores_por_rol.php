<?php
require_once "../Config/conexion.php";

header('Content-Type: application/json');

$conexion = Fn_getConnect();
$rolId = $_GET['id'] ?? null;

if (!$rolId) {
    echo json_encode([]);
    exit;
}

$stmt = $conexion->prepare("SELECT Cedula, nombre_completo FROM gestor WHERE id_rol = ?");
$stmt->bind_param("i", $rolId);
$stmt->execute();
$res = $stmt->get_result();
$gestores = $res->fetch_all(MYSQLI_ASSOC);

echo json_encode($gestores);
