// kalia-export.js
// Lógica pura de transformación Niki -> KalIA Stock. Sin dependencias de
// Firebase ni del DOM para poder testearla con Node directamente.

export const KALIA_MAX_PRODUCTOS_POR_ARCHIVO = 500;

export const KALIA_COLUMNAS = [
  "nombre",
  "tipo_venta",
  "unidad",
  "precio",
  "stock",
  "stock_minimo",
  "codigo_barras",
  "costo",
  "categoria",
  "estado",
];

function numeroValido(valor) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Transforma un producto de Niki al formato de fila que espera KalIA.
 * Devuelve null cuando el producto no debe exportarse (nombre o precio inválidos).
 */
export function transformarProductoKalia(producto) {
  const nombre = (producto.nombre || "").toString().trim();
  if (!nombre) return null;

  let tipo_venta = "UNIT";
  let unidad = "UNIT";
  let precio = numeroValido(producto.precio);

  if (producto.tieneKilo) {
    tipo_venta = "WEIGHT";
    unidad = "KG";
    precio = numeroValido(producto.precioKilo);
  } else if (producto.tieneLitro) {
    tipo_venta = "VOLUME";
    unidad = "L";
    precio = numeroValido(producto.precioLitro);
  }
  // precioBolsa nunca se exporta: KalIA sólo admite un precio principal.

  if (precio <= 0) return null;

  const stock = producto.stock != null ? numeroValido(producto.stock) : 0;
  const stock_minimo = producto.stockMinimo != null ? numeroValido(producto.stockMinimo) : 0;
  const costo = producto.costo != null ? numeroValido(producto.costo) : 0;
  const codigo_barras = (producto.codigoBarras || "").toString().trim();
  const categoria = (producto.categoria || "").toString().trim() || "Sin categoría";

  return {
    nombre,
    tipo_venta,
    unidad,
    precio,
    stock,
    stock_minimo,
    codigo_barras,
    costo,
    categoria,
    estado: "ACTIVO",
  };
}

/**
 * Transforma la lista completa y garantiza unicidad de codigo_barras:
 * si un código no vacío se repite, se conserva en la primera aparición
 * y se deja vacío en las siguientes (nunca se inventa uno nuevo).
 */
export function construirFilasKalia(productos) {
  const filas = [];
  const duplicados = [];
  const vistos = new Set();

  for (const producto of productos) {
    const fila = transformarProductoKalia(producto);
    if (!fila) continue;

    if (fila.codigo_barras) {
      if (vistos.has(fila.codigo_barras)) {
        duplicados.push({ nombre: fila.nombre, codigo_barras: fila.codigo_barras });
        fila.codigo_barras = "";
      } else {
        vistos.add(fila.codigo_barras);
      }
    }

    filas.push(fila);
  }

  return { filas, duplicados, omitidos: productos.length - filas.length };
}

export function dividirEnLotes(filas, maxPorArchivo = KALIA_MAX_PRODUCTOS_POR_ARCHIVO) {
  const lotes = [];
  for (let i = 0; i < filas.length; i += maxPorArchivo) {
    lotes.push(filas.slice(i, i + maxPorArchivo));
  }
  return lotes.length > 0 ? lotes : [];
}

export function filaAArray(fila) {
  return KALIA_COLUMNAS.map((col) => fila[col]);
}

export function fechaHoyISO(fecha = new Date()) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function nombreArchivoKalia(fecha, indice) {
  return `productos_kalia_${fecha}_${indice}.xlsx`;
}

/**
 * Arma el plan completo de exportación a partir de la lista cruda de
 * productos de Firestore: filas válidas, duplicados detectados y los
 * lotes ya divididos con su nombre de archivo asignado.
 */
export function planificarExportacionKalia(productos, opciones = {}) {
  const fecha = opciones.fecha || fechaHoyISO();
  const maxPorArchivo = opciones.maxPorArchivo || KALIA_MAX_PRODUCTOS_POR_ARCHIVO;

  const { filas, duplicados, omitidos } = construirFilasKalia(productos);
  const lotes = dividirEnLotes(filas, maxPorArchivo);

  const archivos = lotes.map((lote, i) => ({
    nombre: nombreArchivoKalia(fecha, i + 1),
    filas: lote,
  }));

  return { archivos, totalFilas: filas.length, duplicados, omitidos };
}
