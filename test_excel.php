<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// ✅ Usar directamente el autoload manual original
require_once __DIR__ . '/../Public/autoload.php';

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

// ✅ PRUEBA SIMPLE
$spreadsheet = new Spreadsheet();
$sheet = $spreadsheet->getActiveSheet();
$sheet->setTitle("PRUEBA EXCEL");
$sheet->setCellValue('A1', 'Hola Mundo');
$sheet->setCellValue('B1', 'Prueba');
$sheet->getStyle('A1:B1')->getFont()->setBold(true);

header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
header('Content-Disposition: attachment; filename="test_excel.xlsx"');
header('Cache-Control: max-age=0');

$writer = new Xlsx($spreadsheet);
$writer->save('php://output');
exit;
