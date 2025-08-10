document.addEventListener("DOMContentLoaded", () => {
  listarProveedores();

  document.getElementById("formProveedor").addEventListener("submit", e => {
    e.preventDefault();

    const id = document.getElementById("id").value;
    const nombre = document.getElementById("nombre").value.trim();
    const tipo_api = document.getElementById("tipo_api").value.trim();
    const descripcion = document.getElementById("descripcion").value.trim();

    const formData = new FormData();
    formData.append("nombre", nombre);
    formData.append("tipo_api", tipo_api);
    formData.append("descripcion", descripcion);
    if (id) formData.append("id", id);

    fetch(`../Ajax/proveedor_api.php?op=${id ? 'editar' : 'crear'}`, {
      method: "POST",
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === "ok") {
          alert("✅ Proveedor guardado correctamente");
          document.getElementById("formProveedor").reset();
          listarProveedores();
        } else {
          alert("❌ Error al guardar proveedor");
        }
      });
  });
});

function listarProveedores() {
  fetch("../Ajax/proveedor_api.php?op=listar")
    .then(res => res.json())
    .then(data => {
      const tbody = document.getElementById("tablaProveedores");
      tbody.innerHTML = "";
      data.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${p.id}</td>
          <td>${p.nombre}</td>
          <td>${p.tipo_api}</td>
          <td>${p.descripcion}</td>
          <td>
            <button class="btn btn-sm btn-warning" onclick='editarProveedor(${JSON.stringify(p)})'>✏️ Editar</button>
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
  document.getElementById("descripcion").value = p.descripcion;
}