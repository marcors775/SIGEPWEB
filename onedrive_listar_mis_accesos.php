<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');
session_start();

require_once "../Config/conexion.php";
require_once "../Config/onedrive_token.php";

function log_debug($msg) {
    file_put_contents(__DIR__ . '/../Logs/onedrive_debug.log', date('c') . " → $msg\n", FILE_APPEND);
}

if (!isset($_SESSION['usu'])) {
    echo json_encode(["estado" => "error", "mensaje" => "Sesión no iniciada"]);
    exit;
}

$id_usuario = $_SESSION['usu'];
$id_proveedor = isset($_GET['id_proveedor']) ? intval($_GET['id_proveedor']) : null;
$parent = $_GET['parent'] ?? null;

$conexion = Fn_getConnect();

// Obtener proveedores accesibles
$stmt = $conexion->prepare("
    SELECT DISTINCT np.id AS id_proveedor, np.nombre AS proveedor_nombre
    FROM onedrive_acceso oa
    JOIN onedrive od ON oa.id_onedrive = od.id_onedrive
    JOIN nube_proveedor np ON od.id_proveedor = np.id
    WHERE oa.cedula = ?
");
$stmt->bind_param("s", $id_usuario);
$stmt->execute();
$proveedores = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

if (!$id_proveedor) {
    echo json_encode(["estado" => "seleccionar", "proveedores" => $proveedores]);
    exit;
}

$token = get_valid_token($id_proveedor);
if (!$token) {
    echo json_encode(["estado" => "sin_acceso", "mensaje" => "No se pudo obtener token", "proveedores" => $proveedores]);
    exit;
}

$items = [];

if ($parent) {
    // 👇 Mostrar contenido dentro de una carpeta específica
    $url = "https://graph.microsoft.com/v1.0/me/drive/items/{$parent}/children";
    log_debug("📂 Consultando hijos por ID: $url");

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "Authorization: Bearer $token",
            "Content-Type: application/json"
        ]
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    log_debug("🔎 Respuesta ($httpCode): " . substr($response, 0, 300));

    if ($httpCode === 200) {
        $data = json_decode($response, true);
        foreach ($data['value'] as $item) {
            $items[] = [
                "name" => $item['name'],
                "id" => $item['id'],
                "path" => ($item['parentReference']['path'] ?? '') . '/' . $item['name'],
                "tipo" => isset($item['folder']) ? 'carpeta' : 'archivo'
            ];
        }
    }
} else {
    // 👇 Mostrar solo las carpetas raíz asignadas al usuario
    $stmt = $conexion->prepare("
        SELECT od.carpeta, od.item_id 
        FROM onedrive_acceso oa 
        JOIN onedrive od ON oa.id_onedrive = od.id_onedrive 
        WHERE oa.cedula = ? AND od.id_proveedor = ?
    ");
    $stmt->bind_param("si", $id_usuario, $id_proveedor);
    $stmt->execute();
    $res = $stmt->get_result();
    $rutas = $res->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    foreach ($rutas as $row) {
        $nombreBase = basename($row['carpeta'] ?? '');
        $items[] = [
            "name" => $nombreBase ?: "Carpeta Asignada",
            "id" => $row['item_id'],
            "path" => $row['carpeta'],
            "tipo" => "carpeta"
        ];
    }
}

echo json_encode([
    "estado" => "ok",
    "resultado" => $items,
    "proveedores" => $proveedores,
    "proveedor_activo" => $id_proveedor
]);