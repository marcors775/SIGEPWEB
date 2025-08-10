<?php
// Archivo: Ajax/onedrive_ruta_completa.php
// Ubicación recomendada: /Ajax/
// Archivo utilizado para reconstruir la ruta de carpetas en caso de editar

require_once "../Config/onedrive_token.php";

header('Content-Type: application/json');

$item_id = $_GET['item_id'] ?? '';
$id_proveedor = $_GET['id_proveedor'] ?? '';

if (!$item_id || !$id_proveedor) {
    echo json_encode(["error" => "Parámetros 'item_id' e 'id_proveedor' son requeridos"]);
    exit;
}

try {
    $token = get_valid_token($id_proveedor);

    $ruta = [];
    $actual_id = $item_id;

    // Recorrer hacia arriba hasta llegar a root
    while ($actual_id) {
        $url = "https://graph.microsoft.com/v1.0/me/drive/items/{$actual_id}";
        $opts = [
            "http" => ["method" => "GET", "header" => "Authorization: Bearer $token"]
        ];
        $context = stream_context_create($opts);
        $response = file_get_contents($url, false, $context);

        if ($response === false) break;

        $data = json_decode($response, true);
        if (!isset($data['id'])) break;

        // Evitar agregar el nodo raíz (/drive/root:)
        if (
            isset($data['parentReference']['path']) &&
            $data['parentReference']['path'] === "/drive/root:"
        ) {
            break;
        }

        array_unshift($ruta, [
            "id" => $data['id'],
            "name" => $data['name'],
            "path" => $data['parentReference']['path'] ?? ''
        ]);

        if (!isset($data['parentReference']['id']) || $data['parentReference']['id'] === $data['id']) break;

        $actual_id = $data['parentReference']['id'];
    }

    echo json_encode($ruta);
} catch (Exception $e) {
    echo json_encode(["error" => "Error al obtener ruta: " . $e->getMessage()]);
    exit;
}