document.addEventListener("DOMContentLoaded", () => {
  cargarCarpetas();

  const form = document.getElementById("formEditarCarpeta");
  if (form) {
    form.addEventListener("submit", e => {
      e.preventDefault();
      actualizarCarpeta();
    });
  }
});

function cargarCarpetas() {
  fetch("../Ajax/onedrive_mantenimiento_api.php?op=listar_carpetas")
    .then(res => res.json())
    .then(data => {
      const tbody = document.querySelector("#tablaCarpetas tbody");
      const resumen = document.getElementById("resumenCarpetas");
      tbody.innerHTML = "";

      let enUso = 0;
      let libres = 0;

      data.forEach(item => {
        const tr = document.createElement("tr");

        if (!item.tiene_acceso) {
          tr.classList.add("table-success"); // Verde claro = sin uso
          libres++;
        } else {
          enUso++;
        }

        // Editar deshabilitado siempre, ya que es mantenimiento
        const btnEditar = `<button class="btn btn-sm btn-secondary" disabled title="Solo mantenimiento de eliminación">🔒</button>`;

        const btnEliminar = item.tiene_acceso
          ? `<button class="btn btn-sm btn-secondary" disabled title="Tiene accesos">🔒</button>`
          : `<button class="btn btn-sm btn-danger" onclick="eliminarCarpeta(${item.id})">🗑️</button>`;

        tr.innerHTML = `
          <td>${item.id}</td>
          <td>${item.carpeta}</td>
          <td>${item.descripcion || ''}</td>
          <td>${item.proveedor || ''}</td>
          <td class="text-center">${item.estado == 1 ? '✅ Activo' : '❌ Inactivo'}</td>
          <td class="text-center">${btnEditar} ${btnEliminar}</td>
        `;

        tbody.appendChild(tr);
      });

      resumen.innerHTML = `🔐 ${enUso} en uso &nbsp;&nbsp; 🧹 ${libres} disponibles para eliminar`;
    })
    .catch(err => {
      console.error("❌ Error al consultar API:", err);
      alert("⚠ Error al cargar datos. Verifica consola.");
    });
}

function eliminarCarpeta(id) {
  if (!confirm("¿Está seguro de eliminar esta carpeta?")) return;

  fetch(`../Ajax/onedrive_mantenimiento_api.php?op=verificar_asociaciones&id=${id}`)
    .then(res => res.json())
    .then(resp => {
      if (resp.asociado) {
        alert("⚠️ No se puede eliminar. Tiene accesos asociados.");
      } else {
        if (!confirm("🗑️ ¿Eliminar carpeta definitivamente?")) return;
        fetch(`../Ajax/onedrive_mantenimiento_api.php?op=eliminar_carpeta`, {
          method: "POST",
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `id=${id}`
        })
        .then(res => res.json())
        .then(resp => {
          if (resp.status === "ok") {
            alert("✅ Carpeta eliminada.");
            cargarCarpetas();
          } else {
            alert("❌ Error al eliminar carpeta.");
          }
        });
      }
    });
}

function actualizarCarpeta() {
  // Este método permanece disponible, pero no se usa en este flujo.
  alert("✏️ Edición deshabilitada en este módulo.");
}
