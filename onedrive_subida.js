document.addEventListener("DOMContentLoaded", () => {
  const dropArea = document.getElementById("drop-area");
  const input = document.getElementById("fileInput");

  if (!dropArea || !input) return;

  ["dragover", "drop"].forEach(evt =>
    document.addEventListener(evt, e => e.preventDefault())
  );

  const barraContenedor = document.createElement("div");
  barraContenedor.className = "progress mt-2";
  const barra = document.createElement("div");
  barra.className = "progress-bar progress-bar-striped progress-bar-animated";
  barra.style.width = "0%";
  barraContenedor.appendChild(barra);
  dropArea.appendChild(barraContenedor);

  const estado = document.createElement("div");
  estado.id = "estado-subida";
  estado.className = "text-center text-muted mt-2";
  dropArea.appendChild(estado);

  ["dragenter", "dragover"].forEach(evt =>
    dropArea.addEventListener(evt, e => {
      e.preventDefault();
      dropArea.classList.add("dragover");
    })
  );
  ["dragleave", "drop"].forEach(evt =>
    dropArea.addEventListener(evt, e => {
      e.preventDefault();
      dropArea.classList.remove("dragover");
    })
  );

  dropArea.addEventListener("drop", e => {
    e.preventDefault();
    dropArea.classList.remove("dragover");
    const archivos = e.dataTransfer.files;
    if (!archivos.length) return;
    subirArchivos(archivos);
  });

  dropArea.addEventListener("click", e => {
    if (e.target.closest("button")) return;
    input.click();
  });

  input.addEventListener("change", () => {
    if (!input.files.length) return;
    subirArchivos(input.files);
  });

  async function subirArchivos(files) {
    const proveedor = dropArea.dataset.proveedor;
    const parentId = dropArea.dataset.itemId;
    if (!proveedor || !parentId) {
      alert("⚠️ Selecciona proveedor y carpeta primero.");
      return;
    }

    const nombresInvalidos = [...files].filter(f => !f.name || f.size === 0).length;
    if (nombresInvalidos === files.length) {
      alert("⚠️ Arrastrar carpetas directamente no está soportado.\n\nUsa el botón para seleccionar carpetas desde el explorador.");
      return;
    }

    estado.innerHTML = "⏳ Subiendo archivos...";
    barra.style.width = "0%";
    barra.classList.add("bg-info");
    barra.classList.remove("bg-success", "bg-danger");

    let exitosos = 0;
    let fallidos = 0;
    const total = files.length;

    for (let i = 0; i < total; i++) {
      const archivo = files[i];
      const form = new FormData();
      form.append("archivo", archivo);
      form.append("id_proveedor", proveedor);
      form.append("parent_id", parentId);

      if (archivo.webkitRelativePath) {
        form.append("relative_path", archivo.webkitRelativePath);
      }

      try {
        const r = await fetch("../nube/subir_archivo.php", {
          method: "POST",
          body: form,
          credentials: "same-origin"
        });
        const data = await r.json();
        if (data.exito) {
          exitosos++;
        } else {
          fallidos++;
          console.warn("❌ Fallo al subir:", archivo.name, data.error || "");
        }
      } catch {
        fallidos++;
        console.warn("❌ Fallo al subir (conexión):", archivo.name);
      }

      const progreso = Math.round(((i + 1) / total) * 100);
      barra.style.width = progreso + "%";
    }

    if (exitosos > 0) {
      barra.classList.remove("bg-info");
      barra.classList.add("bg-success");
    }
    if (fallidos > 0 && exitosos === 0) {
      barra.classList.remove("bg-info");
      barra.classList.add("bg-danger");
    }

    estado.innerHTML = exitosos > 0
      ? `✅ Subida completada: ${exitosos} archivo(s) subido(s)${fallidos > 0 ? `, ${fallidos} fallido(s)` : ""}`
      : "❌ No se subieron archivos.";

    // 🔁 Refresco automático con espera ligera
    estado.innerHTML += "<br>🔁 Recargando vista automáticamente...";
    setTimeout(() => {
      if (typeof cargarCarpetas === "function") {
        cargarCarpetas(parentId);
      }
    }, 2000);

    // Limpieza visual
    setTimeout(() => {
      estado.innerHTML = "";
      barra.style.width = "0%";
      barra.classList.remove("bg-success", "bg-danger");
      barra.classList.add("bg-info");
    }, 5000);
  }
});