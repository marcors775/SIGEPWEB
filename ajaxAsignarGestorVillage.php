<?php
// 📁 Ajax/ajaxAsignarGestorVillage.php
session_start();
require_once "../Config/sesion_ajax.php";
require_once "../Modelo/ModeloAsignarGestorVillage.php";

header('Content-Type: application/json; charset=utf-8');

$modelo = new ModeloAsignarGestorVillage();
$accion = $_POST['accion'] ?? '';

try {
    switch ($accion) {
        case 'listar_villages':
            echo json_encode($modelo->obtenerVillagesAsignados(intval($_POST['gestor_id'] ?? 0)));
            break;

        case 'listar_gestores':
            echo json_encode($modelo->obtenerGestoresDeVillage(intval($_POST['village_id'] ?? 0)));
            break;

        case 'listar_gestores_global':
            echo json_encode($modelo->listarGestoresGlobal());
            break;

        case 'asignar':
            $gestor_id = intval($_POST['gestor_id'] ?? 0);
            $village_id = intval($_POST['village_id'] ?? 0);
            $asignado_por = $_SESSION['usu'] ?? 'sistema';
            if ($gestor_id <= 0 || $village_id <= 0) {
                echo json_encode(['status' => 'error', 'message' => 'Datos inválidos.']); break;
            }
            echo json_encode([
                'status' => $modelo->asignarGestor($gestor_id, $village_id, $asignado_por) ? 'success' : 'error',
                'message' => $modelo ? 'Gestor asignado correctamente.' : 'No se pudo asignar el gestor.'
            ]);
            break;

        case 'asignar_masivo':
            $gestor_id = intval($_POST['gestor_id'] ?? 0);
            $village_ids = $_POST['village_ids'] ?? '';
            $asignado_por = $_SESSION['usu'] ?? 'sistema';
            if ($gestor_id <= 0 || empty($village_ids)) {
                echo json_encode(['status' => 'error', 'message' => 'Datos incompletos.']); break;
            }
            $villageArray = array_filter(array_map('intval', explode(',', $village_ids)));
            $exito = $modelo->asignarGestorMasivo($gestor_id, $villageArray, $asignado_por);
            echo json_encode([
                'status' => $exito ? 'success' : 'error',
                'message' => $exito
                    ? 'Gestor asignado a ' . count($villageArray) . ' villages correctamente.'
                    : 'No se pudo completar la asignación masiva.'
            ]);
            break;

        case 'eliminar':
            $gestor_id = intval($_POST['gestor_id'] ?? 0);
            $village_id = intval($_POST['village_id'] ?? 0);
            if ($gestor_id <= 0 || $village_id <= 0) {
                echo json_encode(['status' => 'error', 'message' => 'Datos inválidos.']); break;
            }
            echo json_encode([
                'status' => $modelo->eliminarGestor($gestor_id, $village_id) ? 'success' : 'error',
                'message' => 'Gestor eliminado correctamente.'
            ]);
            break;

        case 'crear_village':
            $nombre = trim($_POST['nombre'] ?? '');
            if ($nombre === '') {
                echo json_encode(['status' => 'error', 'message' => 'El nombre del village es obligatorio.']); break;
            }
            echo json_encode([
                'status' => $modelo->crearVillage($nombre) ? 'success' : 'error',
                'message' => 'Village creado correctamente.'
            ]);
            break;

        case 'crear_camel_village':
            $village_id = intval($_POST['village_id'] ?? 0);
            $camel_village = trim($_POST['camel_village'] ?? '');
            $camel_id = trim($_POST['camel_id'] ?? '');
            if ($village_id <= 0 || $camel_id === '') {
                echo json_encode(['status' => 'error', 'message' => 'Datos insuficientes.']); break;
            }
            echo json_encode([
                'status' => $modelo->crearCamelVillage($village_id, $camel_village, $camel_id) ? 'success' : 'error',
                'message' => 'Camel Village creado correctamente.'
            ]);
            break;

        case 'crear_village_con_camel':
            $nombre = trim($_POST['nombre'] ?? '');
            $camel_village = trim($_POST['camel_village'] ?? '');
            $camel_id = trim($_POST['camel_id'] ?? '');
            if ($nombre === '' || $camel_id === '') {
                echo json_encode(['status' => 'error', 'message' => 'Datos insuficientes.']); break;
            }
            echo json_encode([
                'status' => $modelo->crearVillageConCamel($nombre, $camel_village, $camel_id) ? 'success' : 'error',
                'message' => 'Village y Camel creados correctamente.'
            ]);
            break;

        case 'editar_village':
            $id = intval($_POST['id'] ?? 0);
            $nombre = trim($_POST['nombre'] ?? '');
            if ($id <= 0 || $nombre === '') {
                echo json_encode(['status' => 'error', 'message' => 'Datos inválidos.']); break;
            }
            echo json_encode([
                'status' => $modelo->editarVillage($id, $nombre) ? 'success' : 'error',
                'message' => 'Village actualizado correctamente.'
            ]);
            break;

        case 'editar_camel_village':
            $village_id = intval($_POST['village_id'] ?? 0);
            $camel_id_original = trim($_POST['camel_id_original'] ?? '');
            $nuevo_camel_village = trim($_POST['camel_village'] ?? '');
            $nuevo_camel_id = trim($_POST['camel_id'] ?? '');
            if ($village_id <= 0 || $camel_id_original === '') {
                echo json_encode(['status' => 'error', 'message' => 'Datos inválidos.']); break;
            }
            echo json_encode([
                'status' => $modelo->editarCamelVillage($village_id, $camel_id_original, $nuevo_camel_village, $nuevo_camel_id) ? 'success' : 'error',
                'message' => 'Camel Village actualizado correctamente.'
            ]);
            break;

        case 'eliminar_camel_village':
            $village_id = intval($_POST['village_id'] ?? 0);
            $camel_id = trim($_POST['camel_id'] ?? '');
            if ($village_id <= 0 || $camel_id === '') {
                echo json_encode(['status' => 'error', 'message' => 'Datos inválidos.']); break;
            }
            echo json_encode([
                'status' => $modelo->eliminarCamelVillage($village_id, $camel_id) ? 'success' : 'error',
                'message' => 'Camel Village eliminado correctamente.'
            ]);
            break;

        case 'eliminar_village':
            $village_id = intval($_POST['village_id'] ?? 0);
            if ($village_id <= 0) {
                echo json_encode(['status' => 'error', 'message' => 'Datos inválidos.']); break;
            }
            echo json_encode([
                'status' => $modelo->eliminarVillage($village_id) ? 'success' : 'error',
                'message' => 'Village eliminado correctamente.'
            ]);
            break;

        default:
            echo json_encode(['status' => 'error', 'message' => 'Acción no válida']);
            break;
    }
} catch (Exception $e) {
    error_log("Error en ajaxAsignarGestorVillage: " . $e->getMessage());
    echo json_encode(['status' => 'error', 'message' => 'Error interno en el servidor.']);
}
