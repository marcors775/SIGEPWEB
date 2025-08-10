document.addEventListener("DOMContentLoaded", () => {
  listarProveedores();
  listarProveedoresTabla();

  // Mostrar el modal con Bootstrap
  const botonNuevo = document.getElementById("btnNuevoProveedor");
  if (botonNuevo) {
    botonNuevo.addEventListener("click", () => {
      $('#modalNuevoProveedor').modal('show');
    });
  }

  // Cerrar el modal con Bootstrap
  const cerrar1 = document.getElementById("btnCerrarModalProveedor");
  const cerrar2 = document.getElementById("btnCancelarModalProveedor");

  [cerrar1, cerrar2].forEach(btn => {
    if (btn) {
      btn.addEventListener("click", () => {
        $('#modalNuevoProveedor').modal('hide');
        document.getElementById("formProveedor").reset();
      });
    }
  });

  // Envío del formulario
  const form = document.getElementById("formProveedor");
  if (form) {
    form.addEventListener("submit", e => {
      e.preventDefault();

      const id = document.getElementById("id").value;
      const nombre = document.getElementById("nombre").value.trim();
      const tipo_api = document.getElementById("tipo_api").value.trim();
      const descripcion = document.getElementById("descripcion_proveedor").value.trim();

      const formData = new FormData();
      formData.append("nombre", nombre);
      formData.append("tipo_api", tipo_api);
      formData.append("descripcion", descripcion);
      if (id) formData.append("id", id);

      const operacion = id ? "editar" : "crear";

      fetch(`../Ajax/proveedor_api.php?op=${operacion}`, {
        method: "POST",
        body: formData
      })
        .then(res => res.json())
        .then(data => {
            
          if (data.status === "ok") {
              console.log("🧪 ID del proveedor que se usará:", data.id);
            alert(`✅ Proveedor ${operacion === "crear" ? "creado" : "actualizado"} correctamente`);
            listarProveedores();
            listarProveedoresTabla();

            if (operacion === "crear" && data.id) {
              const client_id = document.getElementById("client_id").value.trim();
              const client_secret = document.getElementById("client_secret").value.trim();
              const redirect_uri = document.getElementById("redirect_uri").value.trim();
            
              const credenciales = new FormData();
              credenciales.append("id_proveedor", data.id);
              credenciales.append("client_id", client_id);
              credenciales.append("client_secret", client_secret);
              credenciales.append("redirect_uri", redirect_uri);
            
              fetch("../Ajax/proveedor_api.php?op=guardar_credenciales", {
                method: "POST",
                body: credenciales
              })
                .then(r => r.text())
                .then(txt => {
                  try {
                    const resp = JSON.parse(txt);
                    if (resp.status === "ok") {
                      window.open(`../Config/onedrive_auth.php?id_proveedor=${data.id}`, "_blank");
                      mostrarEstadoConexion(data.id);
                    } else {
                      console.error("❌ Error al guardar credenciales:", resp.error);
                      alert("❌ Error al guardar credenciales: " + (resp.error || "Desconocido"));
                    }
                  } catch (err) {
                    console.error("❌ RESPUESTA NO ES JSON:", txt);
                    alert("❌ Error inesperado del servidor. Revisa la consola.");
                  }
                })
                .catch(err => {
                  console.error("❌ Error de red:", err);
                  alert("❌ No se pudo conectar con el servidor.");
                });
            }


            form.reset();
            $('#modalNuevoProveedor').modal('hide');
          } else {
            alert("❌ Error al guardar proveedor");
          }
        });
    });
  }

  // Verifica estado de conexión al cambiar proveedor
  const selectProveedor = document.getElementById("selectProveedor");
  if (selectProveedor) {
    selectProveedor.addEventListener("change", function () {
      const id = this.value;
      const icono = document.getElementById("iconoConexion");

      if (!id) {
        if (icono) {
          icono.classList.remove("text-success", "text-warning");
          icono.classList.add("text-danger");
          icono.innerHTML = `<i class="fas fa-times-circle mr-1"></i> Sin proveedor`;
          icono.setAttribute("title", "Seleccione un proveedor válido");
          icono.style.display = "flex";
        }
        return;
      }

      mostrarEstadoConexion(id);
    });
  }
});

function listarProveedores() {
  fetch("../Ajax/proveedor_api.php?op=listar")
    .then(res => res.json())
    .then(data => {
      const select = document.getElementById("selectProveedor");
      if (select) {
        const valorActual = select.value || ""; // captura valor actual si ya existe
        select.innerHTML = '<option value="">Seleccione proveedor</option>';
        
        data.forEach(p => {
          const opt = document.createElement("option");
          opt.value = p.id;
          opt.textContent = p.nombre;
          select.appendChild(opt);
        });

        // Si ya había un proveedor seleccionado, volverlo a asignar
        if (valorActual) {
          select.value = valorActual;
        }

        // Verificar estado visual si hay valor seleccionado al cargar
        const icono = document.getElementById("iconoConexion");
        if (!valorActual && icono) {
          icono.classList.remove("text-success", "text-warning");
          icono.classList.add("text-danger");
          icono.innerHTML = `<i class="fas fa-times-circle mr-1"></i> Sin proveedor`;
          icono.setAttribute("title", "Seleccione un proveedor válido");
          icono.style.display = "flex";
        } else if (valorActual) {
          mostrarEstadoConexion(valorActual);
        }
      }
    });
}

function listarProveedoresTabla() {
  fetch("../Ajax/proveedor_api.php?op=listar")
    .then(res => res.json())
    .then(data => {
      const tabla = document.getElementById("tablaProveedores");
      if (!tabla) return;
      const tbody = tabla.querySelector("tbody");
      tbody.innerHTML = "";

      data.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${p.id}</td>
          <td>${p.nombre}</td>
          <td>${p.tipo_api}</td>
          <td>${p.descripcion}</td>
          <td class="text-nowrap">
            <button class="btn btn-sm btn-warning mr-1" onclick='editarProveedor(${JSON.stringify(p)})'>✏️</button>
            <button class="btn btn-sm btn-danger" onclick='eliminarProveedor(${p.id})'>🗑️</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    });
}

function editarProveedor(p) {
  document.getElementById("id").value = p.id;
  document.getElementById("nombre").value = p.nombre;
  document.getElementById("tipo_api").value = p.tipo_api;
  document.getElementById("descripcion_proveedor").value = p.descripcion;
  alert("⚠️ Recuerda que las credenciales no se editan aquí directamente.");
}

function eliminarProveedor(id) {
  if (!confirm("¿Eliminar este proveedor? Esta acción no se puede deshacer.")) return;

  fetch("../Ajax/proveedor_api.php?op=eliminar", {
    method: "POST",
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `id=${id}`
  })
    .then(res => res.json())
    .then(resp => {
      if (resp.status === "ok") {
        alert("✅ Proveedor eliminado.");
        listarProveedores();
        listarProveedoresTabla();
      } else {
        alert("❌ Error al eliminar.");
      }
    });
}

function mostrarEstadoConexion(idProveedor) {
  fetch(`../Ajax/proveedor_api.php?op=tiene_credenciales&id=${idProveedor}`)
    .then(res => res.json())
    .then(data => {
      const icono = document.getElementById("iconoConexion");
      const authLink = document.getElementById("enlaceAutorizacion");

      if (authLink) {
        authLink.style.display = "none";
        authLink.innerHTML = "";
      }

      if (icono) {
        if (data.existe) {
          icono.classList.remove("text-warning", "text-danger");
          icono.classList.add("text-success");
          icono.innerHTML = `<i class="fas fa-check-circle mr-1"></i> Conectado`;
          icono.setAttribute("title", "La cuenta está conectada a OneDrive");
          icono.style.display = "flex";
        } else {
          icono.classList.remove("text-success", "text-danger");
          icono.classList.add("text-warning");
          icono.innerHTML = `<i class="fas fa-exclamation-circle mr-1"></i> No conectado`;
          icono.setAttribute("title", "Este proveedor aún no está conectado");
          icono.style.display = "flex";
        }
      }
    });
}