// ========================================
// SCRIPT PARA ACTUALIZAR BALANCEADOS
// ========================================
// INSTRUCCIONES:
// 1. Abrir admin.html en el navegador
// 2. Hacer login
// 3. Abrir consola (F12)
// 4. Copiar y pegar este código completo
// 5. Presionar Enter
// ========================================

(async function() {
  console.log("🚀 Iniciando actualización de balanceados...");

  // Importar desde el contexto global de admin.html
  const { db } = await import("./assets/js/firebase.js");
  const {
    collection,
    getDocs,
    doc,
    updateDoc,
    deleteDoc
  } = await import("https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js");

  try {
    // 1. Obtener todos los productos
    console.log("📦 Cargando productos de Firestore...");
    const querySnap = await getDocs(collection(db, "productos"));
    const productos = [];

    querySnap.forEach((docSnap) => {
      productos.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

    console.log(`✅ ${productos.length} productos cargados\n`);

    // Función para buscar productos (case-insensitive, flexible)
    function buscar(texto) {
      const textoLower = texto.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // quitar acentos

      return productos.filter(p => {
        const nombreLower = (p.nombre || "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        return nombreLower.includes(textoLower);
      });
    }

    // Función para actualizar producto
    async function actualizar(id, datos, nombreLog) {
      try {
        await updateDoc(doc(db, "productos", id), datos);
        console.log(`✅ Actualizado: ${nombreLog}`);
        return true;
      } catch (error) {
        console.error(`❌ Error: ${nombreLog}`, error.message);
        return false;
      }
    }

    // Función para eliminar producto
    async function eliminar(id, nombre) {
      try {
        await deleteDoc(doc(db, "productos", id));
        console.log(`🗑️  Eliminado: ${nombre}`);
        return true;
      } catch (error) {
        console.error(`❌ Error eliminando: ${nombre}`, error.message);
        return false;
      }
    }

    // ========================================
    // CONFIGURACIÓN DE ACTUALIZACIONES
    // ========================================

    const configs = [
      {
        nombre: "sieger criadores",
        precioKilo: 4600,
        precioBolsa: 80000
      },
      {
        nombre: "performance adulto",
        precioKilo: 4800,
        precioBolsa: 84000
      },
      {
        nombre: "kenl adulto",
        precioKilo: 3000,
        precioBolsa: 60000
      },
      {
        nombre: "deleita",
        precioKilo: 2800,
        soloKilo: true
      },
      {
        nombre: "dog selection",
        precioKilo: 2400,
        precioBolsa: 42000
      },
      {
        nombre: "jaspe adulto",
        precioKilo: 1900,
        soloKilo: true
      },
      {
        nombre: "gaucho adulto",
        precioKilo: 1500,
        soloKilo: true
      },
      {
        nombre: "super eco",
        precioKilo: 1000,
        precioBolsa: 17000
      },
      {
        nombre: "evolution mordida pequeña",
        precioKilo: 2800,
        soloKilo: true
      },
      {
        nombre: "sieger mordida pequeña",
        precioKilo: 6000,
        soloKilo: true
      },
      {
        nombre: "kenl mordida pequeña",
        precioKilo: 3600,
        soloKilo: true
      }
    ];

    console.log("🔄 Procesando productos...\n");
    console.log("=".repeat(60));

    // ========================================
    // PROCESAR CADA CONFIGURACIÓN
    // ========================================

    for (const cfg of configs) {
      console.log(`\n📝 Buscando: "${cfg.nombre}"`);
      const encontrados = buscar(cfg.nombre);

      if (encontrados.length === 0) {
        console.log(`   ⚠️  No encontrado`);
        continue;
      }

      console.log(`   ✓ Encontrados: ${encontrados.length}`);
      encontrados.forEach((p, i) => {
        console.log(`     ${i + 1}. ${p.nombre} (ID: ${p.id.substring(0, 8)}...)`);
      });

      // Determinar cuál es el producto principal (sin "X15KG", "X20KG", etc.)
      let principal = encontrados.find(p => {
        const n = p.nombre.toLowerCase();
        // Buscar el que tiene solo "kg" o "xkg" sin número antes
        return (n.includes("xkg") || n.includes("x kg")) &&
               !n.match(/x\s*\d+\s*kg/);
      });

      // Si no hay uno con "xkg", tomar el primero
      if (!principal) {
        principal = encontrados[0];
      }

      const duplicados = encontrados.filter(p => p.id !== principal.id);

      // Datos a actualizar
      const datosUpdate = {
        precio: cfg.precioKilo,
        tieneKilo: true,
        tieneBolsa: cfg.soloKilo ? false : true,
        precioKilo: cfg.precioKilo,
        precioBolsa: cfg.soloKilo ? null : cfg.precioBolsa
      };

      // Actualizar principal
      console.log(`   ✨ Principal → ${principal.nombre}`);
      await actualizar(principal.id, datosUpdate, principal.nombre);

      // Eliminar duplicados
      if (duplicados.length > 0) {
        console.log(`   🗑️  Duplicados a eliminar: ${duplicados.length}`);
        for (const dup of duplicados) {
          await eliminar(dup.id, dup.nombre);
        }
      }
    }

    // ========================================
    // CASOS ESPECIALES
    // ========================================

    console.log("\n" + "=".repeat(60));
    console.log("🔧 CASOS ESPECIALES\n");

    // 1. KENL CACHORRO 15KG - eliminar
    console.log("📝 KENL CACHORRO 15KG");
    const kenlCachorro15 = productos.find(p => {
      const n = p.nombre.toLowerCase();
      return n.includes("kenl") &&
             n.includes("cachorro") &&
             (n.includes("15") || n.includes("x15"));
    });

    if (kenlCachorro15) {
      console.log(`   Encontrado: ${kenlCachorro15.nombre}`);
      await eliminar(kenlCachorro15.id, kenlCachorro15.nombre);
    } else {
      console.log("   ⚠️  No encontrado (puede que ya esté eliminado)");
    }

    // 2. GAUCHO CACHORRO - consolidar
    console.log("\n📝 GAUCHO CACHORRO (consolidar duplicados)");
    const gauchoCachorro = buscar("gaucho cachorro");

    if (gauchoCachorro.length > 1) {
      console.log(`   Encontrados: ${gauchoCachorro.length}`);
      gauchoCachorro.forEach(p => console.log(`   - ${p.nombre}`));

      const principal = gauchoCachorro.find(p => {
        const n = p.nombre.toLowerCase();
        return (n.includes("xkg") || n.includes("x kg")) &&
               !n.match(/x\s*\d+\s*kg/);
      }) || gauchoCachorro[0];

      const duplicados = gauchoCachorro.filter(p => p.id !== principal.id);

      // Usar precio del producto principal o 2000 como default
      const precio = principal.precio || 2000;

      const datosUpdate = {
        precio: precio,
        tieneKilo: true,
        tieneBolsa: false,
        precioKilo: precio,
        precioBolsa: null
      };

      console.log(`   ✨ Principal → ${principal.nombre}`);
      await actualizar(principal.id, datosUpdate, principal.nombre);

      if (duplicados.length > 0) {
        console.log(`   🗑️  Eliminando duplicados: ${duplicados.length}`);
        for (const dup of duplicados) {
          await eliminar(dup.id, dup.nombre);
        }
      }
    } else if (gauchoCachorro.length === 1) {
      console.log(`   ✓ Solo hay 1, no hay duplicados`);
    } else {
      console.log(`   ⚠️  No encontrado`);
    }

    // ========================================
    // RESUMEN FINAL
    // ========================================

    console.log("\n" + "=".repeat(60));
    console.log("✨ ACTUALIZACIÓN COMPLETADA\n");
    console.log("📋 Resumen:");
    console.log("   ✓ Productos actualizados con sistema kilo/bolsa");
    console.log("   ✓ Duplicados eliminados");
    console.log("   ✓ Precios configurados");
    console.log("\n🔄 Recarga la página para ver los cambios");
    console.log("=".repeat(60));

  } catch (error) {
    console.error("❌ ERROR GENERAL:", error);
    console.error(error.stack);
  }
})();
