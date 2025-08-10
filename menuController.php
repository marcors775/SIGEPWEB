<?php
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

require_once "../Config/conexion.php";
$conexion = Fn_getConnect();

$menuItems = [];
$roles = $_SESSION['roles'] ?? [];

if (!empty($roles)) {
    $rolList = implode(",", array_map(fn($r) => "'" . $conexion->real_escape_string($r) . "'", $roles));

    $sql = "
        SELECT DISTINCT v.nombre, v.archivo, c.nombre AS categoria
FROM permisos p
JOIN vistas v ON p.vista_id = v.id
JOIN rol r ON p.rol_id = r.id
JOIN categorias c ON v.id_categoria = c.id
WHERE r.tipo_rol IN ($rolList)
ORDER BY c.nombre, v.nombre;
    ";

    $res = $conexion->query($sql);

    $menuItems = [];
    while ($row = $res->fetch_assoc()) {
        $categoria = $row['categoria'] ?: 'Sin categoría';
        if (!isset($menuItems[$categoria])) {
            $menuItems[$categoria] = [];
        }
        $menuItems[$categoria][] = [
            'name' => $row['nombre'],
            'link' => $row['archivo'],
            'icon' => 'far fa-circle nav-icon' // por defecto, puedes personalizar
        ];
    }
}
