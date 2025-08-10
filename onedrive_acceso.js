document.addEventListener("DOMContentLoaded", () => {
  cargarGestores();
  cargarRoles();
  cargarAccesos();
  document.getElementById("rol_id").closest(".form-group")?.classList.add("d-none");
  document.getElementById("btnNuevoProveedor")?.addEventListener("click", () => {
    $('#modalNuevoProveedor').modal('show');
  });

  document.getElementById("gestor_id")?.addEventListener("change", () => {
    const gestorId = document.getElementById("gestor_id").value;
    const rolSelect = document.getElementById("rol_id");
    rolSelect.innerHTML = '<option value="">Seleccione un rol</option>';
    rolSelect.classList.remove("bg-warning", "font-weight-bold");
    rolSelect.disabled = false;

    if (!gestorId) return;

    fetch(`../Ajax/onedrive_api.php?op=rol_por_gestor&gestor_id=${gestorId}`)
      .then(res => res.json())
      .then(data => {
        if (data?.id) {
          const opt = document.createElement("option");
          opt.value = data.id;
          opt.textContent = "🔒 " + data.tipo_rol;
          opt.selected = true;
          rolSelect.appendChild(opt);
          rolSelect.disabled = true;
          rolSelect.classList.add("bg-warning", "font-weight-bold");
        }
      })
      .catch(console.error);
  });

  document.getElementById("selectProveedor")?.addEventListener("change", () => {
    const container = document.getElementById("carpetaContainer");
    container.innerHTML = '<small class="text-muted">Seleccione una carpeta</small>';
    window.nube_historial = [];
    crearNivelSelect(null, 0);
  });

  document.getElementById("btnCancelarEdicion")?.addEventListener("click", resetFormulario);

  document.getElementById("btnGuardarAcceso")?.addEventListener("click", async () => {
    const selects = document.querySelectorAll(".carpeta-select");
    const ultimaSeleccion = Array.from(selects).reverse().find(sel => sel.value !== "");
    const itemId = ultimaSeleccion?.selectedOptions?.[0]?.dataset?.id || null;
    const ruta = ultimaSeleccion?.value || "";

    const descripcion = document.getElementById("descripcion").value.trim();
    const gestorId = document.getElementById("gestor_id").value;
    const proveedorId = document.getElementById("selectProveedor")?.value || "";

    if (!proveedorId || !ruta || !itemId || !gestorId) {
      alert("⚠️ Complete todos los campos requeridos.");
      return;
    }

    const formData = new FormData();
    formData.append("ruta", ruta);
    formData.append("item_id", itemId);
    formData.append("descripcion", descripcion);
    formData.append("gestor_id", gestorId);
    
    formData.append("id_proveedor", proveedorId);

    const isEdit = document.getElementById("btnGuardarAcceso").dataset.editar;
    const url = isEdit
      ? `../Ajax/onedrive_api.php?op=actualizar_acceso&id=${isEdit}`
      : "../Ajax/onedrive_api.php?op=asignar_acceso";

    try {
      const res = await fetch(url, { method: "POST", body: formData });
      const txt = await res.text();
      const resp = JSON.parse(txt);

      if (resp.status === "ok") {
        alert(`✅ Acceso ${isEdit ? 'actualizado' : 'asignado'} correctamente.`);
        cargarAccesos();
        resetFormulario();
      } else {
        alert("❌ Error: " + (resp.error || "No se pudo guardar el acceso."));
      }
    } catch (err) {
      console.error("❌ Error inesperado:", err);
      alert("❌ Fallo al conectar con el servidor.");
    }
  });
});

// crearNivelSelect y carga de roles/gestores
function crearNivelSelect(parentId, nivel) {
  const proveedorId = document.getElementById("selectProveedor")?.value;
  if (!proveedorId) return;

  const url = `../Ajax/onedrive_listar_root.php?id_proveedor=${proveedorId}` + (parentId ? `&parent=${parentId}` : '');

  fetch(url)
    .then(res => res.text())
    .then(txt => {
      let data;
      try {
        data = JSON.parse(txt);
      } catch (err) {
        console.error("❌ Respuesta no válida:", txt);
        alert("❌ Error inesperado al obtener carpetas.");
        return;
      }

      if (data.error) {
        alert(data.error);
        return;
      }

      const container = document.getElementById("carpetaContainer");
      Array.from(container.querySelectorAll('[data-nivel]'))
        .filter(div => parseInt(div.dataset.nivel) >= nivel)
        .forEach(div => div.remove());

      if (!Array.isArray(data) || data.length === 0) return;

      const div = document.createElement("div");
      div.className = "form-group";
      div.dataset.nivel = nivel;

      const select = document.createElement("select");
      select.className = "form-control carpeta-select";
      select.innerHTML = '<option value="">Seleccione...</option>';

      data.forEach(folder => {
        const opt = document.createElement("option");
        opt.value = folder.path;
        opt.textContent = folder.name;
        opt.dataset.id = folder.id;
        select.appendChild(opt);
      });

      select.addEventListener("change", () => {
        const nivelActual = parseInt(div.dataset.nivel);
        Array.from(container.querySelectorAll('[data-nivel]'))
          .filter(d => parseInt(d.dataset.nivel) > nivelActual)
          .forEach(d => d.remove());

        const selected = select.options[select.selectedIndex];
        const folderId = selected.dataset.id;
        const inputDesc = document.getElementById("descripcion");

        if (folderId) {
          crearNivelSelect(folderId, nivelActual + 1);

          fetch(`../Ajax/onedrive_api.php?op=buscar_por_item_id&item_id=${folderId}&id_proveedor=${proveedorId}`)
            .then(res => res.json())
            .then(data => {
              if (data?.descripcion !== undefined) {
                inputDesc.value = data.descripcion;
                inputDesc.setAttribute("readonly", true);
                inputDesc.classList.add("bg-light");
              } else {
                inputDesc.value = "";
                inputDesc.removeAttribute("readonly");
                inputDesc.classList.remove("bg-light");
              }
            });
        }
      });

      div.appendChild(select);
      container.appendChild(div);
    })
    .catch(err => {
      console.error("❌ Error al cargar carpetas:", err);
      alert("❌ No se pudo conectar al servidor.");
    });
}

function cargarGestores() {
  const select = document.getElementById("gestor_id");
  select.innerHTML = '<option>Cargando...</option>';
  fetch("../Ajax/onedrive_api.php?op=listar_gestores")
    .then(res => res.json())
    .then(data => {
      select.innerHTML = '<option value="">Seleccione un gestor</option>';
      data.forEach(usuario => {
        const opt = document.createElement("option");
        opt.value = usuario.id;
        opt.textContent = `${usuario.id} - ${usuario.nombre}`;
        select.appendChild(opt);
      });
    })
    .catch(() => {
      select.innerHTML = '<option value="">❌ Error al cargar gestores</option>';
    });
}

function cargarRoles() {
  const select = document.getElementById("rol_id");
  select.innerHTML = '<option>Cargando...</option>';
  fetch("../Ajax/onedrive_api.php?op=listar_roles")
    .then(res => res.json())
    .then(data => {
      select.innerHTML = '<option value="">Seleccione un rol</option>';
      data.forEach(rol => {
        const opt = document.createElement("option");
        opt.value = rol.id;
        opt.textContent = `${rol.id} - ${rol.nombre}`;
        select.appendChild(opt);
      });
    })
    .catch(() => {
      select.innerHTML = '<option value="">❌ Error al cargar roles</option>';
    });
}
// funciones cargarAccesos, mostrarUsuariosCompartidos, editarAcceso, eliminarAcceso y resetFormulario
function cargarAccesos() {
  fetch("../Ajax/onedrive_api.php?op=accesos_asignados_todos")
    .then(res => res.json())
    .then(data => {
      const tabla = $('#tablaAccesos');
      if ($.fn.DataTable.isDataTable('#tablaAccesos')) {
        tabla.DataTable().clear().destroy();
      }

      const tbody = document.querySelector("#tablaAccesos tbody");
      let html = "";
      const itemAccessCount = {};

      data.forEach(item => {
        itemAccessCount[item.item_id] = (itemAccessCount[item.item_id] || 0) + 1;
      });

      data.forEach((item, index) => {
        html += `
          <tr>
            <td>${index + 1}</td>
            <td>
              ${item.carpeta}
              ${itemAccessCount[item.item_id] > 1
                ? `<button class='btn btn-link p-0 text-info' onclick='mostrarUsuariosCompartidos("${item.item_id}")'>👥</button>` : ''}
            </td>
            <td>${item.descripcion || ''}</td>
            <td>${item.proveedor || ''}</td>
            <td>${item.gestor || ''}</td>
            <td>${item.rol || ''}</td>
            <td class="text-center">
              <button class="btn btn-sm btn-warning mr-2" onclick="editarAcceso(${item.id})">✏️</button>
              <button class="btn btn-sm btn-danger" onclick="eliminarAcceso(${item.id})">🗑️</button>
            </td>
          </tr>
        `;
      });

      tbody.innerHTML = html;

      $('#tablaAccesos').DataTable({
        pageLength: 10,
        responsive: true,
        language: {
          url: "//cdn.datatables.net/plug-ins/1.13.4/i18n/es-ES.json"
        }
      });
    })
    .catch(err => {
      console.error("❌ Error al cargar accesos:", err);
      alert("❌ No se pudo cargar la tabla de accesos.");
    });
}

function mostrarUsuariosCompartidos(itemId) {
  fetch(`../Ajax/onedrive_api.php?op=usuarios_por_carpeta&item_id=${itemId}`)
    .then(res => res.json())
    .then(data => {
      const lista = document.getElementById("listaCompartido");
      lista.innerHTML = "";

      if (data.length === 0) {
        lista.innerHTML = "<li class='list-group-item text-muted'>Sin usuarios asociados</li>";
      } else {
        data.forEach(user => {
          lista.innerHTML += `<li class='list-group-item'>👤 ${user.gestor || "(sin nombre)"} <br><small class="text-muted">Rol: ${user.rol || "-"}</small></li>`;
        });
      }

      $('#modalCompartido').modal('show');
    })
    .catch(err => {
      alert("Error al consultar usuarios compartidos");
      console.error(err);
    });
}

function eliminarAcceso(id) {
  if (!confirm("¿Está seguro de eliminar este acceso?")) return;

  fetch("../Ajax/onedrive_api.php?op=revocar_acceso", {
    method: "POST",
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `id=${id}`
  })
    .then(res => res.json())
    .then(resp => {
      if (resp.status === "ok") {
        alert("✅ Acceso eliminado correctamente.");
        cargarAccesos();
      } else {
        alert("❌ No se pudo eliminar el acceso.");
      }
    })
    .catch(err => console.error("❌ Error al eliminar acceso:", err));
}

function editarAcceso(id) {
  fetch(`../Ajax/onedrive_api.php?op=obtener_acceso&id=${id}`)
    .then(res => res.json())
    .then(data => {
      if (!data || !data.id) {
        alert("❌ No se pudo cargar el acceso.");
        return;
      }

      document.getElementById("descripcion").value = data.descripcion || "";
      document.getElementById("gestor_id").value = data.cedula || "";

      const rolSelect = document.getElementById("rol_id");
      rolSelect.innerHTML = '<option value="">Seleccione un rol</option>';

      if (data.rol_id) {
        const opt = document.createElement("option");
        opt.value = data.rol_id;
        opt.textContent = "🔒 Rol asignado";
        opt.selected = true;
        rolSelect.appendChild(opt);
        rolSelect.disabled = true;
        rolSelect.classList.add("bg-warning", "font-weight-bold");
      } else {
        rolSelect.disabled = false;
        rolSelect.classList.remove("bg-warning", "font-weight-bold");
      }

      const selectProveedor = document.getElementById("selectProveedor");
      selectProveedor.value = data.id_proveedor;
      selectProveedor.dataset.itemIdEditar = data.item_id;

      const event = new Event('change');
      selectProveedor.dispatchEvent(event);

      const btn = document.getElementById("btnGuardarAcceso");
      btn.textContent = "✏️ Actualizar Acceso";
      btn.classList.remove("btn-success");
      btn.classList.add("btn-warning");
      btn.dataset.editar = id;

      document.getElementById("btnCancelarEdicion").classList.remove("d-none");
    })
    .catch(err => {
      console.error("❌ Error al cargar datos del acceso:", err);
      alert("❌ Fallo al cargar el acceso.");
    });
}

function resetFormulario() {
  document.getElementById("descripcion").value = "";
  document.getElementById("gestor_id").value = "";
  document.getElementById("rol_id").value = "";

  crearNivelSelect(null, 0);

  const btn = document.getElementById("btnGuardarAcceso");
  btn.textContent = "💾 Guardar Acceso";
  btn.classList.remove("btn-warning");
  btn.classList.add("btn-success");
  delete btn.dataset.editar;

  const rolSelect = document.getElementById("rol_id");
  rolSelect.classList.remove("bg-warning", "font-weight-bold");
  rolSelect.disabled = false;
  rolSelect.innerHTML = '<option value="">Seleccione un rol</option>';
}
//  incluye la función exportarTablaXLSX
function exportarTablaXLSX() {
  const tabla = document.getElementById("tablaAccesos");
  if (!tabla) return;

  const filas = tabla.querySelectorAll("thead tr, tbody tr");
  const data = [];

  filas.forEach(tr => {
    const row = [];
    tr.querySelectorAll("th, td").forEach(td => {
      row.push(td.textContent.trim());
    });
    data.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Accesos");

  XLSX.writeFile(wb, "accesos_onedrive.xlsx");
}
