<?php
header('Content-Type: application/json');
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

include_once '../Config/sesion_ajax.php'; // Control de sesión
require_once '../Modelo/PlanificacionModelo.php';

file_put_contents("debug_post.log", print_r($_POST, true)); // Solo para desarrollo

$accion = $_POST['accion'] ?? '';

if (!isset($_SESSION['usu'])) {
  echo json_encode(["error" => "Sesión no iniciada o usuario no definido"]);
  exit;
}

switch ($accion) {
  case 'listar_usuario':
    try {
      $datos = PlanificacionModelo::listarPorGestor($_SESSION['usu']);
      echo json_encode($datos);
    } catch (Exception $e) {
      echo json_encode(['error' => 'Error interno', 'detalle' => $e->getMessage()]);
    }
    break;

  case 'listar_global':
      $fecha_inicio = $_POST['fecha_inicio'] ?? null;
      $fecha_fin = $_POST['fecha_fin'] ?? null;
      echo json_encode(PlanificacionModelo::listarGlobal($fecha_inicio, $fecha_fin));
      break;

  case 'registrar':
    $datos = $_POST;
    $datos['id_gestor'] = $_SESSION['usu'];
    echo json_encode(PlanificacionModelo::registrarActividad($datos));
    break;

  case 'editar':
    $datos = $_POST;
    echo json_encode(PlanificacionModelo::editarActividad($datos));
    break;

  case 'eliminar':
    $id = $_POST['id'];
    echo json_encode(PlanificacionModelo::eliminarActividad($id));
    break;

  default:
    echo json_encode(['error' => 'Acción no válida']);
    break;
}