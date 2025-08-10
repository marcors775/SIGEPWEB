<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: text/plain; charset=utf-8');

echo "🔍 INICIANDO TEST AUTOLOAD\n\n";

// ✅ 1) Cargar autoload manual primero
require_once __DIR__ . '/../Public/autoload.php';
echo "✅ PhpSpreadsheet autoload cargado correctamente\n";

// ✅ 2) Probar creación básica de Spreadsheet
try {
    $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
    echo "✅ PhpSpreadsheet funciona: " . get_class($spreadsheet) . "\n";
} catch (Throwable $e) {
    echo "❌ Error PhpSpreadsheet: " . $e->getMessage() . "\n";
}

// ✅ 3) Comprobar si Dompdf ya está cargado antes de tiempo
if (class_exists('\Dompdf\Dompdf')) {
    echo "⚠️ Dompdf YA estaba cargado antes de tiempo\n";
} else {
    echo "✅ Dompdf NO está cargado aún (correcto)\n";
}

// ✅ 4) Cargar Dompdf manualmente después
require_once __DIR__ . '/../Public/vendor/autoload.php';
try {
    $dompdf = new \Dompdf\Dompdf();
    echo "✅ Dompdf funciona: " . get_class($dompdf) . "\n";
} catch (Throwable $e) {
    echo "❌ Error Dompdf: " . $e->getMessage() . "\n";
}

echo "\n🔍 TEST COMPLETADO";
