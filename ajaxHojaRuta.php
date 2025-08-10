<?php
// ✅ Producción: no mostrar errores en pantalla
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');

require_once "../Config/sesion_ajax.php";
require_once "../Modelo/ModeloHojaRuta.php";

// ✅ Usar solo el autoload de vendor
require_once __DIR__ . '/../Public/vendor/autoload.php';

use Dompdf\Dompdf;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;

$gestion = new ModeloHojaRuta();
$accion = $_GET["accion"] ?? ($_POST["accion"] ?? '');

function logGlobalHR($mensaje) {
    $logFile = __DIR__ . "/../Logs/hoja_ruta.log";
    $fecha = date("Y-m-d H:i:s");
    file_put_contents($logFile, "[$fecha] [ajaxHojaRuta] $mensaje\n", FILE_APPEND);
}

try {
    switch ($accion) {
        case 'listarCartasParaHojaRuta':
            $organizacion_id = $_POST['organizacion_id'] ?? 0;
            $datos = $gestion->listarCartasParaHojaRuta((int)$organizacion_id);
            logGlobalHR("Listando Cartas HR | Org_ID: $organizacion_id | Devueltas: " . count($datos));
            ob_clean();
            echo json_encode($datos);
            break;

        case 'crearHojaRuta':
            $numero_hr = $_POST['numero_hr'] ?? '';
            $fecha_envio = $_POST['fecha_envio'] ?? date('Y-m-d');
            $organizacion_id = $_POST['organizacion_id'] ?? 0;
            $creado_por = $_SESSION['usu'] ?? 0;

            logGlobalHR("DEBUG CREAR HR | Fecha recibida POST: " . $fecha_envio);

            if (!$numero_hr || !$organizacion_id) {
                ob_clean();
                echo json_encode(["status" => "error", "message" => "Datos incompletos"]);
                break;
            }

            $id_hr = $gestion->crearHojaRuta($numero_hr, $fecha_envio, (int)$organizacion_id, (int)$creado_por);
            logGlobalHR("Creación HR | Número: $numero_hr | Resultado ID: " . ($id_hr ?? 'NULL'));

            ob_clean();
            echo json_encode([
                "status" => $id_hr ? "success" : "error",
                "hoja_ruta_id" => $id_hr,
                "message" => $id_hr ? "Hoja de Ruta creada correctamente" : "Error al crear la Hoja de Ruta"
            ]);
            break;

        case 'asignarCartasAHojaRuta':
            $hoja_ruta_id = $_POST['hoja_ruta_id'] ?? 0;
            $cartas = $_POST['cartas'] ?? [];
            if (!is_array($cartas)) { $cartas = [$cartas]; }

            if (!$hoja_ruta_id || empty($cartas)) {
                ob_clean();
                echo json_encode(["status" => "error", "message" => "Faltan datos para asignar cartas"]);
                break;
            }

            $errores = 0;
            foreach ($cartas as $codigo_mcs) {
                if (!$gestion->asignarCartasAHojaRuta((int)$hoja_ruta_id, $codigo_mcs)) { $errores++; }
            }
            logGlobalHR("Asignación Cartas HR | HR_ID: $hoja_ruta_id | Total Cartas: " . count($cartas) . " | Errores: $errores");

            ob_clean();
            echo json_encode([
                "status" => $errores === 0 ? "success" : "warning",
                "message" => $errores === 0
                    ? "Cartas asignadas correctamente"
                    : "Algunas cartas no se pudieron asignar o ya estaban asignadas"
            ]);
            break;

        case 'listarHojasDeRuta':
            $organizacion_id = $_POST['organizacion_id'] ?? 0;
            $datos = $gestion->listarHojasDeRuta((int)$organizacion_id);
            logGlobalHR("Listando HR | Org_ID: $organizacion_id | Devueltas: " . count($datos));
            ob_clean();
            echo json_encode($datos);
            break;

        case 'obtenerSiguienteNumeroHR':
            $numero = $gestion->obtenerSiguienteNumeroHR();
            logGlobalHR("Siguiente HR consultado: $numero");
            ob_clean();
            echo json_encode(["numero_hr" => $numero]);
            break;

        case 'listarOrganizaciones':
            $datos = $gestion->listarOrganizaciones();
            logGlobalHR("Organizaciones devueltas: " . count($datos));
            ob_clean();
            echo json_encode($datos);
            break;

        case 'cerrarHojaRuta':
            $hoja_ruta_id = $_POST['hoja_ruta_id'] ?? 0;
            $usuario_id = $_SESSION['usu'] ?? 0;

            if (!$hoja_ruta_id) {
                ob_clean();
                echo json_encode(["status" => "error", "message" => "ID de Hoja de Ruta no válido"]);
                break;
            }

            $filas = $gestion->cerrarHojaRuta((int)$hoja_ruta_id, (int)$usuario_id);
            logGlobalHR("Cierre HR | HR_ID: $hoja_ruta_id | Filas afectadas: $filas");

            ob_clean();
            echo json_encode([
                "status" => $filas > 0 ? "success" : "warning",
                "message" => $filas > 0
                    ? "Hoja de Ruta cerrada correctamente"
                    : "La Hoja de Ruta ya estaba cerrada o no existe"
            ]);
            break;

case 'descargarHojaRuta':
    $hoja_ruta_id = $_GET['hoja_ruta_id'] ?? ($_POST['hoja_ruta_id'] ?? 0);
    $formato = strtoupper($_GET['formato'] ?? ($_POST['formato'] ?? 'EXCEL'));
    $datos = $gestion->obtenerCartasPorHojaRuta((int)$hoja_ruta_id);

    if (empty($datos)) {
        echo "No hay cartas en esta Hoja de Ruta";
        exit;
    }

    $organizacion_alias = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $datos[0]['organizacion'] ?? 'ORG'));
    $fecha_alias = !empty($datos[0]['fecha_envio'])
        ? date('d-m-Y', strtotime($datos[0]['fecha_envio']))
        : date('d-m-Y');
    $nombre_archivo = "HR{$hoja_ruta_id}-$organizacion_alias-$fecha_alias";

    $tipos_fijos = ['PRESENTACION', 'AGRADECIMIENTO', 'CONTESTACION', 'INICIADA'];

    // Agrupación por tipo_envio y tipo_carta
    $agrupado = [];
    foreach ($datos as $row) {
        $envio = strtoupper(trim($row['tipo_envio']));
        $tipo = strtoupper(str_replace(['Á','É','Í','Ó','Ú'], ['A','E','I','O','U'], trim($row['tipo_carta'])));
        if (!in_array($tipo, $tipos_fijos)) continue;
        $agrupado[$envio][$tipo][] = $row;
    }

    // Ordenar por village
    foreach ($agrupado as &$envio_data) {
        foreach ($envio_data as &$cartas) {
            usort($cartas, fn($a, $b) => strcmp($a['village'], $b['village']));
        }
    }

    // 🔶 Grupos múltiples por código MCS
    $grupos_multiples = $gestion->obtenerGruposMultiples(); // [['COD123','COD124'], ['COD200','COD201']]
    $colores_por_mcs = [];
    $palette = ['ffe599', 'c9daf8', 'd9ead3', 'fff2cc', 'fce5cd', 'e6b8af', 'd9d2e9', 'cfe2f3'];
    $index = 0;
    foreach ($grupos_multiples as $grupo) {
        $color = $palette[$index % count($palette)];
        foreach ($grupo as $mcs) {
            $colores_por_mcs[$mcs] = $color;
        }
        $index++;
    }

        if ($formato === 'EXCEL') {
            while (ob_get_level() > 0) ob_end_clean();
        
            // Agrupar y normalizar
            $agrupado = [];
            foreach ($datos as $row) {
                $envio = strtoupper(trim($row['tipo_envio'] ?? ''));
                $envio = str_replace(['Á','É','Í','Ó','Ú'], ['A','E','I','O','U'], $envio);
                $envio = preg_replace('/\\s+/', '', $envio);
        
                $tipo = strtoupper(trim($row['tipo_carta'] ?? ''));
                $tipo = str_replace(['Á','É','Í','Ó','Ú'], ['A','E','I','O','U'], $tipo);
                $tipo = preg_replace('/\\s+/', '', $tipo);
        
                if (!in_array($tipo, $tipos_fijos)) continue;
                $agrupado[$envio][$tipo][] = $row;
            }
        
            $spreadsheet = new Spreadsheet();
            $spreadsheet->getDefaultStyle()->getFont()->setName('Arial')->setSize(10);
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle("HOJA DE RUTA");
        
            $col_map = ['PRESENTACION' => 'A', 'AGRADECIMIENTO' => 'C', 'CONTESTACION' => 'E', 'INICIADA' => 'G'];
            $bloques = [
                'DIGITAL' => ['col_offset' => 0, 'color' => '99e0b1'],
                'APP' => ['col_offset' => 9, 'color' => '6e89a6']
            ];
        
            foreach ($bloques as $tipo_envio => $conf) {
                $offset = $conf['col_offset'];
                $start_col = chr(ord('A') + $offset);
                $end_col = chr(ord('H') + $offset);
        
                $sheet->mergeCells("$start_col" . "1:$end_col" . "1");
                $sheet->setCellValue("$start_col" . "1", "HOJA DE RUTA - $organizacion_alias ($tipo_envio)");
                $sheet->getStyle("$start_col" . "1:$end_col" . "1")->getFont()->setBold(true)->setSize(14);
                $sheet->getStyle("$start_col" . "1:$end_col" . "1")->getAlignment()->setHorizontal('center');
                $sheet->getStyle("$start_col" . "1:$end_col" . "1")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB($conf['color']);
        
                $sheet->setCellValue("$start_col" . "2", 'FECHA DE ENVÍO:');
                $sheet->setCellValue(chr(ord($start_col) + 1) . "2", $fecha_alias);
                $sheet->setCellValue(chr(ord($start_col) + 6) . "2", 'HOJA DE RUTA:');
                $sheet->setCellValue(chr(ord($start_col) + 7) . "2", $datos[0]['numero_hr'] ?? $hoja_ruta_id);
                $sheet->getStyle("$start_col" . "2:$end_col" . "2")->getFont()->setBold(true);
                $sheet->getStyle("$start_col" . "2:$end_col" . "2")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('99cc99');
        
                foreach ($tipos_fijos as $tipo) {
                    $base_col = chr(ord($col_map[$tipo]) + $offset);
                    $cartas = $agrupado[$tipo_envio][$tipo] ?? [];
                    $total = count($cartas);
        
                    $sheet->setCellValue($base_col . '3', "TOTAL: $total");
                    $sheet->getStyle($base_col . '3')->getFont()->setBold(true);
        
                    $sheet->setCellValue($base_col . '4', $tipo);
                    $sheet->mergeCells($base_col . '4:' . chr(ord($base_col) + 1) . '4');
                    $sheet->getStyle($base_col . '4:' . chr(ord($base_col) + 1) . '4')->getFont()->setBold(true);
                    $sheet->getStyle($base_col . '4:' . chr(ord($base_col) + 1) . '4')->getAlignment()->setHorizontal('center');
                    $sheet->getStyle($base_col . '4:' . chr(ord($base_col) + 1) . '4')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('d9ead3');
        
                    $sheet->setCellValue($base_col . '5', "Village");
                    $sheet->setCellValue(chr(ord($base_col) + 1) . '5', "MCS");
                    $sheet->getStyle($base_col . '5:' . chr(ord($base_col) + 1) . '5')->getFont()->setBold(true);
                    $sheet->getStyle($base_col . '5:' . chr(ord($base_col) + 1) . '5')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('c9daf8');
                }
        
                $max_filas = 6;
                foreach ($tipos_fijos as $tipo) {
                    $cartas = $agrupado[$tipo_envio][$tipo] ?? [];
        
                    // Ordenar por village
                    usort($cartas, function($a, $b) {
                        return strcmp($a['village'], $b['village']);
                    });
        
                    $base_col = chr(ord($col_map[$tipo]) + $offset);
                    $fila = 6;
        
                    foreach ($cartas as $carta) {
                        $sheet->setCellValue($base_col . $fila, $carta['village']);
                        $sheet->setCellValue(chr(ord($base_col) + 1) . $fila, $carta['codigo_mcs']);
        
                        $color = $colores_por_mcs[$carta['codigo_mcs']] ?? null;
                        if ($color) {
                            $sheet->getStyle($base_col . $fila)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB($color);
                            $sheet->getStyle(chr(ord($base_col) + 1) . $fila)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB($color);
                        }
        
                        $fila++;
                    }
        
                    if ($fila > $max_filas) $max_filas = $fila;
                }
        
                $sheet->getStyle("$start_col" . "3:$end_col" . $max_filas)->applyFromArray([
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN,
                            'color' => ['rgb' => '000000']
                        ]
                    ]
                ]);
            }
        
            foreach (range('A', 'Z') as $col) {
                $sheet->getColumnDimension($col)->setAutoSize(true);
            }
        
            header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            header('Content-Disposition: attachment; filename="' . $nombre_archivo . '.xlsx"');
            header('Cache-Control: max-age=0');
        
            $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
            $writer->save('php://output');
            exit;
        }


        if ($formato === 'PDF') {
            if (ob_get_length()) ob_end_clean();
            ob_start();
        
            echo "<style>
                @page { margin: 10px; }
                body { font-family: Arial, sans-serif; font-size:10px; }
                .titulo-general { text-align:center; font-size:14px; font-weight:bold; color:#000; margin-bottom:4px; }
                .subtitulo-general { text-align:center; font-size:12px; margin-bottom:6px; }
                .bloque-titulo { text-align:center; font-size:14px; font-weight:bold; color:#000; padding:6px; margin-bottom:5px; }
                table { border-collapse: collapse; width: 100%; margin-bottom:10px; }
                th, td { border:1px solid #000; padding:4px; text-align:center; }
                .encabezado { font-weight:bold; background:#d9ead3; }
                .col-header { font-weight:bold; background:#c9daf8; }
            </style>";
        
            $tipos_envio = ['DIGITAL' => '#99e0b1', 'APP' => '#6e89a6'];
            $pagina = 0;
        
            foreach ($tipos_envio as $tipo_envio => $color_bloque) {
                if ($pagina > 0) echo "<div style='page-break-before: always;'></div>";
                $pagina++;
        
                echo "<div class='titulo-general'>HOJA DE RUTA - " . strtoupper($datos[0]['organizacion'] ?? '') . "</div>";
                $fecha_envio = !empty($datos[0]['fecha_envio']) ? date('d/m/Y', strtotime($datos[0]['fecha_envio'])) : date('d/m/Y');
                $numero_hoja_ruta = $datos[0]['numero_hr'] ?? $hoja_ruta_id;
                echo "<div class='subtitulo-general'>HR N° $numero_hoja_ruta<br>Fecha de Envío: $fecha_envio</div>";
                echo "<div class='bloque-titulo' style='background:$color_bloque;'>HOJA DE RUTA - $tipo_envio</div>";
        
                echo "<table><tr>";
                foreach ($tipos_fijos as $tipo) echo "<th colspan='2' class='encabezado'>$tipo</th>";
                echo "</tr><tr>";
                foreach ($tipos_fijos as $tipo) {
                    $conteo = count(array_filter($datos, fn($r) => strtoupper($r['tipo_envio']) === $tipo_envio && strtoupper($r['tipo_carta']) === $tipo));
                    echo "<td colspan='2' class='encabezado'>TOTAL: $conteo</td>";
                }
                echo "</tr><tr>";
                foreach ($tipos_fijos as $tipo) echo "<td class='col-header'>Village</td><td class='col-header'>MCS</td>";
                echo "</tr>";
        
                // Agrupar y ordenar por tipo y village
                $tipos_cartas = [];
                foreach ($datos as $row) {
                    if (strtoupper($row['tipo_envio']) === $tipo_envio) {
                        $tipo = strtoupper(str_replace(['Á','É','Í','Ó','Ú'], ['A','E','I','O','U'], $row['tipo_carta']));
                        $tipos_cartas[$tipo][] = $row;
                    }
                }
        
                // Ordenar internamente cada grupo por village
                foreach ($tipos_fijos as $tipo) {
                    if (!empty($tipos_cartas[$tipo])) {
                        usort($tipos_cartas[$tipo], function($a, $b) {
                            return strcmp($a['village'], $b['village']);
                        });
                    }
                }
        
                $max_filas = max(array_map(fn($tipo) => count($tipos_cartas[$tipo] ?? []), $tipos_fijos));
        
                for ($i = 0; $i < $max_filas; $i++) {
                    echo "<tr>";
                    foreach ($tipos_fijos as $tipo) {
                        $carta = $tipos_cartas[$tipo][$i] ?? null;
        
                        $bgcolor = '';
                        if ($carta && isset($colores_por_mcs[$carta['codigo_mcs']])) {
                            $bgcolor = ' style="background-color:#' . $colores_por_mcs[$carta['codigo_mcs']] . ';"';
                        }
        
                        echo "<td$bgcolor>" . ($carta['village'] ?? '') . "</td><td$bgcolor>" . ($carta['codigo_mcs'] ?? '') . "</td>";
                    }
                    echo "</tr>";
                }
        
                echo "</table>";
            }
        
            $html = ob_get_clean();
            $dompdf = new Dompdf();
            $dompdf->loadHtml($html);
            $dompdf->setPaper('A4', 'portrait');
            $dompdf->render();
            $dompdf->stream($nombre_archivo . ".pdf", ["Attachment" => false]);
            exit;
        }



    echo "Formato no reconocido";
    exit;




        
        case 'devolverCarta':
            $codigo_mcs = $_POST['codigo_mcs'] ?? '';
            $observacion = $_POST['observacion'] ?? '';
            $detalle = trim($_POST['detalle'] ?? '') ? " - " . trim($_POST['detalle']) : '';
            $opcion = $_POST['opcion'] ?? 'solo'; // solo | grupo
        
            if (!$codigo_mcs || !$observacion) {
                ob_clean();
                echo json_encode(["status" => "error", "message" => "Faltan datos para devolver la carta"]);
                break;
            }
        
            $cartas_a_devolver = [$codigo_mcs];
            $grupo_id = null;
        
            // Si opción grupo, obtener grupo completo
            if ($opcion === 'grupo') {
                $grupo = $gestion->obtenerGrupoMultiplePorCarta($codigo_mcs);
                if ($grupo && isset($grupo['id'])) {
                    $grupo_id = $grupo['id'];
                    $cartas_a_devolver = $gestion->obtenerCartasActivasGrupo($grupo_id);
                }
            }
        
            $errores = 0;
            foreach ($cartas_a_devolver as $carta) {
                $ok = $gestion->devolverCarta($carta, $observacion, $detalle);
                if (!$ok) {
                    $errores++;
                } else {
                    // Excluir de grupo tanto en "solo" como en "grupo"
                    $gestion->excluirDeGrupoMultiple($carta);
                }
            }
        
            // Verificar si se puede eliminar el grupo completo después de excluir
            if ($opcion === 'grupo' && $grupo_id) {
                $gestion->eliminarGrupoSiTodasExcluidas($grupo_id);
            }
        
            ob_clean();
            echo json_encode([
                "status" => $errores === 0 ? "success" : "warning",
                "message" => $errores === 0
                    ? "Carta(s) devuelta(s) correctamente"
                    : "Algunas cartas no pudieron devolverse"
            ]);
            break;


        case 'reabrirHojaRuta':
            $hoja_ruta_id = $_POST['hoja_ruta_id'] ?? 0;
            $usuario_id = $_SESSION['usu'] ?? 0;

            if (!$hoja_ruta_id) {
                ob_clean();
                echo json_encode(["status" => "error", "message" => "ID de Hoja de Ruta no válido"]);
                break;
            }

            $result = $gestion->reabrirHojaRuta((int)$hoja_ruta_id, (int)$usuario_id);
            logGlobalHR("Reapertura HR | HR_ID: $hoja_ruta_id | Filas afectadas: " . ($result['filas_afectadas'] ?? 0));

            ob_clean();
            echo json_encode([
                "status" => ($result && $result['filas_afectadas'] > 0) ? "success" : "error",
                "message" => ($result && $result['filas_afectadas'] > 0)
                    ? "Hoja de Ruta reabierta correctamente"
                    : "No se pudo reabrir o ya estaba abierta"
            ]);
            break;
        case 'corregirObservaciones':
            $correcciones = json_decode($_POST['correcciones'] ?? '[]', true);
        
            if (!is_array($correcciones) || empty($correcciones)) {
                ob_clean();
                echo json_encode(["status" => "error", "message" => "No se enviaron correcciones"]);
                break;
            }
        
            $errores = 0;
            foreach ($correcciones as $item) {
                $codigo = $item['codigo_mcs'] ?? '';
                $nueva = trim($item['nueva_observacion'] ?? '');
        
                if ($codigo && $nueva) {
                    $ok = $gestion->actualizarObservacionCarta($codigo, $nueva);
                    if (!$ok) $errores++;
                }
            }
        
            ob_clean();
            echo json_encode([
                "status" => $errores === 0 ? "success" : "warning",
                "message" => $errores === 0
                    ? "Observaciones corregidas correctamente"
                    : "Algunas observaciones no se pudieron actualizar"
            ]);
            break;
        case 'verificarGrupoMultiple':
            $codigo = $_POST['codigo_mcs'] ?? '';
            if (!$codigo) {
                ob_clean();
                echo json_encode(["es_multiple" => false]);
                break;
            }

            $grupo = $gestion->obtenerGrupoMultiplePorCarta($codigo);
            if ($grupo && isset($grupo['codigo_mcs_ref'])) {
                ob_clean();
                echo json_encode([
                    "es_multiple" => true,
                    "grupo_id" => $grupo['id'],
                    "ref" => $grupo['codigo_mcs_ref']
                ]);
            } else {
                ob_clean();
                echo json_encode(["es_multiple" => false]);
            }
            break;
        case 'obtenerCartasPorHojaRuta':
            $hoja_ruta_id = $_POST['hoja_ruta_id'] ?? 0;
            $datos = $gestion->obtenerCartasPorHojaRuta((int)$hoja_ruta_id);
            logGlobalHR("🟢 Cartas por HR_ID: $hoja_ruta_id | Total: " . count($datos));
            ob_clean();
            echo json_encode($datos);
            break;
        
        default:
            ob_clean();
            echo json_encode(["status" => "error", "message" => "Acción no válida"]);
            break;
    }
} catch (Throwable $e) {
    logGlobalHR("❌ EXCEPCIÓN GLOBAL: " . $e->getMessage());
    while (ob_get_level() > 0) { ob_end_clean(); }
    echo json_encode([
        "status" => "error",
        "message" => "Error PHP Global: " . $e->getMessage()
    ]);
}
exit;
?>
