document.addEventListener("DOMContentLoaded", () => {
  const selectorContenedor = document.getElementById("selectorContenedor");
  const contenedor = document.getElementById("contenedorCarpetas");
  const btnVolver = document.getElementById("btnVolver");
  const btnInicio = document.getElementById("btnInicio");
  const btnDescargaMultiple = document.getElementById("btnDescargaMultiple");
  const contadorPeso = document.createElement("span");

  let modoVista = "grid";
  let historial = [];
  let idProveedorSeleccionado = null;

  btnDescargaMultiple.className = "btn btn-outline-primary mb-3 d-none";
  btnDescargaMultiple.innerHTML = "<i class='fas fa-box-open me-1'></i> Descargar seleccionados ZIP ";
  contadorPeso.id = "contadorPeso";
  contadorPeso.className = "badge bg-info text-dark ms-2";
  contadorPeso.textContent = "0 MB";
  btnDescargaMultiple.appendChild(contadorPeso);

  function resetContenedor() {
    contenedor.innerHTML = "";
    document.querySelectorAll(".seleccion-zip").forEach(cb => {
      cb.checked = false;
      cb.disabled = false;
    });
    btnDescargaMultiple.classList.add("d-none");
    contadorPeso.textContent = "0 MB";
  }

  function renderBarraHerramientas(proveedores, activo = null) {
    selectorContenedor.innerHTML = `
      <div class="toolbar-nube d-flex flex-wrap gap-2 w-100">
        <select id="selectProveedor" class="form-control w-auto">
          <option value="">-- Seleccionar proveedor --</option>
          ${proveedores.map(p => `<option value="${p.id_proveedor}" ${p.id_proveedor == activo ? "selected" : ""}>${p.proveedor_nombre}</option>`).join("")}
        </select>
        <input type="text" id="nombreCarpeta" class="form-control w-auto" placeholder="Nombre de nueva carpeta">
        <button class="btn btn-success w-auto" id="btnCrearCarpeta" title="Crear carpeta"><i class="fas fa-plus"></i></button>
        <button id="toggleVista" class="btn btn-outline-secondary w-auto" title="Cambiar vista">
          <i class="fas ${modoVista === "grid" ? "fa-list" : "fa-th"}"></i>
        </button>
      </div>
    `;

    document.getElementById("selectProveedor").addEventListener("change", e => {
      idProveedorSeleccionado = parseInt(e.target.value);
      document.getElementById("drop-area").dataset.proveedor = idProveedorSeleccionado;
      historial = [];
      cargarCarpetas(null);
    });

    document.getElementById("toggleVista").addEventListener("click", () => {
      modoVista = modoVista === "lista" ? "grid" : "lista";
      cargarCarpetas(historial.at(-1)?.id || null);
    });

    document.getElementById("btnCrearCarpeta").addEventListener("click", () => {
      const nombre = document.getElementById("nombreCarpeta").value.trim();
      const drop = document.getElementById("drop-area");
    
      if (!drop.dataset.itemId) {
        alert("⚠️ No puedes crear o cargar archivos en la carpeta raíz. Por favor ingresa primero a una carpeta.");
        return;
      }
    
      if (!nombre || !drop.dataset.proveedor) {
        alert("⚠️ Debes ingresar un nombre y seleccionar un proveedor.");
        return;
      }
      
      const form = new FormData();
      form.append("nombre", nombre);
      form.append("parent", drop.dataset.itemId);
      form.append("id_proveedor", drop.dataset.proveedor);

      fetch("../nube/crear_carpeta.php", {
        method: "POST",
        body: form
      })
        .then(r => r.json())
        .then(data => {
          if (data.exito) {
            alert("✅ Carpeta creada.");
            document.getElementById("nombreCarpeta").value = "";
            cargarCarpetas(drop.dataset.itemId);
          } else {
            alert(data.error || "❌ No se pudo crear la carpeta.");
          }
        })
        .catch(() => alert("❌ Error al crear carpeta."));
    });
  }

  function cargarCarpetas(ruta = null) {
    resetContenedor();
    contenedor.innerHTML = '<div class="col-12 text-center text-muted">⏳ Cargando...</div>';

    const dropArea = document.getElementById("drop-area");
    if (dropArea) {
      dropArea.dataset.itemId = ruta || "";
      dropArea.dataset.proveedor = idProveedorSeleccionado || "";
    }

    const params = new URLSearchParams();
    if (idProveedorSeleccionado) params.append("id_proveedor", idProveedorSeleccionado);
    if (ruta) params.append("parent", ruta);
    const url = `../Ajax/onedrive_listar_mis_accesos.php?${params.toString()}`;

    fetch(`${url}&_=${Date.now()}`, { cache: "no-store" })
      .then(res => res.json())
      .then(data => {
        if (data.estado === "seleccionar") return renderBarraHerramientas(data.proveedores);
        renderBarraHerramientas(data.proveedores || [], data.proveedor_activo);
        contenedor.innerHTML = "";
        contenedor.className = modoVista === "grid" ? "row g-3" : "";

        if (!Array.isArray(data.resultado) || data.resultado.length === 0) {
          contenedor.innerHTML = '<div class="col-12 text-center text-muted">⚠️ Carpeta vacía o sin acceso.</div>';
          return;
        }

        const ultima = historial.at(-1)?.path || "Raíz";
        const soloNombre = ultima.split("/").filter(Boolean).pop() || "Raíz";
        document.getElementById("tituloRuta").textContent = `📁 Mis Carpetas Asignadas - ${soloNombre}`;

        const fragment = document.createDocumentFragment();
        data.resultado.forEach(item => {
          const col = document.createElement("div");
          col.className = modoVista === "grid" ? "col-md-6 col-lg-4" : "col-12 mb-2";

          const claseVista = modoVista === "grid"
            ? "flex-column text-center p-3 position-relative clickable-folder"
            : "flex-row align-items-center p-3 lista clickable-folder";

          const checkHTML = modoVista === "grid"
            ? `<input type="checkbox" class="form-check-input seleccion-zip checkbox-esquina" id="chk-${item.id}" data-id="${item.id}">`
            : `<div class="me-2"><input type="checkbox" class="form-check-input seleccion-zip" id="chk-${item.id}" data-id="${item.id}"></div>`;

          const icono = item.tipo === "archivo"
            ? '<i class="fas fa-file-alt text-secondary"></i>'
            : '<i class="fas fa-folder text-warning"></i>';

          const div = document.createElement("div");
          div.className = `card card-folder d-flex ${claseVista}`;
          div.dataset.id = item.id;
          div.dataset.path = item.path;
          div.dataset.tipo = item.tipo;

          div.innerHTML = `
            ${checkHTML}
            <div class="icon">${icono}</div>
            <div class="flex-grow-1 d-flex w-100 ${modoVista === "grid" ? "flex-column text-center align-items-center justify-content-center" : "fila-carpeta"}">
              <div class="text-truncate ${modoVista === "lista" ? "me-3" : "w-100"}">
                <div class="fw-bold nombre-archivo" title="${item.name}">${item.name}</div>
                <div class="text-muted small">${item.tipo}</div>
              </div>
              ${modoVista === "lista" ? `
                <div class="acciones-folder d-flex gap-2 ms-auto align-items-center justify-content-end flex-wrap">
                  ${item.tipo === "carpeta"
                    ? `<button class="btn btn-sm btn-outline-primary btn-abrir" data-id="${item.id}" data-fullpath="${item.path}" title="Abrir"><i class="fas fa-folder-open"></i></button>`
                    : `
                      <a href="../nube/descargar_archivo.php?item_id=${item.id}&id_proveedor=${idProveedorSeleccionado}" class="btn btn-sm btn-outline-success" title="Descargar"><i class="fas fa-download"></i></a>
                      <button class="btn btn-sm btn-outline-info btn-ver" data-id="${item.id}" title="Vista previa"><i class="fas fa-eye"></i></button>
                      ${["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(item.name.split(".").pop().toLowerCase())
                        ? `<button class="btn btn-sm btn-outline-warning btn-editar" data-id="${item.id}" title="Editar en línea"><i class="fas fa-pen"></i></button>` : ""}
                    `}
                  <button class="btn btn-sm btn-outline-danger btn-eliminar" data-id="${item.id}" data-name="${item.name}" title="Eliminar"><i class="fas fa-trash"></i></button>
                  <span class="acciones-descarga"></span>
                </div>
              ` : ""}
            </div>
            ${modoVista === "grid" ? `
              <div class="acciones-folder d-flex gap-2 justify-content-center align-items-center flex-wrap mt-2">
                ${item.tipo === "carpeta"
                  ? `<button class="btn btn-sm btn-outline-primary btn-abrir" data-id="${item.id}" data-fullpath="${item.path}" title="Abrir"><i class="fas fa-folder-open"></i></button>`
                  : `
                    <a href="../nube/descargar_archivo.php?item_id=${item.id}&id_proveedor=${idProveedorSeleccionado}" class="btn btn-sm btn-outline-success" title="Descargar"><i class="fas fa-download"></i></a>
                    <button class="btn btn-sm btn-outline-info btn-ver" data-id="${item.id}" title="Vista previa"><i class="fas fa-eye"></i></button>
                    ${["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(item.name.split(".").pop().toLowerCase())
                      ? `<button class="btn btn-sm btn-outline-warning btn-editar" data-id="${item.id}" title="Editar en línea"><i class="fas fa-pen"></i></button>` : ""}
                  `}
                <button class="btn btn-sm btn-outline-danger btn-eliminar" data-id="${item.id}" data-name="${item.name}" title="Eliminar"><i class="fas fa-trash"></i></button>
                <span class="acciones-descarga"></span>
              </div>
            ` : ""}
          `;

          if (item.tipo === "carpeta") {
            const abrir = div.querySelector(".btn-abrir");
            abrir.addEventListener("click", e => {
              e.preventDefault();
              const id = abrir.dataset.id;
              if (!historial.length || historial.at(-1)?.id !== id)
                historial.push({ id, path: abrir.dataset.fullpath });
              cargarCarpetas(id);
            });
            window.validarPesoDescarga(item.id, div.querySelector(".acciones-descarga"));
          }

          fragment.appendChild(col);
          col.appendChild(div);
        });

        contenedor.appendChild(fragment);

        document.querySelectorAll(".clickable-folder").forEach(div => {
          div.addEventListener("click", e => {
            if (
              e.target.closest("button") ||
              e.target.closest("a") ||
              e.target.closest("input") ||
              e.defaultPrevented
            ) return;
            if (div.dataset.tipo !== "carpeta") return;
            const id = div.dataset.id;
            const path = div.dataset.path;
            if (id && path) {
              if (!historial.length || historial.at(-1)?.id !== id)
                historial.push({ id, path });
              cargarCarpetas(id);
            }
          });
        });

        btnVolver.classList.toggle("d-none", historial.length === 0);
        btnInicio.classList.toggle("d-none", historial.length === 0);
        // Vista previa
        document.querySelectorAll(".btn-ver").forEach(btn => {
          btn.addEventListener("click", () => {
            const id = btn.dataset.id;
            fetch(`../nube/obtener_link_vista_publica.php?item_id=${id}&id_proveedor=${idProveedorSeleccionado}`)
              .then(r => r.json())
              .then(data => {
                const webUrl = data?.webUrl;
                if (!webUrl) return alert("❌ No se pudo generar el enlace de vista previa.");
                window.open(webUrl, "_blank");
              })
              .catch(() => alert("❌ Error al obtener enlace de vista previa."));
          });
        });

        // Botón EDITAR (solo para archivos editables)
        document.querySelectorAll(".btn-editar").forEach(btn => {
          btn.addEventListener("click", () => {
            const id = btn.dataset.id;
            fetch(`../nube/obtener_link_vista_publica.php?item_id=${id}&id_proveedor=${idProveedorSeleccionado}&modo=edit`)
              .then(r => r.json())
              .then(data => {
                const webUrl = data?.webUrl;
                if (!webUrl) return alert("❌ No se pudo generar el enlace de edición.");
                window.open(webUrl, "_blank");
              })
              .catch(() => alert("❌ Error al obtener enlace de edición."));
          });
        });

        // Eliminar
        document.querySelectorAll(".btn-eliminar").forEach(btn => {
          btn.addEventListener("click", () => {
            if (!confirm("¿Eliminar este archivo?")) return;
            const id = btn.dataset.id;
            fetch("../nube/eliminar_archivo.php", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ item_id: id, id_proveedor: idProveedorSeleccionado })
            }).then(r => {
              if (r.ok) {
                alert("✅ Eliminado");
                cargarCarpetas(historial.at(-1)?.id || null);
              } else {
                alert("❌ No se pudo eliminar.");
              }
            });
          });
        });
      });
  }

  window.cargarCarpetas = cargarCarpetas;

  // ✅ Nuevo sistema de control por cola para evitar sobrecarga del servidor
    const colaPeso = [];
    let concurrentes = 0;
    const LIMITE_CONCURRENCIA = 3;
    
    window.validarPesoDescarga = function (itemId, contenedor) {
      colaPeso.push({ itemId, contenedor });
      procesarColaPeso();
    };
    
    async function procesarColaPeso() {
      if (concurrentes >= LIMITE_CONCURRENCIA || colaPeso.length === 0) return;
    
      const { itemId, contenedor } = colaPeso.shift();
      concurrentes++;
    
      try {
        const res = await fetch(`../nube/consultar_peso.php?item_id=${itemId}&id_proveedor=${idProveedorSeleccionado}`);
        const data = await res.json();
    
        if (data && !isNaN(data.mb) && Number(data.mb) <= 100 && data.opcion === "directo") {
          const check = document.querySelector(`#chk-${itemId}`);
          if (check) {
            const btn = document.createElement("a");
            btn.href = `../nube/descargar_zip.php?item_id=${itemId}&id_proveedor=${idProveedorSeleccionado}`;
            btn.className = "btn btn-outline-secondary btn-sm align-self-center";
            btn.innerHTML = '<i class="fas fa-file-archive"></i> ZIP';
            contenedor.appendChild(btn);
          }
        }
      } catch (e) {
        console.warn("Error consultando peso para:", itemId, e);
      } finally {
        concurrentes--;
        procesarColaPeso(); // Sigue con el siguiente
      }
    }
  btnVolver.addEventListener("click", () => {
    historial.pop();
    const anterior = historial.at(-1) || null;
    cargarCarpetas(anterior?.id || null);
  });

  btnInicio.addEventListener("click", () => {
    historial = [];
    cargarCarpetas(null);
  });

  btnDescargaMultiple.addEventListener("click", async () => {
    btnDescargaMultiple.disabled = true;
    btnDescargaMultiple.innerHTML = "⏳ Procesando...";
    btnDescargaMultiple.appendChild(contadorPeso);

    const seleccionados = document.querySelectorAll(".seleccion-zip:checked");
    if (seleccionados.length === 0) {
      alert("⚠️ No has seleccionado ningún elemento.");
      btnDescargaMultiple.disabled = false;
      btnDescargaMultiple.innerHTML = "<i class='fas fa-box-open me-1'></i> Descargar seleccionados ZIP ";
      btnDescargaMultiple.appendChild(contadorPeso);
      return;
    }

    let totalMB = 0;
    const ids = [];

    for (const cb of seleccionados) {
      const itemId = cb.dataset.id;
      try {
        const res = await fetch(`../nube/consultar_peso.php?item_id=${itemId}&id_proveedor=${idProveedorSeleccionado}`);
        const data = await res.json();
        if (!data || isNaN(data.mb)) continue;
        const mb = Number(data.mb);
        if (totalMB + mb > 200) {
          alert("❌ Límite de 200MB alcanzado. Cancela la selección y vuelve a intentar.");
          btnDescargaMultiple.disabled = false;
          btnDescargaMultiple.innerHTML = "<i class='fas fa-box-open me-1'></i> Descargar seleccionados ZIP ";
          btnDescargaMultiple.appendChild(contadorPeso);
          return;
        }
        totalMB += mb;
        ids.push(itemId);
      } catch {}
    }

    const form = new FormData();
    form.append("id_proveedor", idProveedorSeleccionado);
    ids.forEach(id => form.append("item_ids[]", id));

    const response = await fetch("../nube/descargar_zip_multiple.php", { method: "POST", body: form });
    if (!response.ok) {
      alert("❌ Falló la descarga.");
      btnDescargaMultiple.disabled = false;
      btnDescargaMultiple.innerHTML = "<i class='fas fa-box-open me-1'></i> Descargar seleccionados ZIP ";
      btnDescargaMultiple.appendChild(contadorPeso);
      return;
    }

    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "descarga_lote.zip";
    link.click();

    alert("✅ Archivos descargados correctamente.");
    btnDescargaMultiple.disabled = false;
    btnDescargaMultiple.innerHTML = "<i class='fas fa-box-open me-1'></i> Descargar seleccionados ZIP ";
    btnDescargaMultiple.appendChild(contadorPeso);
  });

  document.addEventListener("change", async e => {
    if (!e.target.classList.contains("seleccion-zip")) return;

    let total = 0;
    const checks = document.querySelectorAll(".seleccion-zip");
    for (const check of checks) {
      if (!check.checked || check.disabled) continue;
      const res = await fetch(`../nube/consultar_peso.php?item_id=${check.dataset.id}&id_proveedor=${idProveedorSeleccionado}`);
      const data = await res.json();
      if (data && !isNaN(data.mb)) total += Number(data.mb);
    }

    contadorPeso.textContent = `${Math.round(total)} MB`;

    if (total >= 200) {
      checks.forEach(c => {
        if (!c.checked) c.disabled = true;
      });
    } else {
      checks.forEach(c => c.disabled = false);
    }

    const algunoSeleccionado = [...checks].some(cb => cb.checked);
    btnDescargaMultiple.classList.toggle("d-none", !algunoSeleccionado);
  });

  cargarCarpetas();
});