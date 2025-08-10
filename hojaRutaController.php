<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
require_once "../Modelo/hojaRutaModel.php";

class HojaRutaController {
    private $modelo;
    
    public function __construct() {
        $this->modelo = new HojaRutaModel();
    }
    
    public function index($tipoApp = false) {
        return $this->modelo->getHojasRuta($tipoApp);
    }
    
    public function getCartasDigitales($hojaRuta) {
        return $this->modelo->getCartasPorHojaRuta($hojaRuta, false);
    }
    
    public function getCartasApp($hojaRuta) {
        return $this->modelo->getCartasPorHojaRuta($hojaRuta, true);
    }
    
    public function getTiposCartas($hojaRuta) {
        return $this->modelo->getTiposCartaPorHojaRuta($hojaRuta);
    }
    
    public function getAldeaCodigosMCS($hojaRuta) {
        return $this->modelo->getAldeasPorHojaRuta($hojaRuta);
    }
}

// API para manejo de solicitudes AJAX
if (isset($_GET['action'])) {
    $controller = new HojaRutaController();
    $action = $_GET['action'];
    
    header('Content-Type: application/json');
    
    switch ($action) {
        case 'getHojasRuta':
            $tipoApp = isset($_GET['tipoApp']) ? filter_var($_GET['tipoApp'], FILTER_VALIDATE_BOOLEAN) : false;
            echo json_encode($controller->index($tipoApp));
            break;
            
        case 'getCartasDigitales':
            if (isset($_GET['hojaRuta'])) {
                echo json_encode($controller->getCartasDigitales($_GET['hojaRuta']));
            }
            break;
            
        case 'getCartasApp':
            if (isset($_GET['hojaRuta'])) {
                echo json_encode($controller->getCartasApp($_GET['hojaRuta']));
            }
            break;
            
        case 'getTiposCartas':
            if (isset($_GET['hojaRuta'])) {
                echo json_encode($controller->getTiposCartas($_GET['hojaRuta']));
            }
            break;
            
        case 'getAldeaCodigosMCS':
            if (isset($_GET['hojaRuta'])) {
                echo json_encode($controller->getAldeaCodigosMCS($_GET['hojaRuta']));
            }
            break;
            
        default:
            echo json_encode(["error" => "Acción no válida"]);
            break;
    }
    
    exit;
}
?>