<?php
require_once '../Modelo/parametrosM.php';
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $accion = isset($_POST['accion']) ? $_POST['accion'] : ''; // Comprobar si la acción está definida
    $parametros = new Parametros();

    switch ($accion) {
        // Insertar Plan Futuro
        case 'insertarPlanFuturo':
            $descripcion = isset($_POST['descripcion']) ? trim($_POST['descripcion']) : '';
            $detalle = isset($_POST['detalle']) ? trim($_POST['detalle']) : '';
            if (empty($descripcion) || empty($detalle)) {
                echo json_encode(['error' => true, 'message' => 'Todos los campos son obligatorios.']);
                break;
            }
            try {
                $parametros->insertarPlanFuturo($descripcion, $detalle);
                echo json_encode(['error' => false, 'message' => 'Plan Futuro insertado exitosamente']);
            } catch (Exception $e) {
                echo json_encode(['error' => true, 'message' => 'Error al insertar el Plan Futuro: ' . $e->getMessage()]);
            }
            break;

        // Insertar Observación
        case 'insertarObservacion':
            $descripcion = isset($_POST['descripcion']) ? $_POST['descripcion'] : '';
            $detalle = isset($_POST['detalle']) ? $_POST['detalle'] : '';
            $observacionesCarta = isset($_POST['observacionesCarta']) ? $_POST['observacionesCarta'] : '';
            $parametros->insertarObservacion($descripcion, $detalle, $observacionesCarta);
            echo json_encode(['message' => 'Observación insertada exitosamente']);
            break;

        // Insertar Motivo Devolución
        case 'insertarMotivoDevolucion':
            $descripcion = isset($_POST['descripcion']) ? $_POST['descripcion'] : '';
            $detalle = isset($_POST['detalle']) ? $_POST['detalle'] : '';
            if (empty($descripcion) || empty($detalle)) {
                echo json_encode(['error' => true, 'message' => 'Todos los campos son obligatorios.']);
                break;
            }
            try {
                $parametros->insertarMotivoDevolucion($descripcion, $detalle);
                echo json_encode(['error' => false, 'message' => 'Motivo de Devolución insertado exitosamente']);
            } catch (Exception $e) {
                echo json_encode(['error' => true, 'message' => 'Error al insertar el Motivo de Devolución: ' . $e->getMessage()]);
            }
            break;

        // Actualizar Plan Futuro
        case 'actualizarPlanFuturo':
            $idPlanFuturo = isset($_POST['idPlanFuturo']) ? $_POST['idPlanFuturo'] : '';
            $descripcion = isset($_POST['descripcion']) ? $_POST['descripcion'] : '';
            $detalle = isset($_POST['detalle']) ? $_POST['detalle'] : '';
            $parametros->actualizarPlanFuturo($idPlanFuturo, $descripcion, $detalle);
            echo json_encode(['message' => 'Plan Futuro actualizado exitosamente']);
            break;

        // Actualizar Observación
        case 'actualizarObservacion':
            $idObservacion = isset($_POST['idObservaciones']) ? $_POST['idObservaciones'] : '';
            $descripcion = isset($_POST['descripcion']) ? $_POST['descripcion'] : '';
            $detalle = isset($_POST['detalle']) ? $_POST['detalle'] : '';
            $observacionesCarta = isset($_POST['observacionesCarta']) ? $_POST['observacionesCarta'] : '';
            $parametros->actualizarObservacion($idObservacion, $descripcion, $detalle, $observacionesCarta);
            echo json_encode(['message' => 'Observación actualizada exitosamente']);
            break;

        // Actualizar Motivo Devolución
        case 'actualizarMotivoDevolucion':
            $idDevolucion = isset($_POST['idDevolucion']) ? $_POST['idDevolucion'] : '';
            $descripcion = isset($_POST['descripcion']) ? $_POST['descripcion'] : '';
            $detalle = isset($_POST['detalle']) ? $_POST['detalle'] : '';
            $parametros->actualizarMotivoDevolucion($idDevolucion, $descripcion, $detalle);
            echo json_encode(['message' => 'Motivo de Devolución actualizado exitosamente']);
            break;

        // Eliminar Plan Futuro
        case 'eliminarPlanFuturo':
            $idPlanFuturo = isset($_POST['idPlanFuturo']) ? $_POST['idPlanFuturo'] : '';
            $parametros->eliminarPlanFuturo($idPlanFuturo);
            echo json_encode(['message' => 'Plan Futuro eliminado exitosamente']);
            break;

        // Eliminar Observación
        case 'eliminarObservacion':
            $idObservaciones = isset($_POST['idObservaciones']) ? $_POST['idObservaciones'] : '';
            $parametros->eliminarObservacion($idObservaciones);
            echo json_encode(['message' => 'Observación eliminada exitosamente']);
            break;

        // Eliminar Motivo Devolución
        case 'eliminarMotivoDevolucion':
            $idDevolucion = isset($_POST['idDevolucion']) ? $_POST['idDevolucion'] : '';
            $parametros->eliminarMotivoDevolucion($idDevolucion);
            echo json_encode(['message' => 'Motivo de Devolución eliminado exitosamente']);
            break;

        // Mostrar todos los Planes Futuros
        case 'mostrarPlanFuturo':
            $planesFuturos = $parametros->mostrarPlanFuturo();
            $result = [];
            while ($row = $planesFuturos->fetch_assoc()) {
                $result[] = $row;
            }
            echo json_encode($result);
            break;

        // Mostrar todas las Observaciones
        case 'mostrarObservaciones':
            $observaciones = $parametros->mostrarObservaciones();
            $result = [];
            while ($row = $observaciones->fetch_assoc()) {
                $result[] = $row;
            }
            echo json_encode($result);
            break;

        // Mostrar todos los Motivos de Devolución
        case 'mostrarMotivosDevolucion':
            $motivosDevolucion = $parametros->mostrarMotivosDevolucion();
            $result = [];
            while ($row = $motivosDevolucion->fetch_assoc()) {
                $result[] = $row;
            }
            echo json_encode($result);
            break;

        default:
            echo json_encode(['message' => 'Acción no reconocida']);
            break;
    }
}
?>
