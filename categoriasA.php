<?php
require_once "../Config/conexion.php";
$conexion = Fn_getConnect();
$op = $_GET['op'] ?? '';

switch ($op) {
    case 'listar':
        $res = $conexion->query("SELECT * FROM categorias ORDER BY nombre");
        echo json_encode($res->fetch_all(MYSQLI_ASSOC));
        break;

    case 'guardar':
        $id = isset($_POST['id']) ? trim($_POST['id']) : '';
        $nombre = trim($_POST['nombre'] ?? '');

        if ($nombre === '') {
            http_response_code(400);
            echo json_encode(['error' => 'El nombre es obligatorio']);
            return;
        }

        $idSafe = ($id !== '' && is_numeric($id)) ? intval($id) : 0;

        // Verificar duplicado
        $check = $conexion->prepare("SELECT COUNT(*) FROM categorias WHERE nombre = ? AND id != ?");
        $check->bind_param("si", $nombre, $idSafe);
        $check->execute();
        $check->bind_result($existe);
        $check->fetch();
        $check->close();

        if ($existe > 0) {
            http_response_code(409);
            echo json_encode(['error' => 'Ya existe una categoría con ese nombre.']);
            return;
        }

        // Insertar o actualizar
        if ($idSafe > 0) {
            $stmt = $conexion->prepare("UPDATE categorias SET nombre=? WHERE id=?");
            $stmt->bind_param("si", $nombre, $idSafe);
        } else {
            $stmt = $conexion->prepare("INSERT INTO categorias (nombre) VALUES (?)");
            $stmt->bind_param("s", $nombre);
        }

        if (!$stmt->execute()) {
            http_response_code(500);
            echo json_encode(['error' => $stmt->error]);
        } else {
            echo json_encode(['status' => 'ok']);
        }
        break;

    case 'obtener':
        $id = $_GET['id'] ?? '';
        if (!is_numeric($id)) {
            http_response_code(400);
            echo json_encode(['error' => 'ID inválido']);
            return;
        }

        $stmt = $conexion->prepare("SELECT * FROM categorias WHERE id=?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $res = $stmt->get_result();
        echo json_encode($res->fetch_assoc());
        break;

    case 'eliminar':
        $id = $_POST['id'] ?? '';
        if (!is_numeric($id)) {
            http_response_code(400);
            echo json_encode(['error' => 'ID inválido']);
            return;
        }

        $stmt = $conexion->prepare("DELETE FROM categorias WHERE id=?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        echo json_encode(['status' => 'ok']);
        break;
}