document.addEventListener("DOMContentLoaded", () => {
    const tabla = $("#tablaVistas").DataTable({
        ajax: {
            url: "../Ajax/vistasA.php?op=listar",
            dataSrc: ""
        },
        columns: [
            { data: "id" },
            { data: "nombre" },
            { data: "archivo" },
            { data: "categoria" },
            {
                data: null,
                className: "text-center",
                render: data => `
                    <button class="btn btn-sm btn-info editar" data-id="${data.id}">✏️</button>
                    <button class="btn btn-sm btn-danger eliminar" data-id="${data.id}">🗑️</button>
                `
            }
        ]
    });

    cargarCategorias();

    function cargarCategorias() {
    fetch("../Ajax/vistasA.php?op=categorias")
        .then(res => res.json())
        .then(data => {
            const select = document.getElementById("categoria");
            select.innerHTML = '<option value="">Seleccione</option>';
            data.forEach(cat => {
                const option = document.createElement("option");
                option.value = cat.id; // ✅ se usa el ID
                option.textContent = cat.nombre;
                select.appendChild(option);
            });
        })
        .catch(err => console.error("Error al cargar categorías:", err));
}

    // Guardar vista
    $("#formVista").on("submit", function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const id = $("#vista_id").val();
        if (id) formData.append("id", id);

        fetch("../Ajax/vistasA.php?op=guardar", {
            method: "POST",
            body: formData
        })
        .then(res => res.json())
        .then(resp => {
            if (resp.status === "ok") {
                $("#modalVista").modal("hide");
                this.reset();
                tabla.ajax.reload();
            } else {
                alert(resp.error || "Error al guardar.");
            }
        });
    });

    // Obtener datos para editar
    $("#tablaVistas").on("click", ".editar", function() {
        const id = this.dataset.id;
        fetch(`../Ajax/vistasA.php?op=obtener&id=${id}`)
            .then(res => res.json())
            .then(data => {
                $("#vista_id").val(data.id);
                $("#nombre").val(data.nombre);
                $("#archivo").val(data.archivo);
                $("#categoria").val(data.id_categoria); // usar id_categoria correctamente
                $("#modalVista").modal("show");
            });
    });

    // Eliminar vista
    $("#tablaVistas").on("click", ".eliminar", function() {
        const id = this.dataset.id;
        if (confirm("¿Está seguro de eliminar esta vista?")) {
            const formData = new FormData();
            formData.append("id", id);
            fetch("../Ajax/vistasA.php?op=eliminar", {
                method: "POST",
                body: formData
            })
            .then(res => res.json())
            .then(resp => {
                if (resp.status === "ok") {
                    tabla.ajax.reload();
                } else {
                    alert("Error al eliminar.");
                }
            });
        }
    });
});