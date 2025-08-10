<?php
require_once "../Config/conexion.php";

class ModeloHojaRuta {
    private $conexion;

    public function __construct() {
        global $conexion;
        if (!$conexion) {
            throw new Exception("Conexión a BD no establecida");
        }
        $this->conexion = $conexion;
        $this->log("✅ Conexión establecida desde sesión");
    }

    private function log($mensaje) {
        $logFile = __DIR__ . "/../Logs/hoja_ruta.log";
        $fecha = date("Y-m-d H:i:s");
        file_put_contents($logFile, "[$fecha] [ModeloHojaRuta] $mensaje\n", FILE_APPEND);
    }

    // ✅ 1) Listar cartas listas para Hoja de Ruta
    public function listarCartasParaHojaRuta($organizacion_id) {
        $this->log("Listando cartas para HR | Org_ID: $organizacion_id");
        $stmt = $this->conexion->prepare("CALL sp_listarCartasParaHojaRuta(?)");
        $stmt->bind_param("i", $organizacion_id);
        $stmt->execute();
        $resultado = $stmt->get_result();

        $datos = [];
        while ($row = $resultado->fetch_assoc()) {
            $datos[] = $row;
        }

        $this->log("Cartas devueltas: " . count($datos));
        $resultado->free();
        while ($stmt->more_results() && $stmt->next_result()) {
            $stmt->store_result();
        }
        return $datos;
    }

    // ✅ 2) Crear Hoja de Ruta
    public function crearHojaRuta($numero_hr, $fecha_envio, $organizacion_id, $creado_por) {
        $this->log("Creando Hoja Ruta | HR: $numero_hr | Org_ID: $organizacion_id | Usuario: $creado_por");
        $stmt = $this->conexion->prepare("CALL sp_crearHojaRuta(?, ?, ?, ?)");
        $stmt->bind_param("ssii", $numero_hr, $fecha_envio, $organizacion_id, $creado_por);
        $stmt->execute();

        $resultado = $stmt->get_result();
        $row = $resultado->fetch_assoc();
        $resultado->free();

        while ($stmt->more_results() && $stmt->next_result()) {
            $stmt->store_result();
        }

        $this->log("HR creada con ID: " . ($row['nueva_hr_id'] ?? 'NULL'));
        return $row['nueva_hr_id'] ?? null;
    }

    // ✅ 3) Asignar cartas a Hoja de Ruta
    public function asignarCartasAHojaRuta($hoja_ruta_id, $codigo_mcs) {
        $this->log("Asignando carta a HR | HR_ID: $hoja_ruta_id | MCS: $codigo_mcs");
        try {
            $stmt = $this->conexion->prepare("CALL sp_asignarCartasAHojaRuta(?, ?)");
            $stmt->bind_param("is", $hoja_ruta_id, $codigo_mcs);

            if (!$stmt->execute()) {
                $this->log("❌ Error SQL ejecutando SP: " . $stmt->error);
                return false;
            }

            if ($resultado = $stmt->get_result()) {
                $row = $resultado->fetch_assoc();
                $this->log("Resultado asignación (filas_afectadas): " . ($row['filas_afectadas'] ?? 0));
                $resultado->free();
            }
            while ($stmt->more_results() && $stmt->next_result()) {
                $stmt->store_result();
            }

            return true;
        } catch (\Throwable $e) {
            $this->log("❌ Excepción asignando carta: " . $e->getMessage());
            return false;
        }
    }

    // ✅ 4) Listar Hojas de Ruta creadas
    public function listarHojasDeRuta($organizacion_id) {
        $this->log("Listando Hojas de Ruta | Org_ID: $organizacion_id");
        $stmt = $this->conexion->prepare("CALL sp_listarHojasDeRuta(?)");
        $stmt->bind_param("i", $organizacion_id);
        $stmt->execute();
        $resultado = $stmt->get_result();

        $datos = [];
        while ($row = $resultado->fetch_assoc()) {
            $datos[] = $row;
        }

        $this->log("Hojas de Ruta devueltas: " . count($datos));
        $resultado->free();

        while ($stmt->more_results() && $stmt->next_result()) {
            $stmt->store_result();
        }

        return $datos;
    }

    // ✅ 5) Obtener el siguiente número de HR
    public function obtenerSiguienteNumeroHR() {
        $sql = "SELECT LPAD((IFNULL(MAX(CAST(numero_hr AS UNSIGNED)),0)+1), 3, '0') AS siguiente_hr FROM hoja_ruta";
        $resultado = $this->conexion->query($sql);
        if (!$resultado) {
            $this->log("❌ Error en consulta siguiente HR: " . $this->conexion->error);
            throw new Exception("Error obteniendo siguiente número de HR");
        }
        $row = $resultado->fetch_assoc();
        $this->log("Siguiente HR: " . ($row['siguiente_hr'] ?? '0001'));
        return $row['siguiente_hr'] ?? '0001';
    }

    // ✅ 6) Listar Organizaciones
    public function listarOrganizaciones() {
        $sql = "SELECT id, Alias FROM organizacion ORDER BY Alias";
        $resultado = $this->conexion->query($sql);
        if (!$resultado) {
            $this->log("❌ Error listando organizaciones: " . $this->conexion->error);
            return [];
        }
        $datos = [];
        while ($row = $resultado->fetch_assoc()) {
            $datos[] = $row;
        }
        $this->log("Organizaciones devueltas: " . count($datos));
        return $datos;
    }

    // ✅ 7) Obtener cartas por Hoja de Ruta
    public function obtenerCartasPorHojaRuta($hoja_ruta_id) {
        $this->log("Obteniendo cartas de HR | HR_ID: $hoja_ruta_id");
        $stmt = $this->conexion->prepare("CALL sp_obtenerCartasPorHojaRuta(?)");
        $stmt->bind_param("i", $hoja_ruta_id);
        $stmt->execute();
        $resultado = $stmt->get_result();

        $datos = [];
        while ($row = $resultado->fetch_assoc()) {
            $datos[] = $row;
        }

        $this->log("Cartas devueltas para HR: " . count($datos));
        $resultado->free();

        while ($stmt->more_results() && $stmt->next_result()) {
            $stmt->store_result();
        }

        return $datos;
    }

    // ✅ 8) Cerrar Hoja de Ruta
    public function cerrarHojaRuta($hoja_ruta_id, $usuario_id) {
        $this->log("Cerrando HR | HR_ID: $hoja_ruta_id | Usuario: $usuario_id");
        $stmt = $this->conexion->prepare("CALL sp_cerrarHojaRuta(?, ?)");
        $stmt->bind_param("ii", $hoja_ruta_id, $usuario_id);
        $stmt->execute();

        $resultado = $stmt->get_result();
        $row = $resultado->fetch_assoc();
        $resultado->free();

        while ($stmt->more_results() && $stmt->next_result()) {
            $stmt->store_result();
        }

        $this->log("Resultado cierre HR (filas_afectadas): " . ($row['filas_afectadas'] ?? 0));
        return $row['filas_afectadas'] ?? 0;
    }

    // ✅ 9) Devolver Carta al Promotor (Punto Focal)
    public function devolverCarta($codigo_mcs, $observacion, $detalle = '') {
        $this->log("Devolviendo carta | MCS: $codigo_mcs | Obs: $observacion | Detalle: $detalle");

        try {
            $sql = "UPDATE carta 
                    SET estado_envio = 'pendiente', 
                        hojaRuta = NULL,
                        tipo_envio = NULL,
                        punto_focal = NULL,
                        observacionPromotor = NULL
                    WHERE codigo_mcs = ?";
            $stmt = $this->conexion->prepare($sql);
            $stmt->bind_param("s", $codigo_mcs);
        
            if (!$stmt->execute()) {
                $this->log("❌ Error SQL devolverCarta: " . $stmt->error);
                return false;
            }
        
            $this->log("Carta devuelta correctamente | Filas afectadas: " . $stmt->affected_rows);
            return true;
        } catch (\Throwable $e) {
            $this->log("❌ Excepción devolverCarta: " . $e->getMessage());
            return false;
        }

    }

    // ✅ 10) Reabrir Hoja de Ruta
    public function reabrirHojaRuta($hoja_ruta_id, $usuario_id) {
        $this->log("Reabriendo HR | HR_ID: $hoja_ruta_id | Usuario: $usuario_id");
        $stmt = $this->conexion->prepare("CALL sp_reabrirHojaRuta(?, ?)");
        $stmt->bind_param("ii", $hoja_ruta_id, $usuario_id);
        $stmt->execute();
    
        $resultado = $stmt->get_result();
        $row = $resultado->fetch_assoc();
        $resultado->free();
    
        while ($stmt->more_results() && $stmt->next_result()) {
            $stmt->store_result();
        }
    
        return $row;
    }

    // ✅ 11) Obtener HR actual de una carta
    public function obtenerHojaRutaPorCarta($codigo_mcs) {
        $this->log("Obteniendo HR actual de la carta | MCS: $codigo_mcs");
        $stmt = $this->conexion->prepare("SELECT hojaRuta FROM carta WHERE codigo_mcs = ? LIMIT 1");
        $stmt->bind_param("s", $codigo_mcs);
        $stmt->execute();
        $resultado = $stmt->get_result()->fetch_assoc();
        return $resultado['hojaRuta'] ?? null;
    }

    // ✅ 12) Registrar Devolución Externa
    public function registrarDevolucionExterna($codigo_mcs, $hoja_ruta_id, $motivo_id, $detalle, $usuario_id) {
        $this->log("Registrando devolución externa | MCS: $codigo_mcs | HR_ID: $hoja_ruta_id | Motivo: $motivo_id");
        try {
            $stmt = $this->conexion->prepare("CALL sp_registrarDevolucionExterna(?, ?, ?, ?, ?)");
            $stmt->bind_param("siisi", $codigo_mcs, $hoja_ruta_id, $motivo_id, $detalle, $usuario_id);
            $stmt->execute();
            return true;
        } catch (\Throwable $e) {
            $this->log("❌ Error registrarDevolucionExterna: " . $e->getMessage());
            return false;
        }
    }
    // ✅ 13) Actualizar observación manual de una carta (para corrección múltiple)
    public function actualizarObservacionCarta($codigo_mcs, $nueva_observacion) {
        $this->log("Actualizando observación | MCS: $codigo_mcs | Observación nueva: $nueva_observacion");
    
        try {
            $sql = "UPDATE carta SET observaciones = ? WHERE codigo_mcs = ?";
            $stmt = $this->conexion->prepare($sql);
            $stmt->bind_param("ss", $nueva_observacion, $codigo_mcs);
    
            if (!$stmt->execute()) {
                $this->log("❌ Error SQL actualizarObservacionCarta: " . $stmt->error);
                return false;
            }
    
            $this->log("Observación actualizada correctamente | Filas afectadas: " . $stmt->affected_rows);
            return $stmt->affected_rows > 0;
        } catch (\Throwable $e) {
            $this->log("❌ Excepción actualizarObservacionCarta: " . $e->getMessage());
            return false;
        }
    }
    // ✅ 14) Obtener todos los grupos múltiples desde BD
    public function obtenerGruposMultiples() {
        $this->log("Obteniendo todos los grupos múltiples");
        
        $sql = "SELECT gm.codigo_mcs_ref, gmd.codigo_mcs 
                FROM grupo_multiple gm
                INNER JOIN grupo_multiple_detalle gmd ON gm.id = gmd.grupo_id";
        
        $resultado = $this->conexion->query($sql);
        if (!$resultado) {
            $this->log("❌ Error obteniendo grupos múltiples: " . $this->conexion->error);
            return [];
        }
    
        $grupos = [];
        while ($row = $resultado->fetch_assoc()) {
            $ref = $row['codigo_mcs_ref'];
            $carta = $row['codigo_mcs'];
    
            if (!isset($grupos[$ref])) {
                $grupos[$ref] = [];
            }
            $grupos[$ref][] = $carta;
        }
    
        $this->log("Total grupos múltiples encontrados: " . count($grupos));
        return $grupos;
    }
    // ✅ Obtener grupo múltiple al que pertenece una carta (solo activas)
    public function obtenerGrupoMultiplePorCarta($codigo_mcs) {
        $sql = "SELECT g.id, g.codigo_mcs_ref
                FROM grupo_multiple g
                INNER JOIN grupo_multiple_detalle d ON d.grupo_id = g.id
                WHERE d.codigo_mcs = ? AND d.excluida = 0
                LIMIT 1";
        $stmt = $this->conexion->prepare($sql);
        $stmt->bind_param("s", $codigo_mcs);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc();
    }
    
    // ✅ Obtener todas las cartas activas de un grupo múltiple
    public function obtenerCartasActivasGrupo($grupo_id) {
        $sql = "SELECT d.codigo_mcs FROM grupo_multiple_detalle d
                WHERE d.grupo_id = ? AND d.excluida = 0";
        $stmt = $this->conexion->prepare($sql);
        $stmt->bind_param("i", $grupo_id);
        $stmt->execute();
    
        $result = $stmt->get_result();
        $cartas = [];
        while ($row = $result->fetch_assoc()) {
            $cartas[] = $row['codigo_mcs'];
        }
        return $cartas;
    }
    // ✅ Excluir una carta del grupo múltiple (soft delete)
    public function excluirDeGrupoMultiple($codigo_mcs) {
        $this->log("Excluyendo carta de grupo múltiple | MCS: $codigo_mcs");
    
        try {
            $sql = "UPDATE grupo_multiple_detalle SET excluida = 1 WHERE codigo_mcs = ?";
            $stmt = $this->conexion->prepare($sql);
            $stmt->bind_param("s", $codigo_mcs);
    
            if (!$stmt->execute()) {
                $this->log("❌ Error SQL excluirDeGrupoMultiple: " . $stmt->error);
                return false;
            }
    
            $this->log("Carta excluida correctamente del grupo | Filas afectadas: " . $stmt->affected_rows);
            return $stmt->affected_rows > 0;
        } catch (\Throwable $e) {
            $this->log("❌ Excepción excluirDeGrupoMultiple: " . $e->getMessage());
            return false;
        }
    }
    // ✅ Eliminar grupo múltiple si todas sus cartas han sido excluidas
    public function eliminarGrupoSiTodasExcluidas($grupo_id) {
        $this->log("🔍 Verificando si todas las cartas del grupo $grupo_id están excluidas...");
    
        $sql = "SELECT COUNT(*) as total, SUM(CASE WHEN excluida = 1 THEN 1 ELSE 0 END) as excluidas
                FROM grupo_multiple_detalle
                WHERE grupo_id = ?";
        $stmt = $this->conexion->prepare($sql);
        $stmt->bind_param("i", $grupo_id);
        $stmt->execute();
        $res = $stmt->get_result()->fetch_assoc();
    
        if ($res && $res['total'] > 0 && $res['total'] == $res['excluidas']) {
            $this->log("🗑 Eliminando grupo múltiple ID: $grupo_id (todas excluidas)");
    
            $del_detalle = $this->conexion->prepare("DELETE FROM grupo_multiple_detalle WHERE grupo_id = ?");
            $del_detalle->bind_param("i", $grupo_id);
            $del_detalle->execute();
    
            $del_grupo = $this->conexion->prepare("DELETE FROM grupo_multiple WHERE id = ?");
            $del_grupo->bind_param("i", $grupo_id);
            $del_grupo->execute();
    
            $this->log("✅ Grupo $grupo_id eliminado correctamente.");
        } else {
            $this->log("❎ No se eliminó el grupo $grupo_id (aún tiene cartas activas)");
        }
    }



}
?>
