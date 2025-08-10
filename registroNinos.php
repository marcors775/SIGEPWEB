<?php
require_once "../Config/verificar_permiso.php"; // Asegura sesión activa y conexión
require_once "../Public/autoload.php";

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date;

if (!isset($_SESSION['usu'])) {
    echo json_encode(['status' => 'error', 'mensaje' => 'Sesión expirada.']);
    exit;
}

$accion = $_POST['accion'] ?? '';
$conn = Fn_getConnect();

// 🔵 Función mejorada para interpretar fechas de varios formatos
function convertirFecha($valor) {
    if (is_null($valor) || $valor === '-' || trim($valor) === '') return null;

    // Si es numérico (Excel formato)
    if (is_numeric($valor)) {
        return Date::excelToDateTimeObject($valor)->format('Y-m-d');
    }

    // Intentar varios formatos conocidos
    $formatos = ['Y-m-d', 'd/m/Y', 'm/d/Y', 'd-m-Y', 'm-d-Y'];
    foreach ($formatos as $f) {
        $fecha = DateTime::createFromFormat($f, $valor);
        if ($fecha && $fecha->format($f) === $valor) {
            return $fecha->format('Y-m-d');
        }
    }

    // Último intento: crear genérico
    $fecha = date_create($valor);
    if ($fecha) {
        return $fecha->format('Y-m-d');
    }

    // No se pudo convertir
    return null;
}

function getValor($cell) {
    try {
        return trim((string) ($cell->isFormula() ? $cell->getCalculatedValue() : $cell->getValue()));
    } catch (Exception $e) {
        return '';
    }
}

function normalizarGenero($valor) {
    $valor = strtolower(trim($valor));
    return match(true) {
        $valor === 'male' || $valor === 'm' => 'Male',
        $valor === 'female' || $valor === 'f' => 'Female',
        default => '',
    };
}

function detectarEncabezado($sheet, $esperados, $maxFila = 30) {
    for ($i = 1; $i <= $maxFila; $i++) {
        $actual = array_map(fn($col) => strtolower(str_replace(' ', '', getValor($sheet->getCell($col . $i)))), range('A', 'L'));
        $esperadosNorm = array_map(fn($h) => strtolower(str_replace(' ', '', $h)), $esperados);
        if (count(array_intersect($actual, $esperadosNorm)) >= count($esperadosNorm) - 1) {
            return $i;
        }
    }
    return null;
}

function tieneFiltrosExcel($ruta) {
    $zip = new ZipArchive();
    if ($zip->open($ruta) === true) {
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $nombre = $zip->getNameIndex($i);
            if (str_contains($nombre, 'xl/worksheets/sheet')) {
                $contenido = $zip->getFromIndex($i);
                if ($contenido && str_contains($contenido, '<autoFilter')) {
                    $zip->close();
                    return true;
                }
            }
        }
        $zip->close();
    }
    return false;
}

// 🔵 Acción principal
if ($accion === 'importar') {
    if (!isset($_FILES['archivo_excel'])) {
        echo json_encode(['status' => 'error', 'mensaje' => 'No se recibió archivo Excel.']);
        exit;
    }

    $file = $_FILES['archivo_excel']['tmp_name'];
    $mes = $_POST['mes_seleccionado'] ?? null;
    if (!$mes) {
        echo json_encode(['status' => 'error', 'mensaje' => 'Debe seleccionar la fecha.']);
        exit;
    }

    $hayFiltros = tieneFiltrosExcel($file);

    try {
        $reader = IOFactory::createReaderForFile($file);
        $reader->setReadDataOnly(false);
        $spreadsheet = $reader->load($file);
        $sheet = $spreadsheet->getActiveSheet();

        $esperados = [
            'Community #', 'Village', 'Child Number', 'Full Name', 'Gender', 'Birthdate',
            'Sponsorship Status', 'Enrolled On Date', 'Local Partner', 'Alliance Name', 'Primary Contact: Full Name'
        ];

        $filaHeader = detectarEncabezado($sheet, $esperados);
        if (!$filaHeader) {
            echo json_encode(['status' => 'error', 'mensaje' => 'No se encontraron encabezados válidos.']);
            exit;
        }

        $inicio = $filaHeader + 1;
        $fin = $sheet->getHighestRow();
        $datos = [];

        for ($i = $inicio; $i <= $fin; $i++) {
            $num = getValor($sheet->getCell("C$i"));
            $nombre = getValor($sheet->getCell("D$i"));
            if (!$num || !$nombre) continue;

            // 🔁 Traducir nombre de village a ID
            $village_nombre = getValor($sheet->getCell("B$i"));
            $village_id = null;

            $stmt = $conn->prepare("SELECT id FROM village WHERE nombre COLLATE utf8mb4_unicode_ci = ?");
            $stmt->bind_param("s", $village_nombre);
            $stmt->execute();
            $result = $stmt->get_result();
            if ($row_v = $result->fetch_assoc()) {
                $village_id = $row_v['id'];
            }
            $stmt->close();

            if (!$village_id) {
                throw new Exception("Village no encontrado: $village_nombre en fila $i");
            }

            $datos[] = [
                'comunidad' => getValor($sheet->getCell("A$i")),
                'numero_nino' => $num,
                'nombre_completo' => $nombre,
                'village_id' => $village_id,
                'birthdate' => convertirFecha(getValor($sheet->getCell("F$i"))),
                'genero' => normalizarGenero(getValor($sheet->getCell("E$i"))),
                'estado_patrocinio' => getValor($sheet->getCell("H$i")),
                'fecha_inscripcion' => convertirFecha(getValor($sheet->getCell("I$i"))),
                'socio_local' => getValor($sheet->getCell("J$i")),
                'nombre_alianza' => getValor($sheet->getCell("K$i")),
                'nombre_contacto_principal' => getValor($sheet->getCell("L$i"))
            ];
        }

        require_once "../Modelo/registroNinosM.php";
        $model = new NinoModel();
        $resultado = $model->importarNinos($datos, $mes);

        echo json_encode([
            'status' => 'success',
            'mensaje' => 'Importación completada con ' . $resultado['insertados'] . ' registros.',
            'errores' => $resultado['errores']
        ]);
        exit;

    } catch (Exception $e) {
        if ($hayFiltros) {
            echo json_encode([
                'status' => 'filtros',
                'mensaje' => 'Error: ' . $e->getMessage() . ' (Además, revise filtros aplicados en el archivo Excel)'
            ]);
        } else {
            echo json_encode([
                'status' => 'error',
                'mensaje' => 'Error: ' . $e->getMessage()
            ]);
        }
        exit;
    }
}

if ($accion === 'obtenerMeses') {
    require_once "../Modelo/registroNinosM.php";
    $model = new NinoModel();
    echo json_encode(['status' => 'success', 'data' => $model->obtenerMesesDisponibles()]);
    exit;
}

if ($accion === 'obtenerNinos') {
    require_once "../Modelo/registroNinosM.php";
    $model = new NinoModel();
    $mes = $_POST['mes'] ?? '';
    echo json_encode(['status' => 'success', 'data' => $model->obtenerNinosPorMes($mes)]);
    exit;
}

echo json_encode(['status' => 'error', 'mensaje' => 'Acción no válida.']);
exit;
?>