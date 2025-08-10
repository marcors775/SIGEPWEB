<?php
// Archivo: Ajax/onedrive_api.php

ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once "../Config/conexion.php";
$conexion = Fn_getConnect();
$op = $_GET['op'] ?? '';

switch ($op) {
    case 'listar_carpetas':
        header('Content-Type: application/json');
        $res = $conexion->query("SELECT id_onedrive, carpeta, descripcion, estado FROM onedrive ORDER BY carpeta");
        echo json_encode($res->fetch_all(MYSQLI_ASSOC));
        break;

    case 'accesos_asignados':
        header('Content-Type: application/json');
        $id = $_GET['id_onedrive'] ?? 0;
        $sql = "SELECT oa.id, g.Nombre AS gestor, r.tipo_rol AS rol
                FROM onedrive_acceso oa
                LEFT JOIN gestor g ON oa.cedula = g.Cedula
                LEFT JOIN rol r ON oa.rol_id = r.id
                WHERE oa.id_onedrive = ?";
        $stmt = $conexion->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $res = $stmt->get_result();
        echo json_encode($res->fetch_all(MYSQLI_ASSOC));
        break;

    case 'accesos_asignados_todos':
    header('Content-Type: application/json');
    $sql = "SELECT oa.id, o.carpeta, o.descripcion, o.item_id,
                   np.nombre AS proveedor,
                   g.nombre_completo AS gestor,
                   r.tipo_rol AS rol,
                   (SELECT COUNT(*) FROM onedrive_acceso oa2 
                    INNER JOIN onedrive o2 ON oa2.id_onedrive = o2.id_onedrive 
                    WHERE o2.item_id = o.item_id) AS total_accesos
            FROM onedrive_acceso oa
            INNER JOIN onedrive o ON oa.id_onedrive = o.id_onedrive
            LEFT JOIN nube_proveedor np ON o.id_proveedor = np.id
            LEFT JOIN gestor g ON oa.cedula = g.Cedula
            LEFT JOIN rol r ON oa.rol_id = r.id
            ORDER BY o.carpeta ASC";
    $res = $conexion->query($sql);
    echo json_encode($res->fetch_all(MYSQLI_ASSOC));
    break;

    case 'listar_gestores':
        header('Content-Type: application/json');
        $sql = "SELECT DISTINCT g.Cedula AS id, g.nombre_completo AS nombre
                FROM gestor g
                INNER JOIN gestor_rol gr ON gr.gestor_id = g.Cedula
                ORDER BY g.nombre_completo;";
        $res = $conexion->query($sql);
        echo json_encode($res->fetch_all(MYSQLI_ASSOC));
        break;

    case 'listar_roles':
        header('Content-Type: application/json');
        $sql = "SELECT id AS id, tipo_rol AS nombre FROM rol ORDER BY tipo_rol";
        $res = $conexion->query($sql);
        echo json_encode($res->fetch_all(MYSQLI_ASSOC));
        break;

    case 'asignar_acceso':
        header('Content-Type: application/json');

        $ruta = $_POST['ruta'] ?? '';
        $item_id = $_POST['item_id'] ?? '';
        $descripcion = $_POST['descripcion'] ?? '';
        $cedula = isset($_POST['gestor_id']) && $_POST['gestor_id'] !== '' ? $_POST['gestor_id'] : null;
        $rol_id = isset($_POST['rol_id']) && $_POST['rol_id'] !== '' ? $_POST['rol_id'] : null;
        $id_proveedor = $_POST['id_proveedor'] ?? null;

        if (!$ruta || !$item_id || ($cedula === null && $rol_id === null)) {
            http_response_code(400);
            echo json_encode(["error" => "Debe seleccionar una carpeta válida y al menos un gestor, rol o ambos."]);
            exit;
        }

        $stmt = $conexion->prepare("SELECT id_onedrive FROM onedrive WHERE item_id = ?");
        $stmt->bind_param("s", $item_id);
        $stmt->execute();
        $res = $stmt->get_result();
        $row = $res->fetch_assoc();

        if ($row) {
            $id_onedrive = $row['id_onedrive'];
            $stmt = $conexion->prepare("UPDATE onedrive SET carpeta = ?, descripcion = ? WHERE id_onedrive = ?");
            $stmt->bind_param("ssi", $ruta, $descripcion, $id_onedrive);
            $stmt->execute();
        } else {
            $estado = 1;
            $stmt = $conexion->prepare("INSERT INTO onedrive (carpeta, item_id, descripcion, estado, id_proveedor) VALUES (?, ?, ?, ?, ?)");
            $stmt->bind_param("sssii", $ruta, $item_id, $descripcion, $estado, $id_proveedor);
            $stmt->execute();
            $id_onedrive = $conexion->insert_id;
        }

        $check = $conexion->prepare("SELECT id FROM onedrive_acceso WHERE id_onedrive = ? AND cedula <=> ? AND rol_id <=> ?");
        $check->bind_param("iii", $id_onedrive, $cedula, $rol_id);
        $check->execute();
        $checkResult = $check->get_result();

        if ($checkResult->num_rows > 0) {
            echo json_encode(["error" => "⚠️ Este acceso ya está asignado."]);
            break;
        }

        $stmt = $conexion->prepare("INSERT INTO onedrive_acceso (id_onedrive, cedula, rol_id) VALUES (?, ?, ?)");
        $stmt->bind_param("iii", $id_onedrive, $cedula, $rol_id);
        $stmt->execute();

        echo json_encode([
  "status" => "ok",
  "item_id" => $item_id
]);
       
        break;

    case 'revocar_acceso':
        header('Content-Type: application/json');
        $id = $_POST['id'];
        $stmt = $conexion->prepare("DELETE FROM onedrive_acceso WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        echo json_encode(['status' => 'ok']);
        break;

    case 'obtener_acceso':
        header('Content-Type: application/json');
        $id = $_GET['id'] ?? 0;
        $sql = "SELECT oa.id, o.carpeta, o.item_id, o.descripcion, oa.cedula, oa.rol_id, o.id_proveedor
                FROM onedrive_acceso oa
                INNER JOIN onedrive o ON oa.id_onedrive = o.id_onedrive
                WHERE oa.id = ?";
        $stmt = $conexion->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $res = $stmt->get_result();
        echo json_encode($res->fetch_assoc());
        break;

    case 'actualizar_acceso':
        header('Content-Type: application/json');

        $id = $_GET['id'] ?? 0;
        $ruta = $_POST['ruta'] ?? '';
        $item_id = $_POST['item_id'] ?? '';
        $descripcion = $_POST['descripcion'] ?? '';
        $gestor_id = isset($_POST['gestor_id']) && $_POST['gestor_id'] !== '' ? $_POST['gestor_id'] : null;
        $rol_id = isset($_POST['rol_id']) && $_POST['rol_id'] !== '' ? $_POST['rol_id'] : null;
        $id_proveedor = $_POST['id_proveedor'] ?? null;

        if (!$ruta || !$item_id || ($gestor_id === null && $rol_id === null)) {
            http_response_code(400);
            echo json_encode(["error" => "Debe indicar una carpeta válida y al menos un gestor, rol o ambos."]);
            exit;
        }

        $stmt = $conexion->prepare("SELECT id_onedrive FROM onedrive_acceso WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $stmt->bind_result($id_onedrive_actual);
        $stmt->fetch();
        $stmt->close();

        $stmt = $conexion->prepare("SELECT COUNT(*) FROM onedrive_acceso WHERE id_onedrive = ?");
        $stmt->bind_param("i", $id_onedrive_actual);
        $stmt->execute();
        $stmt->bind_result($total_usos);
        $stmt->fetch();
        $stmt->close();

        if ($total_usos > 1) {
            $stmt = $conexion->prepare("SELECT id_onedrive FROM onedrive WHERE carpeta = ? AND item_id = ? AND descripcion = ? AND id_proveedor = ?");
            $stmt->bind_param("sssi", $ruta, $item_id, $descripcion, $id_proveedor);
            $stmt->execute();
            $res = $stmt->get_result();
            $row = $res->fetch_assoc();

            if ($row) {
                $nuevo_id_onedrive = $row['id_onedrive'];
            } else {
                $estado = 1;
                $stmt = $conexion->prepare("INSERT INTO onedrive (carpeta, item_id, descripcion, estado, id_proveedor) VALUES (?, ?, ?, ?, ?)");
                $stmt->bind_param("sssii", $ruta, $item_id, $descripcion, $estado, $id_proveedor);
                $stmt->execute();
                $nuevo_id_onedrive = $conexion->insert_id;
            }

            $stmt = $conexion->prepare("UPDATE onedrive_acceso SET id_onedrive = ?, cedula = ?, rol_id = ? WHERE id = ?");
            $stmt->bind_param("iiii", $nuevo_id_onedrive, $gestor_id, $rol_id, $id);
            $stmt->execute();
        } else {
            $stmt = $conexion->prepare("UPDATE onedrive SET carpeta = ?, descripcion = ? WHERE id_onedrive = ?");
            $stmt->bind_param("ssi", $ruta, $descripcion, $id_onedrive_actual);
            $stmt->execute();

            $stmt = $conexion->prepare("UPDATE onedrive_acceso SET cedula = ?, rol_id = ? WHERE id = ?");
            $stmt->bind_param("iii", $gestor_id, $rol_id, $id);
            $stmt->execute();
        }

        echo json_encode(["status" => "ok"]);
        break;

    case 'usuarios_por_carpeta':
        header('Content-Type: application/json');
        $item_id = $_GET['item_id'] ?? null;

        if (!$item_id) {
            echo json_encode(["error" => "Parámetro 'item_id' es requerido"]);
            exit;
        }

        $stmt = $conexion->prepare("SELECT id_onedrive FROM onedrive WHERE item_id = ?");
        $stmt->bind_param("s", $item_id);
        $stmt->execute();
        $res = $stmt->get_result();
        $id_onedrive_arr = [];
        while ($row = $res->fetch_assoc()) {
            $id_onedrive_arr[] = $row['id_onedrive'];
        }
        $stmt->close();

        if (empty($id_onedrive_arr)) {
            echo json_encode(["error" => "Carpeta no registrada"]);
            exit;
        }

        $placeholders = implode(',', array_fill(0, count($id_onedrive_arr), '?'));
        $types = str_repeat('i', count($id_onedrive_arr));

        $sql = "SELECT oa.id, g.nombre_completo AS gestor, r.tipo_rol AS rol
                FROM onedrive_acceso oa
                LEFT JOIN gestor g ON oa.cedula = g.Cedula
                LEFT JOIN rol r ON oa.rol_id = r.id
                WHERE oa.id_onedrive IN ($placeholders)";
        $stmt = $conexion->prepare($sql);
        $stmt->bind_param($types, ...$id_onedrive_arr);
        $stmt->execute();
        $res = $stmt->get_result();
        echo json_encode($res->fetch_all(MYSQLI_ASSOC));
        break;

    case 'buscar_por_item_id':
        header('Content-Type: application/json');
        $item_id = $_GET['item_id'] ?? '';
        $id_proveedor = $_GET['id_proveedor'] ?? '';

        if (!$item_id || !$id_proveedor) {
            echo json_encode(["error" => "Faltan parámetros"]);
            exit;
        }

        $stmt = $conexion->prepare("SELECT descripcion FROM onedrive WHERE item_id = ? AND id_proveedor = ? LIMIT 1");
        $stmt->bind_param("si", $item_id, $id_proveedor);
        $stmt->execute();
        $res = $stmt->get_result();
        $data = $res->fetch_assoc();

        echo json_encode($data ?? []);
        break;

    case 'rol_por_gestor':
        header('Content-Type: application/json');
        $gestor_id = $_GET['gestor_id'] ?? null;

        if (!$gestor_id) {
            echo json_encode([]);
            exit;
        }

        $sql = "SELECT r.id, r.tipo_rol 
                FROM gestor_rol gr 
                JOIN rol r ON gr.rol_id = r.id 
                WHERE gr.gestor_id = ? LIMIT 1";

        $stmt = $conexion->prepare($sql);
        $stmt->bind_param("s", $gestor_id);
        $stmt->execute();
        $res = $stmt->get_result();
        echo json_encode($res->fetch_assoc() ?? []);
        break;
}
