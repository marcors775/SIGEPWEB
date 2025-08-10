<?php
require_once "../Config/conexion.php";
$conexion = Fn_getConnect();
$op = $_GET['op'] ?? '';

switch ($op) {

    case 'listar':
        header('Content-Type: application/json');
        $res = $conexion->query("
            SELECT v.id, v.nombre, v.archivo, c.nombre AS categoria
            FROM vistas v
            JOIN categorias c ON v.id_categoria = c.id
            ORDER BY c.nombre, v.nombre
        ");
        echo json_encode($res->fetch_all(MYSQLI_ASSOC));
        break;

    case 'guardar':
        header('Content-Type: application/json');
        $id = $_POST['id'] ?? '';
        $nombre = trim($_POST['nombre']);
        $archivo = trim($_POST['archivo']);
        $id_categoria = intval($_POST['categoria']); // se espera ID

        if ($id_categoria <= 0) {
            http_response_code(400);
            echo json_encode(["error" => "Debe seleccionar una categoría válida"]);
            exit;
        }

        if ($id === '') {
            $stmt = $conexion->prepare("INSERT INTO vistas (nombre, archivo, id_categoria) VALUES (?, ?, ?)");
            $stmt->bind_param("ssi", $nombre, $archivo, $id_categoria);
        } else {
            $stmt = $conexion->prepare("UPDATE vistas SET nombre=?, archivo=?, id_categoria=? WHERE id=?");
            $stmt->bind_param("ssii", $nombre, $archivo, $id_categoria, $id);
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
        $stmt = $conexion->prepare("SELECT * FROM vistas WHERE id=?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $res = $stmt->get_result();
        echo json_encode($res->fetch_assoc());
        break;

    case 'eliminar':
        header('Content-Type: application/json');
        $id = $_POST['id'];
        $stmt = $conexion->prepare("DELETE FROM vistas WHERE id=?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        echo json_encode(['status' => 'ok']);
        break;

    case 'categorias': // nuevo caso para llenar el select
        header('Content-Type: application/json');
        $res = $conexion->query("SELECT id, nombre FROM categorias ORDER BY nombre");
        echo json_encode($res->fetch_all(MYSQLI_ASSOC));
        break;
}
?>