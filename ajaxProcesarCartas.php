<?php
session_start();
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// ✅ CSRF (solo afecta a POST)
require_once "../Utils/csrf_helper.php";
validar_csrf();

require_once "../Modelo/ModeloProcesarCartas.php";

$gestion   = new ModeloProcesarCartas();
$accion    = $_GET["accion"] ?? ($_POST["accion"] ?? '');
$id_gestor = (int)($_SESSION['usu'] ?? 0);
$esAdmin   = $gestion->esAdmin($id_gestor);

switch ($accion) {

    case 'debugEstado':
        header('Content-Type: application/json; charset=utf-8');
        $ver      = $_POST['ver'] ?? $_GET['ver'] ?? '';
        $idFiltro = ($esAdmin && $ver === 'all') ? 0 : $id_gestor;
        echo json_encode([
            "session_ok" => isset($_SESSION['usu']),
            "session_usu" => $id_gestor,
            "esAdmin" => $esAdmin,
            "ver_param" => $ver,
            "idFiltro_que_se_envia_a_los_SP" => $idFiltro
        ]);
        exit;

    // ============================================================
    // ✅ COMPROBAR SI ES ADMINISTRADOR
    // ============================================================
    case 'esAdmin':
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([ "esAdmin" => $esAdmin ]);
        break;

    // ============================================================
    // ✅ LISTAR RESUMEN POR GESTOR (ADMIN/NORMAL)
    // ============================================================
    case 'listarResumenPorGestor':
        $ver      = $_POST['ver'] ?? $_GET['ver'] ?? '';
        $idFiltro = ($esAdmin && $ver === 'all') ? 0 : $id_gestor;
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($gestion->listarResumenPorGestor((int)$idFiltro));
        break;

    // ============================================================
    // ✅ LISTAR CARTAS POR GESTOR (ADMIN/NORMAL)
    // ============================================================
    case 'listarCartasPorGestor':
        $tipoCarta = (int)($_POST['tipoCarta'] ?? 0);
        $ver       = $_POST['ver'] ?? $_GET['ver'] ?? '';
        $idFiltro  = ($esAdmin && $ver === 'all') ? 0 : $id_gestor;
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($gestion->listarCartasPorGestor($tipoCarta, (int)$idFiltro));
        break;

    // ============================================================
    // ✅ OBTENER OBSERVACIONES
    // ============================================================
    case 'obtenerObservaciones':
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($gestion->obtenerObservaciones());
        break;

    // ============================================================
    // ✅ GUARDAR ENVÍO (individual)
    // ============================================================
    case 'guardarEnvio':
        $datos = [
            'codigo_mcs' => $_POST['codigo_mcs'] ?? '',
            'fecha_envio' => $_POST['fecha_envio'] ?? '',
            'punto_focal' => $_POST['punto_focal'] ?? '',
            'observaciones' => $_POST['observaciones'] ?? '',
            'observacionPromotor' => $_POST['observacionPromotor'] ?? ''
        ];
        $status = $gestion->guardarEnvio($datos);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            "status" => $status ? "success" : "error",
            "message" => $status ? "Envío registrado correctamente" : "Error al registrar el envío"
        ]);
        break;

    // ============================================================
    // ✅ DESCARGAR TODAS LAS CARTAS (CSV)
    // ============================================================
    case 'descargarTodas':
        while (ob_get_level()) { ob_end_clean(); }

        $ver      = $_GET['ver'] ?? ''; // se abre por GET (window.open)
        $idFiltro = ($esAdmin && $ver === 'all') ? 0 : $id_gestor;

        $data = $gestion->obtenerTodasLasCartas((int)$idFiltro);

        header("Content-Type: text/csv; charset=utf-8");
        header("Content-Disposition: attachment; filename=cartas_todas_procesar.csv");

        echo "VILLAGE;CHILD NUMBER;NOMBRES;MCS;DFC AMOUNT;TIPO CARTA;FECHA RECEPCION;DIAS TRANSCURRIDOS\n";
        foreach ($data as $row) {
            echo "{$row['village']};"
               . "{$row['child_number']};"
               . "{$row['nombres']};"
               . "{$row['mcs']};"
               . "{$row['dfc_amount']};"
               . "{$row['tipo_carta']};"
               . "{$row['fecha_recepcion']};"
               . "{$row['dias_transcurridos']}\n";
        }
        exit;

    // ============================================================
    // ✅ MARCAR LISTAS PARA ENVÍO (individual)
    // ============================================================
    case 'marcarListaEnvio':
        $codigo_mcs    = $_POST['codigo_mcs'] ?? '';
        $obsPromotor   = $_POST['observacionPromotor'] ?? '';
        $observaciones = $_POST['observaciones'] ?? '';
        $tipo_envio    = $_POST['tipo_envio'] ?? 'DIGITAL';

        header('Content-Type: application/json; charset=utf-8');
        if (!$codigo_mcs || !$obsPromotor || !$tipo_envio) {
            echo json_encode(["status" => "error", "message" => "Faltan datos"]);
            break;
        }

        $status = $gestion->marcarListaEnvio($codigo_mcs, $obsPromotor, $observaciones, $tipo_envio);
        echo json_encode([
            "status" => $status ? "success" : "error",
            "message" => $status ? "Carta marcada como lista para envío" : "Error al marcar la carta"
        ]);
        break;

    // ============================================================
    // ✅ MARCAR LISTAS PARA ENVÍO (BATCH)
    // ============================================================
    case 'marcarListaEnvioBatch':
        $payload = $_POST['items'] ?? '[]';
        $items   = is_string($payload) ? json_decode($payload, true) : $payload;

        header('Content-Type: application/json; charset=utf-8');
        if (!is_array($items) || empty($items)) {
            echo json_encode(["status" => "error", "message" => "Sin datos para procesar"]);
            break;
        }

        $total = count($items);
        $ok = 0;
        $detalle = [];

        foreach ($items as $i) {
            $codigo_mcs    = $i['codigo_mcs'] ?? '';
            $obsPromotor   = $i['observacionPromotor'] ?? '';
            $observaciones = $i['observaciones'] ?? '';
            $tipo_envio    = $i['tipo_envio'] ?? 'DIGITAL';

            if (!$codigo_mcs || !$obsPromotor || !$tipo_envio) {
                $detalle[] = [ 'codigo_mcs' => $codigo_mcs, 'status' => 'error', 'message' => 'Faltan datos' ];
                continue;
            }

            $status = $gestion->marcarListaEnvio($codigo_mcs, (int)$obsPromotor, $observaciones, $tipo_envio);
            if ($status) $ok++;
            $detalle[] = [ 'codigo_mcs' => $codigo_mcs, 'status' => $status ? 'success' : 'error' ];
        }

        echo json_encode([
            "status" => $ok > 0 ? "success" : "error",
            "ok" => $ok,
            "total" => $total,
            "detalle" => $detalle
        ]);
        break;

    // ============================================================
    // ✅ CREAR GRUPO MÚLTIPLE
    // ============================================================
    case 'crearGrupoMultiple':
        $codigo_ref = $_POST['codigo_mcs_ref'] ?? '';
        $cartas     = $_POST['cartas'] ?? [];
        $usuario_id = $id_gestor;

        header('Content-Type: application/json; charset=utf-8');
        if (!$codigo_ref || !is_array($cartas) || count($cartas) < 2) {
            echo json_encode([
                "status" => "error",
                "message" => "Debe especificar un código de referencia y al menos 2 cartas"
            ]);
            break;
        }

        $ok = $gestion->crearGrupoMultiple($codigo_ref, $cartas, $usuario_id);
        echo json_encode([
            "status" => $ok ? "success" : "error",
            "message" => $ok ? "Grupo múltiple creado correctamente" : "No se pudo crear el grupo múltiple"
        ]);
        break;

    default:
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(["status" => false, "message" => "Acción no válida"]);
        break;
}
