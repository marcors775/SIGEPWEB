<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');
session_start();

require_once "../Config/conexion.php";

function get_valid_token($id_proveedor) {
    $conexion = Fn_getConnect();
    $stmt = $conexion->prepare("SELECT client_id, client_secret, tenant_id, refresh_token, access_token, token_expires FROM nube_credencial WHERE id_proveedor = ?");
    $stmt->bind_param("i", $id_proveedor);
    $stmt->execute();
    $stmt->bind_result($client_id, $client_secret, $tenant_id, $refresh_token, $access_token, $token_expires);
    $stmt->fetch();
    $stmt->close();

    $now = new DateTime();
    $expires = new DateTime($token_expires ?? '2000-01-01');

    if ($now < $expires && !empty($access_token)) {
        return $access_token;
    }

    $postData = http_build_query([
        'client_id' => $client_id,
        'client_secret' => $client_secret,
        'scope' => 'https://graph.microsoft.com/.default',
        'grant_type' => 'refresh_token',
        'refresh_token' => $refresh_token
    ]);

    $ch = curl_init("https://login.microsoftonline.com/$tenant_id/oauth2/v2.0/token");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $postData,
        CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded']
    ]);
    $response = curl_exec($ch);
    curl_close($ch);

    $data = json_decode($response, true);
    if (!isset($data['access_token'])) {
        return null;
    }

    $new_token = $data['access_token'];
    $new_refresh = $data['refresh_token'] ?? $refresh_token;
    $new_expiry = (new DateTime())->add(new DateInterval('PT' . ($data['expires_in'] ?? 3600) . 'S'))->format('Y-m-d H:i:s');

    $stmt = $conexion->prepare("UPDATE nube_credencial SET access_token=?, refresh_token=?, token_expires=? WHERE id_proveedor=?");
    $stmt->bind_param("sssi", $new_token, $new_refresh, $new_expiry, $id_proveedor);
    $stmt->execute();
    $stmt->close();

    return $new_token;
}

if (!isset($_SESSION['usu'])) {
    echo json_encode(["estado" => "error", "mensaje" => "Sesión no iniciada"]);
    exit;
}

$id_usuario = $_SESSION['usu'];
$id_proveedor = isset($_GET['id_proveedor']) ? intval($_GET['id_proveedor']) : null;
$parent = $_GET['parent'] ?? null;

$conexion = Fn_getConnect();

// Obtener el rol del gestor
$stmt = $conexion->prepare("SELECT rol_id FROM gestor_rol WHERE gestor_id = ?");
$stmt->bind_param("s", $id_usuario);
$stmt->execute();
$stmt->bind_result($rol);
$stmt->fetch();
$stmt->close();

// Obtener lista de proveedores accesibles
$sql_proveedores = "
    SELECT DISTINCT np.id AS id_proveedor, np.nombre AS proveedor_nombre
    FROM onedrive_acceso oa
    JOIN onedrive od ON oa.id_onedrive = od.id_onedrive
    JOIN nube_proveedor np ON od.id_proveedor = np.id
    WHERE oa.cedula = ? OR oa.rol_id = ?
";
$stmt = $conexion->prepare($sql_proveedores);
$stmt->bind_param("ss", $id_usuario, $rol);
$stmt->execute();
$proveedores = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

if (!$id_proveedor) {
    echo json_encode(["estado" => "seleccionar", "proveedores" => $proveedores]);
    exit;
}

// Obtener ruta base
$ruta = null;
if (!$parent) {
    $stmt = $conexion->prepare("
        SELECT od.carpeta FROM onedrive_acceso oa
        JOIN onedrive od ON oa.id_onedrive = od.id_onedrive
        WHERE (oa.cedula = ? OR oa.rol_id = ?) AND od.id_proveedor = ? LIMIT 1
    ");
    $stmt->bind_param("ssi", $id_usuario, $rol, $id_proveedor);
    $stmt->execute();
    $stmt->bind_result($ruta);
    $stmt->fetch();
    $stmt->close();
}

$token = get_valid_token($id_proveedor);
if (!$token) {
    echo json_encode(["estado" => "sin_acceso", "mensaje" => "No se pudo obtener token", "proveedores" => $proveedores]);
    exit;
}

// Construcción segura de la URL
if ($parent) {
    $url = "https://graph.microsoft.com/v1.0/me/drive/items/{$parent}/children";
} elseif ($ruta) {
    $ruta_trim = trim($ruta);
    if (str_starts_with($ruta_trim, '/drive/root:')) {
        $ruta_trim = substr($ruta_trim, strlen('/drive/root:'));
    }
    $ruta_encoded = rawurlencode($ruta_trim);
    $url = "https://graph.microsoft.com/v1.0/me/drive/root:/$ruta_encoded:/children";
} else {
    $url = "https://graph.microsoft.com/v1.0/me/drive/root/children";
}

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

if ($httpCode !== 200) {
    echo json_encode([
        "estado" => "sin_acceso",
        "mensaje" => "La carpeta no es accesible (HTTP $httpCode).",
        "url" => $url,
        "proveedores" => $proveedores
    ]);
    exit;
}

$data = json_decode($response, true);
$items = [];
foreach ($data['value'] as $item) {
    $items[] = [
        "name" => $item['name'],
        "id" => $item['id'],
        "path" => ($item['parentReference']['path'] ?? '') . '/' . $item['name'],
        "tipo" => isset($item['folder']) ? 'carpeta' : 'archivo'
    ];
}

echo json_encode([
    "estado" => "ok",
    "resultado" => $items,
    "proveedores" => $proveedores,
    "proveedor_activo" => $id_proveedor
]);