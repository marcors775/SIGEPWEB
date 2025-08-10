<?php
// 📄 rolesA.php
// 📁 Carpeta: /Ajax

require_once "../Config/conexion.php";
$conexion = Fn_getConnect();
$op = $_GET['op'] ?? '';

switch ($op) {
    case 'listar':
        header('Content-Type: application/json');
        $res = $conexion->query("SELECT * FROM rol ORDER BY tipo_rol");
        echo json_encode($res->fetch_all(MYSQLI_ASSOC));
        break;

    case 'guardar':
        header('Content-Type: application/json');
        $id = $_POST['id'] ?? '';
        $tipo_rol = trim($_POST['tipo_rol']);
        $descripcion = trim($_POST['descripcion'] ?? '');

        if ($id === '') {
            $stmt = $conexion->prepare("INSERT INTO rol (tipo_rol, descripcion) VALUES (?, ?)");
            $stmt->bind_param("ss", $tipo_rol, $descripcion);
        } else {
            $stmt = $conexion->prepare("UPDATE rol SET tipo_rol=?, descripcion=? WHERE id=?");
            $stmt->bind_param("ssi", $tipo_rol, $descripcion, $id);
        }

        if (!$stmt->execute()) {
            http_response_code(500);
            echo json_encode(["error" => $stmt->error]);
        } else {
            echo json_encode(['status' => 'ok']);
        }
        break;

    case 'obtener':
        header('Content-Type: application/json');
        $id = $_GET['id'];
        $stmt = $conexion->prepare("SELECT * FROM rol WHERE id=?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $res = $stmt->get_result();
        echo json_encode($res->fetch_assoc());
        break;

    case 'eliminar':
        header('Content-Type: application/json');
        $id = $_POST['id'];

        $check = $conexion->prepare("SELECT COUNT(*) FROM gestor WHERE id_rol = ?");
        $check->bind_param("i", $id);
        $check->execute();
        $check->bind_result($total);
        $check->fetch();
        $check->close();

        if ($total > 0) {
            // ✅ Evitar 409: devolvemos 200 con estado personalizado
            echo json_encode([
                'status' => 'conflict',
                'message' => 'Este rol está asignado a uno o más usuarios. ¿Deseas liberarlo y eliminarlo?'
            ]);
            return;
        }

        $stmt = $conexion->prepare("DELETE FROM rol WHERE id=?");
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            echo json_encode(['status' => 'ok']);
        } else {
            http_response_code(500);
            echo json_encode([
                'status' => 'error',
                'message' => 'Error al eliminar el rol: ' . $stmt->error
            ]);
        }
        break;
}