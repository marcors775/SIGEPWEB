<?php
// debug_token_accesos.php
session_start();
header('Content-Type: application/json');

require_once "../Config/conexion.php";

function get_valid_token($id_proveedor, &$token_start = '') {
    $conexion = Fn_getConnect();
    $stmt = $conexion->prepare("SELECT client_id, client_secret, tenant_id, refresh_token, access_token, token_expires FROM nube_credencial WHERE id_proveedor = ? LIMIT 1");
    $stmt->bind_param("i", $id_proveedor);
    $stmt->execute();
    $stmt->bind_result($client_id, $client_secret, $tenant_id, $refresh_token, $access_token, $token_expires);
    $stmt->fetch();
    $stmt->close();

    if (!$client_id || !$refresh_token) return null;

    $ahora = new DateTime();
    $expira = new DateTime($token_expires);

    if ($ahora < $expira && $access_token) {
        $token_start = substr($access_token, 0, 20);
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
        CURLOPT_HTTPHEADER => ["Content-Type: application/x-www-form-urlencoded"]
    ]);

    $response = curl_exec($ch);
    curl_close($ch);
    $data = json_decode($response, true);

    if (!isset($data['access_token'])) return null;

    $nuevo_token = $data['access_token'];
    $nuevo_refresh = $data['refresh_token'] ?? $refresh_token;
    $expira_en = $data['expires_in'] ?? 3600;
    $token_start = substr($nuevo_token, 0, 20);

    $nueva_fecha = (new DateTime())->add(new DateInterval('PT' . $expira_en . 'S'));
    $stmt = $conexion->prepare("UPDATE nube_credencial SET access_token = ?, refresh_token = ?, token_expires = ? WHERE id_proveedor = ?");
    $stmt->bind_param("sssi", $nuevo_token, $nuevo_refresh, $nueva_fecha->format('Y-m-d H:i:s'), $id_proveedor);
    $stmt->execute();
    $stmt->close();

    return $nuevo_token;
}

$id_usuario = $_SESSION['usu'] ?? null;
$id_proveedor = $_GET['proveedor'] ?? null;

if (!$id_usuario) {
    echo json_encode(["error" => "Sesión no iniciada"]);
    exit;
}

$conexion = Fn_getConnect();

// 1. Cargar proveedores accesibles para el usuario
$stmt = $conexion->prepare("
    SELECT DISTINCT np.id AS id_proveedor, np.nombre AS proveedor_nombre
    FROM onedrive_acceso oa
    JOIN onedrive od ON oa.id_onedrive = od.id_onedrive
    JOIN nube_proveedor np ON od.id_proveedor = np.id
    WHERE oa.cedula = ? OR oa.rol_id IN (SELECT rol_id FROM gestor_rol WHERE gestor_id = ?)
");
$stmt->bind_param("ss", $id_usuario, $id_usuario);
$stmt->execute();
$proveedores = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

if (!$id_proveedor) {
    echo json_encode(["estado" => "proveedores", "proveedores" => $proveedores]);
    exit;
}

// 2. Cargar carpetas raíz asignadas al usuario para ese proveedor
$stmt = $conexion->prepare("
    SELECT od.carpeta, od.id_onedrive
    FROM onedrive_acceso oa
    JOIN onedrive od ON oa.id_onedrive = od.id_onedrive
    WHERE (oa.cedula = ? OR oa.rol_id IN (SELECT rol_id FROM gestor_rol WHERE gestor_id = ?))
    AND od.id_proveedor = ?
");
$stmt->bind_param("ssi", $id_usuario, $id_usuario, $id_proveedor);
$stmt->execute();
$carpetas = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

$token_start = '';
$token = get_valid_token($id_proveedor, $token_start);

// 3. Prueba de conexión a Microsoft Graph en la primera carpeta
$test_url = null;
$response_status = null;
if ($token && !empty($carpetas)) {
    $path = $carpetas[0]['carpeta'];
    $path = rawurlencode($path);
    $url = "https://graph.microsoft.com/v1.0/drive/root:{$path}:/children";
    $test_url = $url;

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ["Authorization: Bearer $token"]
    ]);
    curl_exec($ch);
    $response_status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
}

echo json_encode([
    "estado" => "debug",
    "usuario" => $id_usuario,
    "proveedor_id" => $id_proveedor,
    "token_inicio" => $token_start,
    "carpetas" => $carpetas,
    "test_url" => $test_url,
    "http" => $response_status,
    "proveedores" => $proveedores
]);
