// Script para actualizar productos de balanceado
// Ejecutar desde la consola del navegador en admin.html (después de hacer login)

async function actualizarBalanceados() {
  console.log("🚀 Iniciando actualización de balanceados...");

  // Importar Firebase
  const { db } = await import("./public/assets/js/firebase.js");
  const { collection, getDocs, doc, updateDoc, deleteDoc } = await import(
    "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js"
  );

  // 1. Obtener todos los productos
  const querySnap = await getDocs(collection(db, "productos"));
  const productos = [];
  querySnap.forEach((docSnap) => {
    productos.push({
      id: docSnap.id,
      ...docSnap.data()
    });
  });

  console.log(`📦 Total de productos encontrados: ${productos.length}`);

  // Función helper para buscar productos por nombre (flexible)
  function buscarProducto(nombre) {
    const nombreLower = nombre.toLowerCase();
    return productos.filter(p =>
      p.nombre.toLowerCase().includes(nombreLower)
    );
  }

  // Función para actualizar un producto
  async function actualizarProducto(id, datos) {
    try {
      const docRef = doc(db, "productos", id);
      await updateDoc(docRef, datos);
      console.log(`✅ Actualizado: ${datos.nombre || id}`);
      return true;
    } catch (error) {
      console.error(`❌ Error actualizando ${id}:`, error);
      return false;
    }
  }

  // Función para eliminar un producto
  async function eliminarProducto(id, nombre) {
    try {
      await deleteDoc(doc(db, "productos", id));
      console.log(`🗑️ Eliminado: ${nombre}`);
      return true;
    } catch (error) {
      console.error(`❌ Error eliminando ${nombre}:`, error);
      return false;
    }
  }

  // Lista de productos a actualizar
  const actualizaciones = [
    {
      buscar: "sieger criadores",
      precioKilo: 4600,
      precioBolsa: 80000,
      tieneKilo: true,
      tieneBolsa: true
    },
    {
      buscar: "performance adulto",
      precioKilo: 4800,
      precioBolsa: 84000,
      tieneKilo: true,
      tieneBolsa: true
    },
    {
      buscar: "kenl adulto",
      precioKilo: 3000,
      precioBolsa: 60000,
      tieneKilo: true,
      tieneBolsa: true
    },
    {
      buscar: "deleita",
      precioKilo: 2800,
      tieneKilo: true,
      tieneBolsa: false
    },
    {
      buscar: "dog selection",
      precioKilo: 2400,
      precioBolsa: 42000,
      tieneKilo: true,
      tieneBolsa: true
    },
    {
      buscar: "jaspe adulto",
      precioKilo: 1900,
      tieneKilo: true,
      tieneBolsa: false
    },
    {
      buscar: "gaucho adulto",
      precioKilo: 1500,
      tieneKilo: true,
      tieneBolsa: false
    },
    {
      buscar: "super eco",
      precioKilo: 1000,
      precioBolsa: 17000,
      tieneKilo: true,
      tieneBolsa: true
    },
    {
      buscar: "evolution mordida pequeña",
      precioKilo: 2800,
      tieneKilo: true,
      tieneBolsa: false
    },
    {
      buscar: "sieger mordida pequeña",
      precioKilo: 6000,
      tieneKilo: true,
      tieneBolsa: false
    },
    {
      buscar: "kenl mordida pequeña",
      precioKilo: 3600,
      tieneKilo: true,
      tieneBolsa: false
    }
  ];

  console.log("\n🔍 Procesando actualizaciones...\n");

  for (const config of actualizaciones) {
    console.log(`\n📝 Buscando: "${config.buscar}"`);
    const encontrados = buscarProducto(config.buscar);

    if (encontrados.length === 0) {
      console.log(`⚠️ No se encontró ningún producto para "${config.buscar}"`);
      continue;
    }

    console.log(`   Encontrados ${encontrados.length} producto(s):`);
    encontrados.forEach(p => console.log(`   - ${p.nombre} (ID: ${p.id})`));

    // Si hay duplicados (por ejemplo, "XKG" y "X20KG")
    if (encontrados.length > 1) {
      // Determinar cuál es el "principal" (generalmente el que tiene "XKG" o "KG")
      const principal = encontrados.find(p =>
        p.nombre.toLowerCase().includes("kg") &&
        !p.nombre.toLowerCase().match(/x\s*\d+\s*kg/)
      ) || encontrados[0];

      const duplicados = encontrados.filter(p => p.id !== principal.id);

      console.log(`   ✨ Principal: ${principal.nombre}`);
      console.log(`   🗑️ Duplicados a eliminar: ${duplicados.map(d => d.nombre).join(", ")}`);

      // Actualizar el principal
      const datosActualizar = {
        nombre: principal.nombre,
        precio: config.precioKilo, // El precio base es el precio por kilo
        tieneKilo: config.tieneKilo,
        tieneBolsa: config.tieneBolsa || false,
        precioKilo: config.precioKilo,
        precioBolsa: config.precioBolsa || null
      };

      await actualizarProducto(principal.id, datosActualizar);

      // Eliminar duplicados
      for (const dup of duplicados) {
        await eliminarProducto(dup.id, dup.nombre);
      }
    } else {
      // Solo hay uno, actualizar
      const producto = encontrados[0];
      const datosActualizar = {
        precio: config.precioKilo,
        tieneKilo: config.tieneKilo,
        tieneBolsa: config.tieneBolsa || false,
        precioKilo: config.precioKilo,
        precioBolsa: config.precioBolsa || null
      };

      await actualizarProducto(producto.id, datosActualizar);
    }
  }

  // Casos especiales
  console.log("\n🔧 Procesando casos especiales...\n");

  // KENL CACHORRO - borrar el de 15kg
  console.log("📝 Buscando KENL CACHORRO 15kg para eliminar...");
  const kenlCachorro15kg = productos.find(p =>
    p.nombre.toLowerCase().includes("kenl") &&
    p.nombre.toLowerCase().includes("cachorro") &&
    p.nombre.toLowerCase().includes("15")
  );

  if (kenlCachorro15kg) {
    await eliminarProducto(kenlCachorro15kg.id, kenlCachorro15kg.nombre);
  } else {
    console.log("⚠️ No se encontró KENL CACHORRO 15kg");
  }

  // GAUCHO CACHORRO - consolidar XKG y X25KG
  console.log("\n📝 Buscando GAUCHO CACHORRO para consolidar...");
  const gauchoCachorro = buscarProducto("gaucho cachorro");

  if (gauchoCachorro.length > 1) {
    console.log(`   Encontrados ${gauchoCachorro.length} productos GAUCHO CACHORRO`);
    gauchoCachorro.forEach(p => console.log(`   - ${p.nombre} (ID: ${p.id})`));

    // El principal es el que tiene "XKG" o "KG"
    const principal = gauchoCachorro.find(p =>
      p.nombre.toLowerCase().includes("kg") &&
      !p.nombre.toLowerCase().match(/x\s*\d+\s*kg/)
    ) || gauchoCachorro[0];

    const duplicados = gauchoCachorro.filter(p => p.id !== principal.id);

    console.log(`   ✨ Principal: ${principal.nombre}`);
    console.log(`   🗑️ Duplicados a eliminar: ${duplicados.map(d => d.nombre).join(", ")}`);

    // Actualizar principal (solo tiene precio por kilo según la lista)
    const precio = principal.precio || 2000; // Usar precio existente o 2000
    await actualizarProducto(principal.id, {
      nombre: principal.nombre.replace(/X\s*\d+KG/i, "XKG").trim(),
      precio: precio,
      tieneKilo: true,
      tieneBolsa: false,
      precioKilo: precio,
      precioBolsa: null
    });

    // Eliminar duplicados
    for (const dup of duplicados) {
      await eliminarProducto(dup.id, dup.nombre);
    }
  } else if (gauchoCachorro.length === 1) {
    console.log(`   Solo hay 1 GAUCHO CACHORRO, no hay duplicados que eliminar`);
  }

  console.log("\n✨ ¡Actualización completada!\n");
  console.log("📋 Resumen:");
  console.log("   - Productos actualizados con precios por kilo/bolsa");
  console.log("   - Duplicados eliminados");
  console.log("   - Sistema de balanceado configurado");
  console.log("\n🔄 Recarga la página para ver los cambios");
}

// Ejecutar
actualizarBalanceados().catch(console.error);
