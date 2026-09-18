import test from "node:test";
import assert from "node:assert/strict";
import {
  transformarProductoKalia,
  construirFilasKalia,
  planificarExportacionKalia,
  KALIA_COLUMNAS,
  KALIA_MAX_PRODUCTOS_POR_ARCHIVO,
} from "../public/assets/js/kalia-export.js";

// Caso 1: producto normal
test("producto normal exporta UNIT/UNIT con su precio", () => {
  const fila = transformarProductoKalia({ nombre: "Alpiste", precio: 2500 });
  assert.ok(fila);
  assert.equal(fila.tipo_venta, "UNIT");
  assert.equal(fila.unidad, "UNIT");
  assert.equal(fila.precio, 2500);
});

// Caso 2: producto por kilo
test("producto por kilo exporta WEIGHT/KG usando precioKilo", () => {
  const fila = transformarProductoKalia({
    nombre: "Maíz Quebrado",
    precio: 999, // debe ignorarse
    tieneKilo: true,
    precioKilo: 800,
  });
  assert.ok(fila);
  assert.equal(fila.tipo_venta, "WEIGHT");
  assert.equal(fila.unidad, "KG");
  assert.equal(fila.precio, 800);
});

// Caso 3: precio=0 y precioKilo válido -> se exporta
test("precio 0 con precioKilo valido se exporta correctamente", () => {
  const fila = transformarProductoKalia({
    nombre: "Maíz Quebrado",
    precio: 0,
    tieneKilo: true,
    precioKilo: 800,
  });
  assert.ok(fila);
  assert.equal(fila.precio, 800);
});

// Caso 4: precio=0 y sin precioKilo -> se omite
test("precio 0 sin precioKilo se omite", () => {
  const fila = transformarProductoKalia({ nombre: "Producto Roto", precio: 0 });
  assert.equal(fila, null);
});

test("precio 0 tieneKilo=true sin precioKilo tambien se omite", () => {
  const fila = transformarProductoKalia({
    nombre: "Maíz Quebrado",
    precio: 500, // no debe usarse igual, porque tieneKilo=true
    tieneKilo: true,
  });
  assert.equal(fila, null);
});

// Caso 5: producto sin código de barras -> campo vacío
test("producto sin codigo de barras exporta el campo vacio", () => {
  const fila = transformarProductoKalia({ nombre: "Sin Codigo", precio: 100 });
  assert.ok(fila);
  assert.equal(fila.codigo_barras, "");
});

test("producto con codigo de barras lo exporta sin modificar", () => {
  const fila = transformarProductoKalia({
    nombre: "Con Codigo",
    precio: 100,
    codigoBarras: "7791234567890",
  });
  assert.equal(fila.codigo_barras, "7791234567890");
});

// Caso 6: más de 500 productos -> múltiples archivos
test("mas de 500 productos genera multiples archivos de a lo sumo 500", () => {
  const productos = Array.from({ length: 1200 }, (_, i) => ({
    nombre: `Producto ${i}`,
    precio: 100,
  }));

  const plan = planificarExportacionKalia(productos, { fecha: "2026-09-18" });

  assert.equal(plan.archivos.length, 3);
  assert.equal(plan.archivos[0].filas.length, 500);
  assert.equal(plan.archivos[1].filas.length, 500);
  assert.equal(plan.archivos[2].filas.length, 200);
  assert.equal(plan.archivos[0].nombre, "productos_kalia_2026-09-18_1.xlsx");
  assert.equal(plan.archivos[2].nombre, "productos_kalia_2026-09-18_3.xlsx");
});

test("no supera el limite configurado de productos por archivo", () => {
  assert.equal(KALIA_MAX_PRODUCTOS_POR_ARCHIVO, 500);
});

// Reglas adicionales del spec

test("producto por bolsa sin kilo no exporta precioBolsa como principal", () => {
  const fila = transformarProductoKalia({
    nombre: "Solo Bolsa",
    precio: 0,
    tieneBolsa: true,
    precioBolsa: 14000,
  });
  // Sin tieneKilo, el precio principal sigue siendo `precio` (0) -> se omite
  assert.equal(fila, null);
});

test("bolsa y kilo juntos: se ignora precioBolsa y se usa precioKilo", () => {
  const fila = transformarProductoKalia({
    nombre: "Maíz Quebrado",
    tieneKilo: true,
    precioKilo: 800,
    tieneBolsa: true,
    precioBolsa: 14000,
  });
  assert.equal(fila.precio, 800);
});

test("producto sin nombre no se exporta", () => {
  const fila = transformarProductoKalia({ nombre: "  ", precio: 100 });
  assert.equal(fila, null);
});

test("sin categoria exporta 'Sin categoría'", () => {
  const fila = transformarProductoKalia({ nombre: "X", precio: 10 });
  assert.equal(fila.categoria, "Sin categoría");
});

test("sin stock exporta 0, nunca vacio", () => {
  const fila = transformarProductoKalia({ nombre: "X", precio: 10 });
  assert.equal(fila.stock, 0);
});

test("con stock existente exporta el valor real", () => {
  const fila = transformarProductoKalia({ nombre: "X", precio: 10, stock: 120 });
  assert.equal(fila.stock, 120);
});

test("stock_minimo siempre 0 (Niki no lo tiene)", () => {
  const fila = transformarProductoKalia({ nombre: "X", precio: 10 });
  assert.equal(fila.stock_minimo, 0);
});

test("sin costo exporta 0", () => {
  const fila = transformarProductoKalia({ nombre: "X", precio: 10 });
  assert.equal(fila.costo, 0);
});

test("con costo existente exporta el valor", () => {
  const fila = transformarProductoKalia({ nombre: "X", precio: 10, costo: 350 });
  assert.equal(fila.costo, 350);
});

test("todos los productos exportados quedan ACTIVO", () => {
  const fila = transformarProductoKalia({ nombre: "X", precio: 10 });
  assert.equal(fila.estado, "ACTIVO");
});

test("codigo_barras duplicado se conserva solo en la primera aparicion", () => {
  const productos = [
    { nombre: "A", precio: 10, codigoBarras: "111" },
    { nombre: "B", precio: 20, codigoBarras: "111" },
    { nombre: "C", precio: 30, codigoBarras: "222" },
  ];
  const { filas, duplicados } = construirFilasKalia(productos);

  assert.equal(filas[0].codigo_barras, "111");
  assert.equal(filas[1].codigo_barras, ""); // duplicado, se vacía
  assert.equal(filas[2].codigo_barras, "222");
  assert.equal(duplicados.length, 1);
  assert.equal(duplicados[0].nombre, "B");
});

test("el orden de columnas coincide exactamente con el importador de KalIA", () => {
  assert.deepEqual(KALIA_COLUMNAS, [
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
  ]);
});

test("productos con precio invalido no cuentan para los lotes", () => {
  const productos = [
    { nombre: "Valido", precio: 10 },
    { nombre: "Invalido", precio: 0 },
    { nombre: "", precio: 10 },
  ];
  const plan = planificarExportacionKalia(productos, { fecha: "2026-09-18" });
  assert.equal(plan.totalFilas, 1);
  assert.equal(plan.omitidos, 2);
});
