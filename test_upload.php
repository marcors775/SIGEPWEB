<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    echo "<pre>";
    print_r($_FILES);
    print_r($_POST);
    echo "</pre>";
} else {
?>
<form method="post" enctype="multipart/form-data">
    <input type="file" name="archivo">
    <input type="text" name="tipoCarta" value="1">
    <button type="submit">Subir</button>
</form>
<?php } ?>