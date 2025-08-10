<?php
require_once "../Modelo/informesAnual.php";

$informesModelo = new InformesAnualesModelo();

switch ($_GET["op"] ?? '') {
    case "obtenerAnios":
        // Obtener los años disponibles
        $anios = $informesModelo->obtenerAniosDisponibles();
        echo json_encode($anios);
        break;
        
    case "obtenerInformeAnualT":
        // Obtener el informe anual para un año específico
        $anio = $_GET["anio"] ?? null;

        if (!$anio || !is_numeric($anio)) {
            echo json_encode(["error" => "Año inválido o no proporcionado."]);
        } else {
            $informe = $informesModelo->obtenerInformeAnual($anio);
            echo json_encode($informe);
        }
        break;

    default:
        echo json_encode(["error" => "Operación no válida."]);
        break;
}
?>
