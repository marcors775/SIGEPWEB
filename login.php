<?php
session_start();
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once "../Config/conexion.php";
require_once "../Modelo/login.php";
require_once "../Utils/csrf_helper.php"; // ✅ NUEVO

$conexion = Fn_getConnect();
$usuario = new Usuario($conexion);

$op = $_GET['op'] ?? '';

// 🔐 VALIDAR CREDENCIALES
if ($op === 'validar') {
    // ✅ Validar token CSRF usando helper reutilizable
    validar_csrf();

    $cedula = trim($_POST['usu'] ?? '');
    $clave = trim($_POST['cla'] ?? '');

    if (!$cedula || !$clave) {
        responder('error', 'Todos los campos son obligatorios');
    }

    $datosUsuario = $usuario->verificar($cedula);

    if (!$datosUsuario) {
        responder('error', 'Usuario no encontrado');
    }

    if (!password_verify($clave, $datosUsuario['contrasena'])) {
        responder('error', 'Contraseña incorrecta');
    }

    session_regenerate_id(true);
    $_SESSION['usu'] = $datosUsuario['Cedula'];
    $_SESSION['nombre_completo'] = $datosUsuario['nombre_completo'];
    $roles = $usuario->obtenerRoles($cedula);
    $_SESSION['roles'] = $roles;

    responder('ok', 'Inicio de sesión exitoso', ['roles' => $roles]);
}

// ✅ NUEVO: PERMITIR SI TIENE ALGÚN ROL (sin lista fija)
if ($op === 'rolesPermitidos') {
    $cedula = $_GET['cedula'] ?? '';

    if (!$cedula) {
        responder('error', 'Cédula requerida');
    }

    $sql = "
        SELECT r.tipo_rol
        FROM gestor g
        JOIN gestor_rol gr ON g.Cedula = gr.gestor_id
        JOIN rol r ON gr.rol_id = r.id
        WHERE g.Cedula = ?
    ";

    $stmt = $conexion->prepare($sql);
    $stmt->bind_param("s", $cedula);
    $stmt->execute();
    $result = $stmt->get_result();
    $roles = [];

    while ($row = $result->fetch_assoc()) {
        $roles[] = strtolower($row['tipo_rol']);
    }

    $permitido = count($roles) > 0;

    echo json_encode([
        'roles' => $roles,
        'permitido' => $permitido
    ]);
    exit;
}

// ❌ OPERACIÓN NO VÁLIDA
responder('error', 'Operación no válida');

// ✅ FUNCIÓN AUXILIAR
function responder($status, $message, $extra = []) {
    echo json_encode(array_merge([
        'status' => $status,
        'message' => $message
    ], $extra));
    exit;
}
