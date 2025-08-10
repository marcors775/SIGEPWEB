<?php
require_once '../Modelo/CasosM.php';
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Asegúrate de que se esté utilizando $_POST en lugar de $_GET cuando corresponda
$accion = isset($_POST['accion']) ? $_POST['accion'] : ''; // Cambié $_GET por $_POST
$modelo = new CasosModelo();

switch ($accion) {
    case 'buscarNino':
        $numeroNiño = isset($_POST['numeroNiño']) ? $_POST['numeroNiño'] : '';  // Corrected here
        echo json_encode($modelo->buscarNino($numeroNiño));
        break;

    case 'obtenerCasos':
        echo json_encode($modelo->obtenerCasos());
        break;
    case 'obtenerGestores':
        echo json_encode($modelo->obtenerGestores());
        break;

    case 'obtenerAldeasPorGestor':
        $idGestor = isset($_POST['idGestor']) ? $_POST['idGestor'] : '';
        echo json_encode($modelo->obtenerAldeasPorGestor($idGestor));
        break;

        case 'obtenerNinosPorAldea':
            $aldea = isset($_POST['aldea']) ? $_POST['aldea'] : '';
            $idGestor = isset($_POST['idGestor']) ? $_POST['idGestor'] : ''; // Capturar el gestor
            echo json_encode($modelo->obtenerNinosPorAldea($aldea, $idGestor));
            break;


    case 'actualizarCaso':
        $numeroNino = isset($_POST['numeroNino']) ? $_POST['numeroNino'] : null;
        $fechaEnvio = isset($_POST['fechaEnvio']) ? $_POST['fechaEnvio'] : null;
        $causasRetraso = isset($_POST['causasRetraso']) ? $_POST['causasRetraso'] : null;
        $estado = isset($_POST['estado']) ? $_POST['estado'] : null;
        echo json_encode($modelo->actualizarCaso($numeroNino, $fechaEnvio, $causasRetraso, $estado));
        break;


    case 'insertarCaso':
        // Recibir los parámetros
        $numero_nino = isset($_POST['numeroNino']) ? $_POST['numeroNino'] : '';
        $asunto = isset($_POST['asunto']) ? $_POST['asunto'] : '';
        $fechaRecepcion = isset($_POST['fechaRecepcion']) ? $_POST['fechaRecepcion'] : '';

        // Llamar al método insertarCaso con los parámetros
        echo json_encode($modelo->insertarCaso($numero_nino, $asunto, $fechaRecepcion, '', '', '')); // De momento, los otros parámetros se dejan vacíos
        break;

    default:
        echo json_encode(['error' => 'Acción no definida']);
        break;
}
