async function descargarCarpetaPorLotes(itemId, nombreCarpeta) {
  // 🔁 Consultar el tamaño para confirmar si es posible usar esta estrategia
  const response = await fetch(`../nube/consultar_peso.php?item_id=${itemId}`);
  const datos = await response.json();

  if (!datos || !datos.mb || datos.opcion === "individual") {
    alert("❌ No se puede procesar esta carpeta automáticamente.");
    return;
  }

  // 🔁 Obtener los hijos de la carpeta desde el backend
  const hijosRes = await fetch(`../nube/obtener_items_hijos.php?item_id=${itemId}`);
  const hijosData = await hijosRes.json();

  if (!Array.isArray(hijosData) || hijosData.length === 0) {
    alert("❌ No se encontraron archivos en esta carpeta.");
    return;
  }

  const archivos = hijosData.filter(i => !i.folder);
  const itemIds = archivos.map(i => i.id);

  const lotes = [];
  for (let i = 0; i < itemIds.length; i += 10) {
    lotes.push(itemIds.slice(i, i + 10));
  }

  for (let i = 0; i < lotes.length; i++) {
    await descargarLote(lotes[i], i + 1);
  }

  setTimeout(() => {
    window.location.href = "../nube/unir_zips.php";
  }, 1000);
}

async function descargarLote(ids, numero) {
  const form = new FormData();
  form.append("id_proveedor", 1);
  ids.forEach(id => form.append("item_ids[]", id));

  const response = await fetch("../nube/descargar_zip_multiple.php", {
    method: "POST",
    body: form
  });

  if (!response.ok) {
    alert(`❌ Error en lote ${numero}`);
    return;
  }

  const blob = await response.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `parte_${numero}.zip`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  await new Promise(res => setTimeout(res, 1000));
}
