<?php
require_once "../Config/conexion.php";

class ModeloProcesarCartas {
    private $conexion;

    public function __construct() {
        $this->conexion = Fn_getConnect();
    }

    private function log($mensaje) {
        $logFile = __DIR__ . "/../Logs/procesar_cartas.log";
        if (!is_dir(dirname($logFile))) {
            @mkdir(dirname($logFile), 0775, true);
        }
        $fecha = date("Y-m-d H:i:s");
        file_put_contents($logFile, "[$fecha] [Modelo] $mensaje\n", FILE_APPEND);
    }

    // ============================================================
    // ✅ FUNCIONALIDAD ACTUAL
    // ============================================================

    public function listarResumenPorGestor($id_gestor) {
        $this->log("Ejecutando SP ObtenerResumenCartas | ID_GESTOR: $id_gestor");
        $stmt = $this->conexion->prepare("CALL ObtenerResumenCartas(?)");
        $stmt->bind_param("i", $id_gestor);
        $stmt->execute();
        $resultado = $stmt->get_result();
        $datos = [];

        while ($row = $resultado->fetch_assoc()) {
            $datos[] = [
                'tipo' => $row['tipocarta'],
                'cantidad' => $row['total_cartas'],
                'acciones' => '<button class="btn btn-primary btn-sm btn-ver-cartas" data-tipo="'.$row['codigo'].'">
                                   <i class="fas fa-eye"></i> Ver Cartas
                               </button>'
            ];
        }
        return $datos;
    }

    public function listarCartasPorGestor($tipoCarta, $id_gestor) {
        $stmt = $this->conexion->prepare("CALL sp_getCartasPorTipo_Procesar(?, ?)");
        $stmt->bind_param("ii", $tipoCarta, $id_gestor);
        $stmt->execute();
        $resultado = $stmt->get_result();
        $datos = [];

        while ($row = $resultado->fetch_assoc()) {
            $row['acciones'] = '<button class="btn btn-success btn-sm btn-envio" data-codigo="'.$row['mcs'].'">
                                    <i class="fas fa-paper-plane"></i> Registrar Envío
                                </button>';
            $datos[] = $row;
        }
        return $datos;
    }

    public function obtenerObservaciones() {
        $sql = "SELECT idObservaciones, descripcion FROM observaciones";
        $resultado = $this->conexion->query($sql);
        $datos = [];
        while ($row = $resultado->fetch_assoc()) {
            $datos[] = $row;
        }
        return $datos;
    }

    public function guardarEnvio($datos) {
        // ✅ Solo calculamos hojaRuta, no necesitamos fecha_envio en carta
        $sql = "SELECT MAX(hojaRuta) as ultima_hoja FROM carta";
        $resultado = $this->conexion->query($sql);
        $row = $resultado->fetch_assoc();
        $hojaRuta = (int)($row['ultima_hoja'] ?? 0) + 1;

        $sql = "UPDATE carta 
                SET punto_focal = ?, 
                    observaciones = ?, 
                    observacionPromotor = ?, 
                    hojaRuta = ?, 
                    estado_envio = 'enviada'
                WHERE codigo_mcs = ?";
        $stmt = $this->conexion->prepare($sql);
        $stmt->bind_param(
            "ssiis",
            $datos['punto_focal'],
            $datos['observaciones'],
            $datos['observacionPromotor'],
            $hojaRuta,
            $datos['codigo_mcs']
        );

        return $stmt->execute();
    }

    public function excluirDeGrupoMultiple($codigo_mcs) {
        $this->log("⛔ Excluyendo carta de grupo múltiple | MCS: $codigo_mcs");
        $sql = "UPDATE grupo_multiple_detalle SET excluida = 1 WHERE codigo_mcs = ?";
        $stmt = $this->conexion->prepare($sql);
        $stmt->bind_param("s", $codigo_mcs);
        return $stmt->execute();
    }

    /**
     * ✅ Obtener todas las cartas (CSV)
     * Si $id_gestor es 0 devuelve todas las cartas; de lo contrario, sólo las asignadas a los VILLAGES del gestor.
     * (Alineado con los SP del módulo)
     */
    public function obtenerTodasLasCartas($id_gestor) {
        if ((int)$id_gestor === 0) {
            // Administrador: trae todas las cartas pendientes
            $sql = "SELECT 
                        v.nombre AS village,
                        c.child_number,
                        n.full_name AS nombres,
                        c.codigo_mcs AS mcs,
                        c.dfc_amount,
                        t.tipocarta AS tipo_carta,
                        c.fecha_recepcion,
                        TIMESTAMPDIFF(DAY, c.fecha_recepcion, NOW()) AS dias_transcurridos
                    FROM carta c
                    LEFT JOIN nino n ON c.child_number = n.Child_Number
                    LEFT JOIN village v ON n.village_id = v.id
                    INNER JOIN tipocarta t ON c.tipoCarta = t.codigo
                    ORDER BY c.fecha_recepcion DESC";
            $resultado = $this->conexion->query($sql);
            $datos = [];
            while ($row = $resultado->fetch_assoc()) {
                $datos[] = $row;
            }
            return $datos;
        } else {
            // Usuario normal: por villages del gestor (coherente con SP)
            $sql = "SELECT 
                        v.nombre AS village,
                        c.child_number,
                        n.full_name AS nombres,
                        c.codigo_mcs AS mcs,
                        c.dfc_amount,
                        t.tipocarta AS tipo_carta,
                        c.fecha_recepcion,
                        TIMESTAMPDIFF(DAY, c.fecha_recepcion, NOW()) AS dias_transcurridos
                    FROM carta c
                    LEFT JOIN nino n ON c.child_number = n.Child_Number
                    LEFT JOIN village v ON n.village_id = v.id
                    INNER JOIN tipocarta t ON c.tipoCarta = t.codigo
                    WHERE n.village_id IN (
                        SELECT gv.village_id
                        FROM gestor_village gv
                        WHERE gv.gestor_id = ?
                    )
                    ORDER BY c.fecha_recepcion DESC";
            $stmt = $this->conexion->prepare($sql);
            $stmt->bind_param("i", $id_gestor);
            $stmt->execute();
            $resultado = $stmt->get_result();
            $datos = [];
            while ($row = $resultado->fetch_assoc()) {
                $datos[] = $row;
            }
            return $datos;
        }
    }

    // ============================================================
    // ✅ NUEVA FUNCIONALIDAD
    // ============================================================

    /**
     * Verifica si el gestor tiene permiso para acceder a hojaRuta.php (administrador).
     * Robusta a rutas guardadas (p.ej. 'Vista/hojaRuta.php').
     */
    public function esAdmin($gestorId) {
        $sql = "SELECT COUNT(*)
                FROM permisos p
                JOIN vistas v ON p.vista_id = v.id
                JOIN gestor_rol gr ON p.rol_id = gr.rol_id
                WHERE gr.gestor_id = ?
                  AND LOWER(TRIM(SUBSTRING_INDEX(v.archivo, '/', -1))) = 'hojaruta.php'";
        $stmt = $this->conexion->prepare($sql);
        $stmt->bind_param('i', $gestorId);
        $stmt->execute();
        $result = 0;
        $stmt->bind_result($result);
        $stmt->fetch();
        $stmt->close();
        return $result > 0;
    }

    /**
     * 🔹 Marcar carta como lista para envío (Promotor)
     */
    public function marcarListaEnvio($codigo_mcs, $observacionPromotor, $observaciones, $tipo_envio) {
        $this->log("Marcando carta lista para envío | MCS: $codigo_mcs | Tipo: $tipo_envio");
        $stmt = $this->conexion->prepare("CALL sp_marcarListaEnvio(?, ?, ?, ?)");
        $stmt->bind_param("siss", $codigo_mcs, $observacionPromotor, $observaciones, $tipo_envio);
        return $stmt->execute();
    }

    /**
     * (Opcional) versión batch desde el modelo — no usada directamente
     */
    public function marcarListaEnvioBatch($items) {
        $ok = 0;
        foreach ($items as $i) {
            $codigo_mcs    = $i['codigo_mcs'] ?? '';
            $obsPromotor   = $i['observacionPromotor'] ?? '';
            $observaciones = $i['observaciones'] ?? '';
            $tipo_envio    = $i['tipo_envio'] ?? 'DIGITAL';
            if (!$codigo_mcs || !$obsPromotor || !$tipo_envio) continue;
            if ($this->marcarListaEnvio($codigo_mcs, (int)$obsPromotor, $observaciones, $tipo_envio)) {
                $ok++;
            }
        }
        return $ok;
    }

    /**
     * 🔹 Crear Hoja de Ruta (Coordinador)
     * Retorna el ID de la nueva HR
     */
    public function crearHojaRuta($numero_hr, $fecha_envio, $organizacion_id, $observaciones, $creado_por) {
        $this->log("Creando Hoja de Ruta | NUMERO: $numero_hr");
        $stmt = $this->conexion->prepare("CALL sp_crearHojaRuta(?, ?, ?, ?, ?)");
        $stmt->bind_param("ssisi", $numero_hr, $fecha_envio, $organizacion_id, $observaciones, $creado_por);
        $stmt->execute();
        $resultado = $stmt->get_result();
        $row = $resultado->fetch_assoc();
        return $row['nueva_hr_id'] ?? null;
    }

    /**
     * 🔹 Asignar cartas a Hoja de Ruta (Coordinador)
     */
    public function asignarCartasAHojaRuta($hoja_ruta_id, $codigo_mcs) {
        $this->log("Asignando carta a Hoja de Ruta | HR_ID: $hoja_ruta_id | MCS: $codigo_mcs");
        $stmt = $this->conexion->prepare("CALL sp_asignarCartasAHojaRuta(?, ?)");
        $stmt->bind_param("is", $hoja_ruta_id, $codigo_mcs);
        return $stmt->execute();
    }

    /**
     * ✅ Crear un grupo múltiple y registrar sus cartas asociadas
     */
    public function crearGrupoMultiple($codigo_mcs_ref, $cartas, $usuario_id = null) {
        $this->log("Creando grupo múltiple | REF: $codigo_mcs_ref | Total cartas: " . count($cartas));

        if (empty($codigo_mcs_ref) || empty($cartas) || !is_array($cartas)) {
            $this->log("❌ Datos incompletos para crear grupo múltiple");
            return false;
        }

        // 1. Insertar el grupo principal
        $stmt = $this->conexion->prepare("INSERT INTO grupo_multiple (codigo_mcs_ref, usuario_id) VALUES (?, ?)");
        $stmt->bind_param("si", $codigo_mcs_ref, $usuario_id);
        if (!$stmt->execute()) {
            $this->log("❌ Error insertando grupo_multiple: " . $stmt->error);
            return false;
        }
        $grupo_id = $stmt->insert_id;

        // 2. Insertar cartas del grupo
        $insert_stmt = $this->conexion->prepare("INSERT INTO grupo_multiple_detalle (grupo_id, codigo_mcs) VALUES (?, ?)");
        foreach ($cartas as $codigo) {
            $codigo_trim = trim($codigo);
            $insert_stmt->bind_param("is", $grupo_id, $codigo_trim);
            if (!$insert_stmt->execute()) {
                $this->log("❌ Error insertando detalle grupo | Carta: $codigo_trim | " . $insert_stmt->error);
                // (Opcional) rollback si manejas transacciones
            }
        }

        $this->log("✅ Grupo múltiple creado exitosamente con ID: $grupo_id");
        return true;
    }
}
?>
