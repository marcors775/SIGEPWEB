<?php
require_once '../Modelo/AvisosEmbarazoModel.php';
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Asegúrate de que se esté utilizando $_POST en lugar de $_GET cuando corresponda
$accion = isset($_POST['accion']) ? $_POST['accion'] : '';
$modelo = new AvisosEmbarazoModelo();

switch ($accion) {
    case 'buscarNino':
        $numeroNiño = isset($_POST['numeroNiño']) ? $_POST['numeroNiño'] : '';
        echo json_encode($modelo->buscarNino($numeroNiño));
        break;
        
    case 'obtenerAvisos':
        echo json_encode($modelo->obtenerAvisos());
        break;
        
    case 'obtenerGestores':
        echo json_encode($modelo->obtenerGestores());
        break;
        
    case 'obtenerPlanesFuturos':
        echo json_encode($modelo->obtenerPlanesFuturos());
        break;
        
    case 'obtenerAldeasPorGestor':
        $idGestor = isset($_POST['idGestor']) ? $_POST['idGestor'] : '';
        echo json_encode($modelo->obtenerAldeasPorGestor($idGestor));
        break;
        
    case 'obtenerNinosPorAldea':
        $aldea = isset($_POST['aldea']) ? $_POST['aldea'] : '';
        $idGestor = isset($_POST['idGestor']) ? $_POST['idGestor'] : '';
        echo json_encode($modelo->obtenerNinosPorAldea($aldea, $idGestor));
        break;
        
    case 'actualizarAviso':
        $numeroNino = isset($_POST['numeroNino']) ? $_POST['numeroNino'] : '';
        $fechaCierre = isset($_POST['fechaCierre']) ? $_POST['fechaCierre'] : '';
        $observaciones = isset($_POST['observaciones']) ? $_POST['observaciones'] : '';
        echo json_encode($modelo->actualizarAviso($numeroNino, $fechaCierre, $observaciones));
        break;
        
    case 'insertarAviso':
        // Recibir los parámetros
        $numeroNino = isset($_POST['numeroNino']) ? $_POST['numeroNino'] : '';
        $tipoAviso = isset($_POST['tipoAviso']) ? $_POST['tipoAviso'] : '';
        $planesFuturos = isset($_POST['planesFuturos']) ? $_POST['planesFuturos'] : '';
        $fechaNotificacion = isset($_POST['fechaNotificacion']) ? $_POST['fechaNotificacion'] : '';
        
        // Llamar al método insertarAviso con los parámetros
        echo json_encode($modelo->insertarAviso($numeroNino, $tipoAviso, $planesFuturos, $fechaNotificacion));
        break;
        
    default:
        echo json_encode(['error' => 'Acción no definida']);
        break;
}
?>