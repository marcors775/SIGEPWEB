<?php
class ModeloDevolucionesExternas
{
    private $conexion;

    public function __construct()
    {
        global $conexion;
        $this->conexion = $conexion;
    }

    /* ============================================================
       ✅ 1. Buscar cartas enviadas
    ============================================================ */
    public function buscarCartasEnviadas($codigo_mcs = null, $child_number = null)
    {
        $sql = "SELECT 
                    c.codigo_mcs,
                    v.nombre AS village,
                    n.full_name AS nombres,
                    tc.tipocarta AS tipo_carta,
                    hr.id AS hoja_ruta_id,                -- ✅ Nuevo: ID real de hoja_ruta
                    hr.numero_hr,                         -- ⚠️ Se mantiene para mostrar al usuario
                    hr.fecha_envio
                FROM carta c
                INNER JOIN nino n ON c.Child_Number = n.Child_Number
                INNER JOIN village v ON n.village_id = v.id
                INNER JOIN tipocarta tc ON c.tipoCarta = tc.codigo
                INNER JOIN hoja_ruta hr ON c.hojaRuta = hr.id
                WHERE c.estado_envio = 'enviada'";
    
        if ($codigo_mcs) {
            $sql .= " AND c.codigo_mcs = ?";
            $stmt = $this->conexion->prepare($sql);
            $stmt->bind_param("s", $codigo_mcs);
        } elseif ($child_number) {
            $sql .= " AND c.Child_Number = ?";
            $stmt = $this->conexion->prepare($sql);
            $stmt->bind_param("i", $child_number);
        } else {
            return [];
        }
    
        $stmt->execute();
        $resultado = $stmt->get_result();
        $data = [];
        while ($row = $resultado->fetch_assoc()) {
            $data[] = $row;
        }
        $resultado->free();
        while ($stmt->more_results() && $stmt->next_result()) {
            $stmt->store_result();
        }
        return $data;
    }


    /* ============================================================
       ✅ 2. Registrar devolución externa
    ============================================================ */
    public function registrarDevolucionExterna($codigo_mcs, $hoja_ruta_id, $motivo_id, $detalle, $devuelta_por, $fecha_devolucion)
    {
        // Asegurar solo fecha
        $fecha_devolucion = date("Y-m-d", strtotime($fecha_devolucion));

        $stmt = $this->conexion->prepare("CALL sp_registrarDevolucionExterna(?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("siisis", $codigo_mcs, $hoja_ruta_id, $motivo_id, $detalle, $devuelta_por, $fecha_devolucion);
        $stmt->execute();
        $resultado = $stmt->get_result();
        $row = $resultado ? $resultado->fetch_assoc() : ["filas_afectadas" => $stmt->affected_rows];

        if ($resultado) {
            $resultado->free();
        }
        while ($stmt->more_results() && $stmt->next_result()) {
            $stmt->store_result();
        }
        return $row;
    }

    /* ============================================================
       ✅ 3. Listar historial de devoluciones
    ============================================================ */
    public function listarHistorialDevoluciones($fecha_inicio = null, $fecha_fin = null, $numero_hr = null, $motivo_id = null)
    {
        $stmt = $this->conexion->prepare("CALL sp_listarHistorialDevolucionesExternas(?, ?, ?, ?)");
        $stmt->bind_param("sssi", $fecha_inicio, $fecha_fin, $numero_hr, $motivo_id);
        $stmt->execute();
        $resultado = $stmt->get_result();
        $data = [];
        while ($row = $resultado->fetch_assoc()) {
            $data[] = $row;
        }
        $resultado->free();
        while ($stmt->more_results() && $stmt->next_result()) {
            $stmt->store_result();
        }
        return $data;
    }

    /* ============================================================
       ✅ 4. Obtener motivos de devolución
    ============================================================ */
    public function obtenerMotivosDevolucion()
    {
        $stmt = $this->conexion->prepare("CALL sp_crudMotivosDevolucion('mostrarMotivosDevolucion', NULL, NULL, NULL)");
        $stmt->execute();
        $resultado = $stmt->get_result();
        $data = [];
        while ($row = $resultado->fetch_assoc()) {
            $data[] = $row;
        }
        $resultado->free();
        while ($stmt->more_results() && $stmt->next_result()) {
            $stmt->store_result();
        }
        return $data;
    }

    /* ============================================================
       ✅ 5. Eliminar devolución externa (NO toca carta)
    ============================================================ */
    public function eliminarDevolucionExterna($id)
    {
        try {
            $stmt = $this->conexion->prepare("DELETE FROM devolucion_externa WHERE id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            return ["success" => true];
        } catch (Exception $e) {
            return ["success" => false, "error" => $e->getMessage()];
        }
    }

    /* ============================================================
       ✅ 6. Registrar reenvío urgente (NO toca carta)
    ============================================================ */
    public function registrarReenvioDevolucion($id, $fecha_reenvio, $medio_reenvio)
    {
        try {
            $fecha_reenvio = date("Y-m-d", strtotime($fecha_reenvio));
            $stmt = $this->conexion->prepare("
                UPDATE devolucion_externa
                SET fecha_reenvio = ?, medio_reenvio = ?
                WHERE id = ?");
            $stmt->bind_param("ssi", $fecha_reenvio, $medio_reenvio, $id);
            $stmt->execute();
            return ["success" => true];
        } catch (Exception $e) {
            return ["success" => false, "error" => $e->getMessage()];
        }
    }
}
