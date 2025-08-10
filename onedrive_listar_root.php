<?php
// Archivo: /Ajax/onedrive_listar_root.php

header('Content-Type: application/json');
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/../Config/onedrive_token.php';

$id_proveedor = $_GET['id_proveedor'] ?? null;
$parentId     = $_GET['parent'] ?? null;

// Log de control (opcional)
file_put_contents(
    __DIR__ . '/../Logs/onedrive_id_proveedor.log',
    "🧪 ID recibido: " . ($id_proveedor ?? 'NO DEFINIDO') . PHP_EOL,
    FILE_APPEND
);

// Validación de parámetro obligatorio
if (!$id_proveedor) {
    http_response_code(400);
    echo json_encode(['error' => 'Falta el parámetro id_proveedor']);
    exit;
}

// Obtener token válido
$accessToken = get_valid_token($id_proveedor);

// Verificar error al obtener token
if (!$accessToken || strpos($accessToken, '❌') === 0) {
    http_response_code(401);
    echo json_encode(['error' => '❌ No se pudo obtener token válido para este proveedor']);
    exit;
}

// Construcción de URL para la API Graph
$url = $parentId
    ? "https://graph.microsoft.com/v1.0/me/drive/items/$parentId/children"
    : "https://graph.microsoft.com/v1.0/me/drive/root/children";

// Configuración de solicitud HTTP
$options = [
    "http" => [
        "method"  => "GET",
        "header"  => "Authorization: Bearer $accessToken\r\nContent-Type: application/json"
    ]
];
$context  = stream_context_create($options);
$response = @file_get_contents($url, false, $context);

// Obtener código HTTP devuelto
$httpCode = 0;
foreach ($http_response_header ?? [] as $header) {
    if (preg_match('#HTTP/\\d+\\.\\d+ (\\d+)#', $header, $matches)) {
        $httpCode = (int)$matches[1];
        break;
    }
}

// Validación de respuesta fallida
if ($response === false || $httpCode >= 400) {
    http_response_code($httpCode ?: 500);
    echo json_encode([
        "error"     => "Error al consultar la API de OneDrive",
        "http_code" => $httpCode,
        "debug"     => $http_response_header ?? []
    ]);
    exit;
}

// Procesar respuesta JSON de Microsoft Graph
$data    = json_decode($response, true);
$folders = [];

if (!empty($data["value"]) && is_array($data["value"])) {
    foreach ($data["value"] as $item) {
        if (!isset($item["folder"])) continue;

        $path = $item["parentReference"]["path"] ?? '/drive/root:';
        $folders[] = [
            "id"   => $item["id"],
            "name" => $item["name"],
            "path" => $path . '/' . $item["name"]
        ];
    }
}

// Respuesta final
echo json_encode($folders);