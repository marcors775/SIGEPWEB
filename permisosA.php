<?php
require_once "../Config/conexion.php";
$conexion = Fn_getConnect();
$op = $_GET['op'] ?? '';

switch ($op) {
    case 'roles':
        header('Content-Type: application/json');
        $res = $conexion->query("SELECT id, tipo_rol FROM rol ORDER BY tipo_rol");
        echo json_encode($res->fetch_all(MYSQLI_ASSOC));
        break;

    case 'asignadas':
        header('Content-Type: application/json');
        $id = $_GET['id'];
        $sql = "SELECT v.id, v.nombre, c.nombre AS categoria
            FROM permisos p
            JOIN vistas v ON p.vista_id = v.id
            JOIN categorias c ON v.id_categoria = c.id
            WHERE p.rol_id = ?";
        $stmt = $conexion->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $res = $stmt->get_result();
        echo json_encode($res->fetch_all(MYSQLI_ASSOC));
        break;

    case 'disponibles':
        header('Content-Type: application/json');
        $id = $_GET['id'];
        $sql = "SELECT v.id, v.nombre, c.nombre AS categoria
            FROM vistas v
            JOIN categorias c ON v.id_categoria = c.id
            WHERE v.id NOT IN (
                SELECT vista_id FROM permisos WHERE rol_id = ?
            )
            ORDER BY c.nombre, v.nombre";
        $stmt = $conexion->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $res = $stmt->get_result();
        echo json_encode($res->fetch_all(MYSQLI_ASSOC));
        break;

    case 'asignar':
        header('Content-Type: application/json');
        $rol = $_POST['rol_id'];
        $vista = $_POST['vista_id'];
        $stmt = $conexion->prepare("INSERT IGNORE INTO permisos (rol_id, vista_id) VALUES (?, ?)");
        $stmt->bind_param("ii", $rol, $vista);
        $stmt->execute();
        echo json_encode(['status' => 'ok']);
        break;

    case 'revocar':
        header('Content-Type: application/json');
        $rol = $_POST['rol_id'];
        $vista = $_POST['vista_id'];
        $stmt = $conexion->prepare("DELETE FROM permisos WHERE rol_id=? AND vista_id=?");
        $stmt->bind_param("ii", $rol, $vista);
        $stmt->execute();
        echo json_encode(['status' => 'ok']);
        break;
}