<?php
// 📁 Ajax/gestorNinoController.php

require_once "../Config/sesion_ajax.php";
require_once "../Modelo/gestorNinoModel.php";

header('Content-Type: application/json');

$modelo = new GestorNinoModel();
$accion = $_POST['accion'] ?? '';

switch ($accion) {

    // ✅ 1. Listar resumen de villages con cantidad de niños
    case 'listar_villages':
        $respuesta = $modelo->obtenerResumenVillages();
        echo json_encode(is_array($respuesta) ? $respuesta : []);
        break;

    // ✅ 2. Listar niños de un village específico
    case 'listar_ninos':
        $village_id = filter_input(INPUT_POST, 'village_id', FILTER_VALIDATE_INT);
        if (!$village_id) {
            echo json_encode([]);
            break;
        }
        $respuesta = $modelo->obtenerNinosPorVillage($village_id);
        echo json_encode(is_array($respuesta) ? $respuesta : []);
        break;

    // ✅ 3. Obtener gestores asignados a un niño
    case 'gestores_nino':
        $nino_id = filter_input(INPUT_POST, 'nino_id', FILTER_VALIDATE_INT);
        if (!$nino_id) {
            echo json_encode([]);
            break;
        }
        $respuesta = $modelo->obtenerGestoresDeNino($nino_id);
        echo json_encode(is_array($respuesta) ? $respuesta : []);
        break;

    // ✅ 4. Asignar gestor a un niño
    case 'asignar':
        $gestor_id = $_POST['gestor_id'] ?? '';
        $nino_id = filter_input(INPUT_POST, 'nino_id', FILTER_VALIDATE_INT);
        $asignado_por = $_SESSION['usu'] ?? 'sistema';

        if ($gestor_id && $nino_id) {
            $exito = $modelo->asignarGestorANino($gestor_id, $nino_id, $asignado_por);
            echo json_encode(['exito' => $exito]);
        } else {
            echo json_encode(['exito' => false, 'error' => 'Parámetros incompletos']);
        }
        break;

    // ✅ 5. Eliminar asignación de gestor a niño
    case 'eliminar':
        $gestor_id = $_POST['gestor_id'] ?? '';
        $nino_id = filter_input(INPUT_POST, 'nino_id', FILTER_VALIDATE_INT);

        if ($gestor_id && $nino_id) {
            $exito = $modelo->eliminarAsignacionGestorNino($gestor_id, $nino_id);
            echo json_encode(['exito' => $exito]);
        } else {
            echo json_encode(['exito' => false, 'error' => 'Parámetros incompletos']);
        }
        break;

    // ✅ 6. Listar gestores disponibles
    case 'listar_gestores':
        $respuesta = $modelo->obtenerGestoresDisponibles();
        echo json_encode(is_array($respuesta) ? $respuesta : []);
        break;

    // ✅ 7. Buscar niño por nombre o código
    case 'buscar_nino':
        $query = trim($_POST['query'] ?? '');
        if ($query === '') {
            echo json_encode([]);
            break;
        }
        $respuesta = $modelo->buscarNino($query);
        echo json_encode(is_array($respuesta) ? $respuesta : []);
        break;

    // ❌ Acción no reconocida
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Acción no válida']);
        break;
}