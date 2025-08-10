<?php
session_start();
require_once "../Config/conexion.php";

// Verificación robusta: ignora mayúsculas
$roles = array_map('strtolower', $_SESSION['roles'] ?? []);
if (!isset($_SESSION['usu']) || !in_array("admin", $roles)) {
    http_response_code(401);
    echo json_encode(["error" => "No autorizado"]);
    exit;
}

$conexion = Fn_getConnect();

switch ($_GET['op']) {
    case 'usuarios':
        $sql = "SELECT Cedula, nombre_completo, correo_electronico FROM gestor";
        $result = $conexion->query($sql);

        if (!$result) {
            echo json_encode(["error" => $conexion->error]);
            exit;
        }

        $usuarios = [];

        while ($row = $result->fetch_assoc()) {
            $cedula = $row['Cedula'];
            $roles = [];

            $rs = $conexion->query("SELECT r.tipo_rol FROM gestor_rol gr JOIN rol r ON gr.rol_id = r.id WHERE gr.gestor_id = '$cedula'");
            if ($rs) {
                while ($r = $rs->fetch_assoc()) {
                    $roles[] = $r['tipo_rol'];
                }
            }

            $row['roles'] = $roles;
            $usuarios[] = $row;
        }

        header("Content-Type: application/json");
        echo json_encode($usuarios);
        break;

    case 'asignar':
        $cedula = $_POST['cedula'];
        $rol = $_POST['rol'];

        $rolId = getRolId($conexion, $rol);
        if ($rolId) {
            $conexion->query("INSERT IGNORE INTO gestor_rol (gestor_id, rol_id) VALUES ('$cedula', $rolId)");
        }
        break;

    case 'eliminar':
        $cedula = $_POST['cedula'];
        $rol = $_POST['rol'];

        $rolId = getRolId($conexion, $rol);
        if ($rolId) {
            $conexion->query("DELETE FROM gestor_rol WHERE gestor_id = '$cedula' AND rol_id = $rolId");
        }
        break;
}

function getRolId($conexion, $rol) {
    $stmt = $conexion->prepare("SELECT id FROM rol WHERE LOWER(tipo_rol) = LOWER(?)");
    $stmt->bind_param("s", $rol);
    $stmt->execute();
    $res = $stmt->get_result();
    $row = $res->fetch_assoc();
    return $row['id'] ?? null;
}
