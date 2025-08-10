<?php
require_once "../Config/sesion_ajax.php";
require_once "../Modelo/onedrive_mantenimientoM.php";

global $conexion;

$op = $_GET['op'] ?? '';

switch ($op) {
  case 'listar_carpetas':
    echo json_encode(listarCarpetas($conexion));
    break;

  case 'obtener_carpeta':
    $id = $_GET['id'] ?? 0;
    echo json_encode(obtenerCarpetaPorId($conexion, $id));
    break;

  case 'actualizar_carpeta':
    $id = $_POST['id'] ?? 0;
    $descripcion = $_POST['descripcion'] ?? '';
    $estado = $_POST['estado'] ?? 1;

    $ok = actualizarCarpeta($conexion, $id, $descripcion, $estado);
    echo json_encode(['status' => $ok ? 'ok' : 'error']);
    break;

  case 'verificar_asociaciones':
    $id = $_GET['id'] ?? 0;
    echo json_encode(['asociado' => tieneAccesos($conexion, $id)]);
    break;

  case 'eliminar_carpeta':
    $id = $_POST['id'] ?? 0;

    if (tieneAccesos($conexion, $id)) {
      echo json_encode(['status' => 'error', 'error' => 'Tiene accesos asociados']);
    } else {
      $ok = eliminarCarpeta($conexion, $id);
      echo json_encode(['status' => $ok ? 'ok' : 'error']);
    }
    break;

  default:
    echo json_encode(['error' => 'Operación no válida']);
}