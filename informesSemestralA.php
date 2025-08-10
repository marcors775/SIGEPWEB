<?php
require_once '../Modelo/informesSemestral.php';

// Controlador para manejar las solicitudes de informes semestrales
class SemestresController {
    
    // Método para obtener los informes semestrales
    public function obtenerInformeSemestral($semestre) {
        $informe = new IInformeSemestral(); // Instancia del modelo

        // Validar el formato del semestre (ejemplo: "2024-1", "2024-2")
        if (!preg_match('/^\d{4}-(1|2)$/', $semestre)) {
            echo json_encode(['error' => "Formato de semestre inválido: $semestre"]);
            return;
        }

        $resultado = $informe->obtenerInformeSemestral($semestre);

        // Verificar si hay datos o no
        if ($resultado) {
            echo json_encode($resultado, JSON_UNESCAPED_UNICODE); // Devolver los datos en formato JSON
        } else {
            echo json_encode(['error' => 'No se encontró información para el semestre seleccionado.']);
        }
    }

    // Método para obtener los semestres disponibles
    public function obtenerSemestres() {
        $informe = new IInformeSemestral(); // Instancia del modelo
        $resultado = $informe->obtenerSemestresDisponibles();

        // Verificar si hay semestres disponibles
        if ($resultado) {
            echo json_encode($resultado, JSON_UNESCAPED_UNICODE); // Devolver los datos en formato JSON
        } else {
            echo json_encode(['error' => 'No hay semestres disponibles.']);
        }
    }
}

// Comprobar la operación solicitada (op) y procesar la solicitud correspondiente
if (isset($_GET['op'])) {
    $op = $_GET['op'];
    $controller = new SemestresController();

    switch ($op) {
        case 'obtenerInformeSemestral':
            if (isset($_GET['semestre'])) {
                $semestre = $_GET['semestre'];
                $controller->obtenerInformeSemestral($semestre);
            } else {
                echo json_encode(['error' => 'Semestre no especificado.']);
            }
            break;

        case 'obtenerSemestres':
            $controller->obtenerSemestres();
            break;

        default:
            echo json_encode(['error' => 'Operación no válida.']);
            break;
    }
} else {
    echo json_encode(['error' => 'No se especificó una operación.']);
}
?>
