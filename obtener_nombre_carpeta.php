<?php
// Archivo: Ajax/obtener_nombre_carpeta.php
require_once "../Config/onedrive_token.php";

header('Content-Type: application/json');

$item_id = $_GET['item_id'] ?? '';
$id_proveedor = $_GET['id_proveedor'] ?? '';

if (!$item_id || !$id_proveedor) {
    echo json_encode(["error" => "❌ Faltan parámetros."]);
    exit;
}

try {
    $token = get_valid_token($id_proveedor);

    $url = "https://graph.microsoft.com/v1.0/me/drive/items/{$item_id}";
    $opts = [
        "http" => [
            "method" => "GET",
            "header" => "Authorization: Bearer $token"
        ]
    ];
    $context = stream_context_create($opts);
    $response = @file_get_contents($url, false, $context);

    if ($response === false) {
        echo json_encode(["error" => "❌ Error al consultar OneDrive."]);
        exit;
    }

    $data = json_decode($response, true);

    echo json_encode([
        "name" => $data['name'] ?? 'Desconocida'
    ]);
} catch (Exception $e) {
    echo json_encode(["error" => "❌ Excepción: " . $e->getMessage()]);
}