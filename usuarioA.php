<?php
// ✅ Iniciar sesión si aún no está activa
if (session_status() === PHP_SESSION_NONE) session_start();

// ✅ Verificar sesión activa
if (empty($_SESSION['usu'])) {
    http_response_code(403); // Importante para manejo en JS
    echo "❌ Sesión expirada. Por favor vuelve a iniciar sesión.";
    exit;
}

// ✅ Mostrar errores en desarrollo
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require '../Modelo/usuarioM.php';

class GestorController {
    private $gestorModel;

    public function __construct() {
        $this->gestorModel = new GestorModel();
    }

    public function mostrarUsuarios() {
        return $this->gestorModel->obtenerUsuarios();
    }

    public function insertarUsuario($cedula, $nombreCompleto, $correoElectronico, $contrasena) {
        return $this->gestorModel->insertarUsuario($cedula, $nombreCompleto, $correoElectronico, $contrasena)
            ? "✅ Usuario agregado correctamente."
            : "❌ Error al agregar el usuario.";
    }

    public function actualizarUsuario($cedula, $nombreCompleto, $correoElectronico, $contrasena) {
        return $this->gestorModel->actualizarUsuario($cedula, $nombreCompleto, $correoElectronico, $contrasena)
            ? "✅ Usuario actualizado correctamente."
            : "❌ Error al actualizar el usuario.";
    }

    public function eliminarUsuario($cedula) {
        return $this->gestorModel->eliminarUsuario($cedula)
            ? "✅ Usuario eliminado correctamente."
            : "❌ Error al eliminar el usuario.";
    }

    public function obtenerUsuarioPorCedula($cedula) {
        return $this->gestorModel->obtenerUsuarioPorCedula($cedula);
    }
}

// ✅ Ruteo por acción
if (isset($_POST['accion']) || isset($_GET['accion'])) {
    $controller = new GestorController();
    $accion = $_POST['accion'] ?? $_GET['accion'];

    switch ($accion) {
        case 'insertar':
            $cedula = $_POST['cedula'];
            $usuarioExistente = $controller->obtenerUsuarioPorCedula($cedula);

            if ($usuarioExistente) {
                echo "❌ Ya existe un usuario con esa cédula.";
            } else {
                echo $controller->insertarUsuario(
                    $_POST['cedula'],
                    $_POST['nombre_completo'],
                    $_POST['correo_electronico'],
                    $_POST['contrasena']
                );
            }
            break;

        case 'actualizar':
            echo $controller->actualizarUsuario(
                $_POST['cedula'],
                $_POST['nombre_completo'],
                $_POST['correo_electronico'],
                $_POST['contrasena']
            );
            break;

        case 'eliminar':
            echo $controller->eliminarUsuario($_GET['cedula']);
            break;

        case 'mostrar':
            header('Content-Type: application/json');
            echo json_encode($controller->mostrarUsuarios());
            break;

        case 'obtenerPorCedula':
            $usuario = $controller->obtenerUsuarioPorCedula($_GET['cedula']);
            header('Content-Type: application/json');
            echo json_encode($usuario ?: ['error' => 'Usuario no encontrado']);
            break;

        default:
            echo 'Acción no válida.';
            break;
    }
} else {
    echo 'No se recibió ninguna acción.';
}
