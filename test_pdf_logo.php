<?php
require_once __DIR__ . '/../Public/vendor/autoload.php';

use Dompdf\Dompdf;
use Dompdf\Options;

$options = new Options();
$options->set('dpi', 300);
$options->set('defaultFont', 'Arial');
$options->set('isRemoteEnabled', true);
$dompdf = new Dompdf($options);

// ✅ URL pública dinámica
$host = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]";
$fondo_url = $host . "/sigep/Recursos/fondo_blanco_500.jpg";

$html = "
<style>
    @page { margin: 10px; }
    .marca-agua {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        opacity: 0.20;
        z-index: -1;
        width: 900px;   /* Fuerza grande como el código que te gustó */
        height: 900px;
        max-width: 100%;
        max-height: 100%;
    }
</style>


<img src='$fondo_url' class='marca-agua'>
<h1>PRUEBA DE LOGO EN PDF (Dinámico)</h1>
<p style='text-align:center;'>Ahora es independiente del dominio.</p>
";

$dompdf->loadHtml($html);
$dompdf->setPaper('A4', 'portrait');
$dompdf->render();
$dompdf->stream("test_logo_dinamico.pdf", ["Attachment" => false]);
