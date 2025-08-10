<?php
session_start();
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);

require_once "../Config/conexion.php";
require_once "../Modelo/ModeloReportarCartasLista.php";
require_once __DIR__ . '/../Public/vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

$accion = $_POST["accion"] ?? $_GET["accion"] ?? '';
$modelo = new ModeloReportarCartasLista();

/**
 * Verifica si el usuario es administrador
 */
function esAdministrador($usuario_id, $conexion)
{
    $sql = "SELECT COUNT(*) as cantidad
            FROM permisos p
            JOIN vistas v ON p.vista_id = v.id
            JOIN gestor_rol gr ON p.rol_id = gr.rol_id
            WHERE gr.gestor_id = ? AND v.archivo = 'hojaRuta.php'";
    $stmt = $conexion->prepare($sql);
    $stmt->bind_param("i", $usuario_id);
    $stmt->execute();
    $resultado = $stmt->get_result()->fetch_assoc();
    return $resultado['cantidad'] > 0;
}

switch ($accion) {

    /** ============================
     *  LISTAR CARTAS EN ESTADO LISTA
     *  ============================ */
    case 'listarCartasLista':
        $tipoCarta = $_POST['tipoCarta'] ?? null;
        $usuario_id = $_SESSION['usu'] ?? null;

        $conexion = Fn_getConnect();
        $esAdmin = esAdministrador($usuario_id, $conexion);

        // Si no es admin, filtra por el usuario logueado
        $filtro_usuario_id = $esAdmin ? null : $usuario_id;

        $datos = $modelo->obtenerCartasLista($tipoCarta, $filtro_usuario_id);
        echo json_encode($datos);
        break;

    /** ============================
     *  LISTAR USUARIOS FILTRO
     *  ============================ */
    case 'listarUsuarios':
        $usuarios = $modelo->listarUsuarios();
        echo json_encode($usuarios);
        break;

    /** ============================
     *  DEVOLVER CARTA A PENDIENTE
     *  ============================ */
    case 'devolverCarta':
        $codigo_mcs = $_POST['codigo_mcs'] ?? null;

        if ($codigo_mcs) {
            $conexion = Fn_getConnect();
            $stmt = $conexion->prepare("
                UPDATE carta 
                   SET estado_envio = 'pendiente',
                       tipo_envio = NULL,
                       observacionPromotor = NULL
                 WHERE codigo_mcs = ?
            ");
            $stmt->bind_param("s", $codigo_mcs);
            $stmt->execute();

            if ($stmt->affected_rows > 0) {
                echo json_encode(["status" => "ok"]);
            } else {
                echo json_encode(["status" => "error", "message" => "No se afectó ninguna fila"]);
            }
        } else {
            echo json_encode(["status" => "error", "message" => "Código MCS inválido"]);
        }
        break;

    /** ============================
     *  DESCARGAR EXCEL
     *  ============================ */
    case 'descargarExcel':
        $tipoCarta = $_GET['tipoCarta'] ?? '';
        $usuario_id = $_SESSION['usu'] ?? null;

        $conexion = Fn_getConnect();
        $esAdmin = esAdministrador($usuario_id, $conexion);
        $filtro_usuario_id = $esAdmin ? null : $usuario_id;

        $cartas = $modelo->obtenerCartasLista($tipoCarta, $filtro_usuario_id);

        $spreadsheet = new Spreadsheet();
        $spreadsheet->getDefaultStyle()->getFont()->setName('Arial')->setSize(10);
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle("Cartas Lista");

        $tipos = ['PRESENTACION', 'AGRADECIMIENTO', 'CONTESTACION', 'INICIADA'];
        $fila = 1;

        foreach ($tipos as $tipo) {
            $grupo = array_filter($cartas, fn($c) => strtoupper($c['tipo_carta']) === $tipo);
            if (empty($grupo)) continue;

            $sheet->setCellValue("A$fila", "TIPO: $tipo");
            $sheet->mergeCells("A$fila:E$fila");
            $sheet->getStyle("A$fila")->getFont()->setBold(true);
            $fila++;

            $sheet->fromArray(
                ['VILLAGE', 'MCS', 'REVISION CORRESP. PROMOTORES GESTORES', 'TIPO ENVIO', 'NOMBRES', 'TIPO CARTA'],
                null,
                "A$fila"
            );
            $sheet->getStyle("A$fila:F$fila")->getFont()->setBold(true);
            $fila++;

            foreach ($grupo as $carta) {
                $sheet->setCellValue("A$fila", $carta['village']);
                $sheet->setCellValue("B$fila", $carta['codigo_mcs']);
                $sheet->setCellValue("C$fila", $carta['observacion_promotor']);
                $sheet->setCellValue("D$fila", $carta['tipo_envio']);
                $sheet->setCellValue("E$fila", $carta['nombres']);
                $sheet->setCellValue("F$fila", $carta['tipo_carta']);
                $fila++;
            }

            $fila += 2;
        }

        foreach (range('A', 'F') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $fileName = "CartasLista_" . date('Ymd_His') . ".xlsx";
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header("Content-Disposition: attachment; filename=\"$fileName\"");
        header('Cache-Control: max-age=0');

        $writer = new Xlsx($spreadsheet);
        $writer->save('php://output');
        exit;

    /** ============================
     *  ACCIÓN NO VÁLIDA
     *  ============================ */
    default:
        echo json_encode(["status" => "error", "message" => "Acción no válida"]);
        break;
}
