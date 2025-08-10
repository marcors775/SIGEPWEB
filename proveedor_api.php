<?php
// Archivo: /Ajax/proveedor_api.php
require_once "../Modelo/proveedorM.php";
require_once "../Config/conexion.php";

$op = $_GET['op'] ?? '';
$modelo = new ProveedorM();
$conexion = Fn_getConnect();

switch ($op) {

    case 'listar':
        $proveedores = $modelo->listar();
        echo json_encode($proveedores);
        break;

    case 'crear':
        $nombre = $_POST['nombre'] ?? '';
        $tipo_api = $_POST['tipo_api'] ?? 'onedrive';
        $descripcion = $_POST['descripcion'] ?? '';

        $conexion->begin_transaction();
        $id = $modelo->crear($nombre, $tipo_api, $descripcion);

        if ($id) {
            $conexion->commit();
            echo json_encode(['status' => 'ok', 'id' => $id]);
        } else {
            $conexion->rollback();
            echo json_encode(['status' => 'error', 'error' => 'Error al crear proveedor']);
        }
        break;

    case 'editar':
        $id = $_POST['id'] ?? 0;
        $nombre = $_POST['nombre'] ?? '';
        $tipo_api = $_POST['tipo_api'] ?? 'onedrive';
        $descripcion = $_POST['descripcion'] ?? '';

        $ok = $modelo->editar($id, $nombre, $tipo_api, $descripcion);
        echo json_encode(['status' => $ok ? 'ok' : 'error']);
        break;

    case 'tiene_credenciales':
        header('Content-Type: application/json');
        $id = $_GET['id'] ?? 0;

        $stmt = $conexion->prepare("SELECT id FROM nube_credencial WHERE id_proveedor = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $res = $stmt->get_result();

        echo json_encode(['existe' => $res->num_rows > 0]);
        break;

    case 'guardar_credenciales':
        header('Content-Type: application/json');

        $id_proveedor = $_POST['id_proveedor'] ?? 0;
        $client_id = trim($_POST['client_id'] ?? '');
        $client_secret = trim($_POST['client_secret'] ?? '');
        $redirect_uri = trim($_POST['redirect_uri'] ?? '');
        $tipo_auth = 'oauth2';

        if (!$id_proveedor || !$client_id || !$client_secret || !$redirect_uri) {
            echo json_encode([
                'status' => 'error',
                'error' => 'Faltan datos obligatorios'
            ]);
            exit;
        }

        try {
            // Verificar si ya existen credenciales
            $stmt = $conexion->prepare("SELECT id FROM nube_credencial WHERE id_proveedor = ?");
            $stmt->bind_param("i", $id_proveedor);
            $stmt->execute();
            $res = $stmt->get_result();

            if ($res->num_rows > 0) {
                // Actualizar credenciales
                $stmt = $conexion->prepare("
                    UPDATE nube_credencial 
                    SET client_id = ?, client_secret = ?, redirect_uri = ?, tipo_auth = ? 
                    WHERE id_proveedor = ?
                ");
                $stmt->bind_param("ssssi", $client_id, $client_secret, $redirect_uri, $tipo_auth, $id_proveedor);
            } else {
                // Insertar nuevas credenciales
                $stmt = $conexion->prepare("
                    INSERT INTO nube_credencial (id_proveedor, tipo_auth, client_id, client_secret, redirect_uri) 
                    VALUES (?, ?, ?, ?, ?)
                ");
                $stmt->bind_param("issss", $id_proveedor, $tipo_auth, $client_id, $client_secret, $redirect_uri);
            }

            if ($stmt->execute()) {
                echo json_encode(['status' => 'ok']);
            } else {
                echo json_encode([
                    'status' => 'error',
                    'error' => 'Error al ejecutar la consulta: ' . $stmt->error
                ]);
            }

        } catch (Exception $e) {
            echo json_encode([
                'status' => 'error',
                'error' => 'Excepción: ' . $e->getMessage()
            ]);
        }
        break;

    default:
        echo json_encode(['error' => 'Operación no válida']);
}