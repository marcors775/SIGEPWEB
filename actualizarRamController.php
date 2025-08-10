<?php
require_once "../Config/sesion_ajax.php";         // ✅ Protección de sesión Ajax
require_once "../Modelo/actualizarRamModel.php";  // ✅ Conservamos tu modelo

class NinoController {
    private $modelo;

    public function __construct() {
        $this->modelo = new NinoModel();
    }

    public function procesarSolicitud() {
        $action = $_POST['action'] ?? '';
        
        switch($action) {
            case 'obtener':
                $this->obtenerNinos();
                break;
            case 'actualizar':
                $this->actualizarNino();
                break;
            default:
                echo json_encode(['error' => 'Acción no válida']);
        }
    }

    private function obtenerNinos() {
        $id_gestor = $_SESSION['usu'] ?? null;

        if (!$id_gestor) {
            echo json_encode(['error' => 'Usuario no autenticado']);
            return;
        }

        $ninos = $this->modelo->obtenerNinos($id_gestor);
        echo json_encode($ninos);
    }

    private function actualizarNino() {
        // 🔁 Convertir nombre de aldea a village_id
        $village_id = null;
        if (!empty($_POST['village']) && $GLOBALS['conn']) {
            $stmt = $GLOBALS['conn']->prepare("SELECT id FROM village WHERE nombre = ?");
            $stmt->bind_param("s", $_POST['village']);
            $stmt->execute();
            $stmt->bind_result($village_id);
            $stmt->fetch();
            $stmt->close();
        }

        $datos = [
            'Child_Number' => $_POST['Child_Number'],
            'full_name' => $_POST['full_name'],
            'village_id' => $village_id, // 👈 nuevo campo normalizado
            'birthdate' => $_POST['birthdate'],
            'community_number' => $_POST['community_number'],
            'gender' => $_POST['gender'],
            'local_partner' => $_POST['local_partner'],
            'alliance_name' => $_POST['alliance_name'],
            'primary_contact_full_name' => $_POST['primary_contact_full_name']
        ];

        $resultado = $this->modelo->actualizarNino($datos);
        echo json_encode($resultado);
    }
}

$controller = new NinoController();
$controller->procesarSolicitud();