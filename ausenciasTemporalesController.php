<?php
require_once '../Modelo/ausenciasTemporalesModel.php'; // Incluye el modelo de ausencias temporales
ini_set('display_errors', 1); // Configura la visualización de errores
error_reporting(E_ALL); // Reporta todos los errores

// Obtiene la acción desde la solicitud POST
$accion = isset($_POST['accion']) ? $_POST['accion'] : '';
$modelo = new AusenciasTemporalesModelo(); // Crea una instancia del modelo

// Ejecuta diferentes acciones basadas en el valor de 'accion'
switch ($accion) {
    case 'obtenerGestores':
        // Obtiene y devuelve la lista de gestores
        echo json_encode($modelo->obtenerGestores());
        break;
        
    case 'obtenerVerificadores':
        // Obtiene y devuelve la lista de verificadores
        echo json_encode($modelo->obtenerVerificadores());
        break;
        
    case 'obtenerAldeasPorGestor':
        // Obtiene y devuelve la lista de aldeas por gestor
        $idGestor = isset($_POST['idGestor']) ? $_POST['idGestor'] : '';
        echo json_encode($modelo->obtenerAldeasPorGestor($idGestor));
        break;
        
    case 'obtenerNinosPorAldea':
        // Obtiene y devuelve la lista de niños por aldea y gestor
        $aldea = isset($_POST['aldea']) ? $_POST['aldea'] : '';
        $idGestor = isset($_POST['idGestor']) ? $_POST['idGestor'] : '';
        echo json_encode($modelo->obtenerNinosPorAldea($aldea, $idGestor));
        break;
        
    case 'insertarAusencia':
        // Inserta una nueva ausencia y devuelve el resultado
        $numeroNino = isset($_POST['numeroNino']) ? $_POST['numeroNino'] : '';
        $fechaNotificacion = isset($_POST['fechaNotificacion']) ? $_POST['fechaNotificacion'] : '';
        echo json_encode($modelo->insertarAusencia($numeroNino, $fechaNotificacion));
        break;
        
    case 'actualizarVerificacion':
        // Actualiza la verificación de una ausencia y devuelve el resultado
        $numeroNino = isset($_POST['numeroNino']) ? $_POST['numeroNino'] : '';
        $fechaVerificacion = isset($_POST['fechaVerificacion']) ? $_POST['fechaVerificacion'] : '';
        $metodoVerificacion = isset($_POST['metodoVerificacion']) ? $_POST['metodoVerificacion'] : '';
        $promotor = isset($_POST['promotor']) ? $_POST['promotor'] : '';
        echo json_encode($modelo->actualizarVerificacion($numeroNino, $fechaVerificacion, $metodoVerificacion, $promotor));
        break;
        
    case 'actualizarEstadoFinal':
        // Actualiza el estado final de una ausencia y devuelve el resultado
        $numeroNino = isset($_POST['numeroNino']) ? $_POST['numeroNino'] : '';
        $fechaEstado = isset($_POST['fechaEstado']) ? $_POST['fechaEstado'] : '';
        $estado = isset($_POST['estado']) ? $_POST['estado'] : '';
        echo json_encode($modelo->actualizarEstadoFinal($numeroNino, $fechaEstado, $estado));
        break;
        
    default:
        // Devuelve un error si la acción no está definida
        echo json_encode(['error' => 'Acción no definida']);
        break;
}
?>