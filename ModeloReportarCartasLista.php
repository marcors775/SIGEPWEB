<?php
require_once "../Config/conexion.php";

class ModeloReportarCartasLista {
    private $conexion;

    public function __construct() {
        $this->conexion = Fn_getConnect();
    }

    // ✅ Obtener cartas en estado "lista"
    public function obtenerCartasLista($tipoCarta = '', $gestor_id = '') {
        $sql = "SELECT 
            c.codigo_mcs, -- identificador único
            v.nombre AS village,
            n.full_name AS nombres,
            t.tipocarta AS tipo_carta,
            c.tipo_envio,
            o.descripcion AS observacion_promotor
        FROM carta c
        LEFT JOIN nino n       ON c.Child_Number = n.Child_Number
        LEFT JOIN village v    ON n.village_id = v.id
        INNER JOIN tipocarta t ON c.tipoCarta = t.codigo
        LEFT JOIN observaciones o ON c.observacionPromotor = o.idObservaciones
        WHERE c.estado_envio = 'lista'";

        $params = [];
        $types  = '';

        if (!empty($tipoCarta)) {
            $sql .= " AND t.tipocarta = ?";
            $params[] = $tipoCarta;
            $types   .= 's';
        }

        if (!empty($gestor_id)) {
            $sql .= " AND n.village_id IN (
                         SELECT village_id FROM gestor_village WHERE gestor_id = ?
                     )";
            $params[] = $gestor_id;
            $types   .= 'i';
        }

        $stmt = $this->conexion->prepare($sql);
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        $stmt->execute();

        $res = $stmt->get_result();
        $out = [];
        while ($row = $res->fetch_assoc()) {
            $out[] = $row;
        }
        return $out;
    }

    // ✅ Listar usuarios que aplican al filtro (gestores/promotores)
    public function listarUsuarios() {
        // Si tu lógica de asignación usa gestor_village.gestor_id → debe venir de `gestor`
        $sql = "SELECT g.Cedula AS id_usuario, g.nombre_completo
                FROM gestor g
                WHERE g.estado = 1"; // quita esta condición si no existe la columna

        $resultado = $this->conexion->query($sql);
        $usuarios = [];
        while ($row = $resultado->fetch_assoc()) {
            $usuarios[] = $row;
        }
        return $usuarios;
    }
}
