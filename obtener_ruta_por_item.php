<?php
// Archivo: /Ajax/obtener_ruta_por_item.php

require_once "../Config/verificar_permiso.php";
require_once "../Config/onedrive_token.php";

header('Content-Type: application/json');

// ✅ Verificación inicial de parámetros
$id_proveedor = $_GET['id_proveedor'] ?? null;
$item_id = $_GET['item_id'] ?? null;

if (!$id_proveedor || !$item_id) {
    echo json_encode([
        "error" => "❌ Parámetros faltantes.",
        "debug" => [
            "id_proveedor" => $id_proveedor,
            "item_id" => $item_id
        ]
    ]);
    exit;
}

// ✅ Obtener token válido
$token = get_valid_token($id_proveedor);
if (!$token) {
    error_log("❌ Token inválido para proveedor ID $id_proveedor", 3, __DIR__ . '/../Logs/token_errors.log');
    echo json_encode([
        "error" => "❌ Token inválido.",
        "debug" => ["id_proveedor" => $id_proveedor]
    ]);
    exit;
}

// ✅ Consultar la API de Microsoft Graph
$url = "https://graph.microsoft.com/v1.0/me/drive/items/{$item_id}";
$opts = [
    "http" => [
        "method" => "GET",
        "header" => "Authorization: Bearer $token"
    ]
];
$ctx = stream_context_create($opts);
$response = @file_get_contents($url, false, $ctx);

// ⚠️ Validar la respuesta cruda
if ($response === false) {
    error_log("❌ Error al consultar item_id $item_id para proveedor $id_proveedor", 3, __DIR__ . '/../Logs/token_errors.log');
    echo json_encode([
        "error" => "❌ No se pudo consultar el item.",
        "debug" => [
            "url" => $url,
            "headers" => $http_response_header ?? [],
            "item_id" => $item_id
        ]
    ]);
    exit;
}

// ✅ Decodificar y procesar
$data = json_decode($response, true);
$ruta = $data['parentReference']['path'] ?? null;
$nombre = $data['name'] ?? '';

if ($ruta && $nombre) {
    echo json_encode([
        "ruta" => $ruta . '/' . $nombre,
        "nombre" => $nombre,
        "debug" => [
            "raw_response" => $data
        ]
    ]);
} else {
    echo json_encode([
        "error" => "❌ Ruta no encontrada.",
        "debug" => [
            "data" => $data,
            "ruta" => $ruta,
            "nombre" => $nombre
        ]
    ]);
}