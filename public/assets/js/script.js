// script.js
import { db } from "./firebase.js";
import { 
  collection, 
  getDocs,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";


// Variables globales
let todosLosProductos = [];
let productosFiltrados = [];
let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];



// Sistema de notificaciones Toast
function showToast(message, type = 'success') {
  // Crear contenedor si no existe
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  // Crear el toast
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  // Iconos según el tipo
  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠'
  };

  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.success}</span>
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);

  // Eliminar después de 3 segundos
  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => {
      toast.remove();
      // Eliminar contenedor si está vacío
      if (container.children.length === 0) {
        container.remove();
      }
    }, 300);
  }, 3000);
}

// Cargar productos desde Firestore
async function cargarProductos() {
  const landingGrid = document.getElementById("landingGrid");
  const catalogGrid = document.getElementById("catalogGrid");

  if (landingGrid) landingGrid.innerHTML = "<p>Cargando productos...</p>";
  if (catalogGrid) catalogGrid.innerHTML = "<p>Cargando productos...</p>";

  try {
    const querySnap = await getDocs(collection(db, "productos"));

    if (querySnap.empty) {
      if (landingGrid) landingGrid.innerHTML = "<p>No hay productos disponibles.</p>";
      if (catalogGrid) catalogGrid.innerHTML = "<p>No hay productos disponibles.</p>";
      return;
    }

    todosLosProductos = [];
    querySnap.forEach((doc) => {
      todosLosProductos.push({
        id: doc.id,
        ...doc.data()
      });
    });

    productosFiltrados = [...todosLosProductos];

    if (landingGrid) {
      const destacados = obtenerProductosDestacados(todosLosProductos, 12);
      mostrarProductos(destacados, landingGrid);
      // Inicializar carrusel después de cargar productos destacados
      setTimeout(() => initCarousel(), 100);
    }

    if (catalogGrid) {
      mostrarProductos(todosLosProductos, catalogGrid);
      actualizarContador();
    }

    cargarCategorias();

  } catch (error) {
    console.error("Error al cargar productos:", error);
    if (landingGrid) landingGrid.innerHTML = `<p>Error al cargar productos: ${error.message}</p>`;
    if (catalogGrid) catalogGrid.innerHTML = `<p>Error al cargar productos: ${error.message}</p>`;
  }
}

function obtenerProductosDestacados(productos, cantidad = 9) {
  const destacados = productos.filter(p => p.destacado === true);
  console.log("Productos destacados en Firestore:", destacados.length);
  return destacados.slice(0, cantidad);
}

function mostrarProductos(productos, container) {
  if (!container) return;

  if (productos.length === 0) {
    container.innerHTML = "<p>No se encontraron productos.</p>";
    return;
  }

  container.innerHTML = "";

  productos.forEach(producto => {
    const card = document.createElement("div");
    card.className = "product-card";

    const enWishlist = wishlist.some(item => item.id === producto.id);
    const enCarrito = cart.some(item => item.id === producto.id);

    const badgeOferta = producto.oferta === true ? '<span class="product-badge">OFERTA</span>' : '';

 card.innerHTML = ` 
  ${badgeOferta}
  <div class="product-image">
    <img src="${producto.imagen || 'placeholder.jpg'}" alt="${producto.nombre || 'Producto'}">
    <div class="product-overlay">
      <button 
        class="overlay-btn overlay-btn-large ${enCarrito ? 'btn-added' : ''}" 
        onclick="${(producto.tieneKilo || producto.tieneBolsa)
          ? `agregarAlCarrito('${producto.id}')`
          : `verProducto('${producto.id}')`}"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 2L6.5 6M9 2h6m-6 0L6.5 6m8.5-4l2.5 4M6.5 6h11M6.5 6L5 21h14l-1.5-15"></path>
        </svg>
        ${enCarrito ? 'AGREGADO' : 'AGREGAR'}
      </button>
    </div>
  </div>

  <div class="product-info">
    <h3 class="product-title">${producto.nombre || 'Sin nombre'}</h3>
    <p class="product-category">${producto.categoria || 'Sin categoría'}</p>
    <p class="product-price">
      ${
        producto.precio && producto.precio > 0
          ? '$' + Number(producto.precio).toLocaleString('es-AR', {
              minimumFractionDigits: 2
            })
          : ''
      }
    </p>

    ${(producto.tieneKilo || producto.tieneBolsa) ? `
      <div class="balanceado-box">
        <p class="balanceado-label">${producto.categoria || 'BALANCEADO'}</p>
        
        ${producto.tieneKilo ? `
          <div class="balanceado-row">
            <span class="balanceado-text">
              Por kilo 
              <span class="balanceado-price">
                ($${Number(producto.precioKilo || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })})
              </span>
            </span>
            <div class="qty-control" data-tipo="kilo">
              <button type="button" class="qty-btn qty-minus">-</button>
              <span class="qty-value">0</span>
              <button type="button" class="qty-btn qty-plus">+</button>
            </div>
          </div>
        ` : ''}

        ${producto.tieneBolsa ? `
          <div class="balanceado-row">
            <span class="balanceado-text">
              Por bolsa 
              <span class="balanceado-price">
                ($${Number(producto.precioBolsa || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })})
              </span>
            </span>
            <div class="qty-control" data-tipo="bolsa">
              <button type="button" class="qty-btn qty-minus">-</button>
              <span class="qty-value">0</span>
              <button type="button" class="qty-btn qty-plus">+</button>
            </div>
          </div>
        ` : ''}
      </div>
    ` : ''}
  </div>
`;



    container.appendChild(card);
  });
}
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.qty-btn');
  if (!btn) return;

  const control = btn.closest('.qty-control');
  if (!control) return;

  const valueSpan = control.querySelector('.qty-value');
  let value = Number(valueSpan.textContent) || 0;

  if (btn.classList.contains('qty-plus')) {
    value++;
  } else if (btn.classList.contains('qty-minus') && value > 0) {
    value--;
  }

  valueSpan.textContent = value;
});

async function cargarCategorias() {
  const categoryFilter = document.getElementById("categoryFilter");
  if (!categoryFilter) return;

  try {
    // Traer categorías globales desde Firestore
    const docRef = doc(db, "configuracion", "categorias");
    const snap = await getDoc(docRef);

    let categorias = [];

    if (snap.exists()) {
      const data = snap.data();
      categorias = data.lista || [];
    } else {
      // Fallback: si no existe el doc, usar las categorías de los productos
      categorias = [...new Set(todosLosProductos.map(p => p.categoria).filter(Boolean))];
    }

    categorias = [...categorias].sort();

    categoryFilter.innerHTML = `<option value="">Todas las categorías</option>`;
    categorias.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat.toUpperCase();
      categoryFilter.appendChild(option);
    });
  } catch (error) {
    console.error("Error al cargar categorías del filtro:", error);
  }
}



async function cargarCategoriasLanding() {
  const categoriasMenu = document.getElementById("categoriasMenu");
  if (!categoriasMenu) return;

  categoriasMenu.innerHTML = `
    <div class="dropdown-columns">
      <div class="dropdown-column" id="landing-col-1"></div>
      <div class="dropdown-column" id="landing-col-2"></div>
      <div class="dropdown-column" id="landing-col-3"></div>
    </div>
  `;

  const col1 = document.getElementById("landing-col-1");
  const col2 = document.getElementById("landing-col-2");
  const col3 = document.getElementById("landing-col-3");
  if (!col1 || !col2 || !col3) return;

  try {
    const docRef = doc(db, "configuracion", "categorias");
    const snap = await getDoc(docRef);

    if (!snap.exists()) return;

    const data = snap.data();
    let lista = data.lista || [];
    lista = [...lista].sort();

    const columnas = [col1, col2, col3];

    lista.forEach((cat, index) => {
      const a = document.createElement("a");
      a.href = "#";
      a.className = "dropdown-item";
      a.dataset.category = cat.toLowerCase();
      a.textContent = cat;

      const colIndex = index % columnas.length;
      columnas[colIndex].appendChild(a);
    });

    document.querySelectorAll(".dropdown-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();

        document.querySelectorAll(".dropdown-item").forEach((i) =>
          i.classList.remove("active")
        );
        item.classList.add("active");

        const categoria = item.dataset.category;

        if (categoria) {
          productosFiltrados = todosLosProductos.filter(
            (p) =>
              (p.categoria || "").toLowerCase() === categoria.toLowerCase()
          );
        } else {
          productosFiltrados = [...todosLosProductos];
        }

        const catalogGrid = document.getElementById("catalogGrid");
        if (catalogGrid) {
          mostrarProductos(productosFiltrados, catalogGrid);
        }
        actualizarContador();

        const categoryFilter = document.getElementById("categoryFilter");
        if (categoryFilter) {
          categoryFilter.value = categoria || "";
        }

        navigateTo("catalog");
        categoriasMenu.classList.remove("active");
      });
    });
  } catch (error) {
    console.error("Error al cargar categorías en el header:", error);
  }
}


window.verProducto = function(id) {
  const producto = todosLosProductos.find(p => p.id === id);
  if (!producto) return;

  const modal = document.getElementById("productModal");
  document.getElementById("modalImage").src = producto.imagen || 'placeholder.jpg';
  document.getElementById("modalTitle").textContent = producto.nombre || 'Sin nombre';
  document.getElementById("modalPrice").textContent = `$${Number(producto.precio || 0).toLocaleString('es-AR', {minimumFractionDigits: 2})}`;
  document.getElementById("modalQuantity").value = 1;

  modal.dataset.productId = id;
  modal.classList.add("active");
}

window.closeModal = function() {
  document.getElementById("productModal").classList.remove("active");
}
window.agregarAlCarrito = function(id) {
  const producto = todosLosProductos.find(p => p.id === id);
  if (!producto) return;

  // 🔹 Si NO es balanceado (no tiene kilo ni bolsa) → comportamiento viejo
  if (!producto.tieneKilo && !producto.tieneBolsa) {
    const existente = cart.find(item => item.id === id);
    if (existente) {
      existente.cantidad++;
    } else {
      cart.push({
        ...producto,
        cantidad: 1
      });
    }
  }

  // 🔹 Si es balanceado → solo agrego kilos / bolsas
  if (producto.tieneKilo || producto.tieneBolsa) {
    const cardElement = document
      .querySelector(`.product-card button[onclick="agregarAlCarrito('${id}')"]`)
      ?.closest('.product-card');

    if (cardElement) {
      const kiloControl  = cardElement.querySelector('.qty-control[data-tipo="kilo"]');
      const bolsaControl = cardElement.querySelector('.qty-control[data-tipo="bolsa"]');

      const qtyKilo  = kiloControl
        ? Number(kiloControl.querySelector('.qty-value').textContent) || 0
        : 0;
      const qtyBolsa = bolsaControl
        ? Number(bolsaControl.querySelector('.qty-value').textContent) || 0
        : 0;

      // KILOS
      if (producto.tieneKilo && qtyKilo > 0) {
        const idKilo = id + '_kilo';
        const existenteKilo = cart.find(
          item => item.id === idKilo && item.unidad === 'kilo'
        );

        if (existenteKilo) {
          existenteKilo.cantidad += qtyKilo;
        } else {
          cart.push({
            id: idKilo,
            nombre: producto.nombre + ' (kilos)',
            imagen: producto.imagen,
            precio: Number(producto.precioKilo) || 0,
            cantidad: qtyKilo,
            unidad: 'kilo'
          });
        }
      }

      // BOLSAS
      if (producto.tieneBolsa && qtyBolsa > 0) {
        const idBolsa = id + '_bolsa';
        const existenteBolsa = cart.find(
          item => item.id === idBolsa && item.unidad === 'bolsa'
        );

        if (existenteBolsa) {
          existenteBolsa.cantidad += qtyBolsa;
        } else {
          cart.push({
            id: idBolsa,
            nombre: producto.nombre + ' (bolsas)',
            imagen: producto.imagen,
            precio: Number(producto.precioBolsa) || 0,
            cantidad: qtyBolsa,
            unidad: 'bolsa'
          });
        }
      }
    }
  }

  guardarCarrito();
  actualizarBadges();
  mostrarProductos(productosFiltrados, document.getElementById("catalogGrid"));
  showToast("Producto agregado al carrito", "success");
};





window.addToCartFromModal = function() {
  const modal = document.getElementById("productModal");
  const id = modal.dataset.productId;
  const cantidad = parseInt(document.getElementById("modalQuantity").value) || 1;

  const producto = todosLosProductos.find(p => p.id === id);
  if (!producto) return;

  const existente = cart.find(item => item.id === id);
  if (existente) {
    existente.cantidad += cantidad;
  } else {
    cart.push({
      ...producto,
      cantidad: cantidad
    });
  }

  guardarCarrito();
  actualizarBadges();
  closeModal();
  showToast("Producto agregado al carrito", "success");
}

window.increaseQuantity = function() {
  const input = document.getElementById("modalQuantity");
  input.value = parseInt(input.value) + 1;
}

window.decreaseQuantity = function() {
  const input = document.getElementById("modalQuantity");
  if (parseInt(input.value) > 1) {
    input.value = parseInt(input.value) - 1;
  }
}

function guardarCarrito() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function actualizarBadges() {
  const cartBadge = document.getElementById("cartBadge");
  const wishlistBadge = document.getElementById("wishlistBadge");
  
  if (cartBadge) {
    cartBadge.textContent = cart.reduce((sum, item) => sum + item.cantidad, 0);
  }
  
  if (wishlistBadge) {
    wishlistBadge.textContent = wishlist.length;
  }
}

function actualizarContador() {
  const counter = document.getElementById("productsCount");
  if (counter) {
    counter.textContent = `Mostrando ${productosFiltrados.length} de ${todosLosProductos.length} productos`;
  }
}

window.navigateTo = function(page) {
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');

  const pageElement = document.getElementById(`page-${page}`);
  if (pageElement) {
    pageElement.style.display = 'block';
  }

  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  const activeLink = document.querySelector(`[data-page="${page}"]`);
  if (activeLink) {
    activeLink.classList.add('active');
  }
}

document.addEventListener("DOMContentLoaded", function () {
  cargarProductos();
  cargarCategoriasLanding(); // NUEVO
  actualizarBadges();
  navigateTo("catalog");

  const searchBtn = document.getElementById("searchBtn");
  const searchInput = document.getElementById("searchInput");

  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', buscarProductos);
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') buscarProductos();
    });
  }

  const categoryFilter = document.getElementById("categoryFilter");
  if (categoryFilter) {
    categoryFilter.addEventListener('change', filtrarPorCategoria);
  }

  const sortSelect = document.getElementById("sortSelect");
  if (sortSelect) {
    sortSelect.addEventListener('change', ordenarProductos);
  }

  document.querySelectorAll('[data-page]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(link.dataset.page);
    });
  });

  const logo = document.getElementById("logoImg");
  if (logo) {
    logo.addEventListener('click', () => navigateTo('catalog'));
  }

  // Dropdown de categorías
  const categoriasBtn = document.getElementById("categoriasBtn");
  const categoriasMenu = document.getElementById("categoriasMenu");

  if (categoriasBtn && categoriasMenu) {
    categoriasBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // Quitar clase active de todos los nav-links al abrir categorías
      document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
      categoriasMenu.classList.toggle('active');
    });
    
    document.addEventListener('click', (e) => {
      if (!categoriasBtn.contains(e.target) && !categoriasMenu.contains(e.target)) {
        categoriasMenu.classList.remove('active');
      }
    });
    
    document.querySelectorAll('.dropdown-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();

        // Remover clase active de todas las categorías
        document.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active'));

        // Agregar clase active a la categoría clickeada
        item.classList.add('active');

        const categoria = item.dataset.category;

        if (categoria) {
  productosFiltrados = todosLosProductos.filter(p =>
    (p.categoria || '').toLowerCase() === categoria.toLowerCase()
  );
} else {
  productosFiltrados = [...todosLosProductos];
}


        const catalogGrid = document.getElementById("catalogGrid");
        if (catalogGrid) {
          mostrarProductos(productosFiltrados, catalogGrid);
          actualizarContador();
        }
        
        const categoryFilter = document.getElementById("categoryFilter");
        if (categoryFilter) {
          categoryFilter.value = categoria || '';
        }
        
        navigateTo('catalog');
        categoriasMenu.classList.remove('active');
      });
    });
  }

  const cartIcon = document.getElementById("cartIcon");
  const wishlistIcon = document.getElementById("wishlistIcon");

  if (cartIcon) {
    cartIcon.addEventListener('click', () => navigateTo('cart'));
  }

  if (wishlistIcon) {
    wishlistIcon.addEventListener('click', () => navigateTo('wishlist'));
  }
});

function buscarProductos() {
  const searchInput = document.getElementById("searchInput");
  const termino = searchInput.value.toLowerCase().trim();

  // Remover resaltado de categorías al buscar
  document.querySelectorAll('.dropdown-item').forEach(item => item.classList.remove('active'));

  // Limpiar filtro de categoría
  const categoryFilter = document.getElementById("categoryFilter");
  if (categoryFilter) {
    categoryFilter.value = '';
  }

  if (termino === '') {
    productosFiltrados = [...todosLosProductos];
  } else {
    productosFiltrados = todosLosProductos.filter(p =>
      (p.nombre || '').toLowerCase().includes(termino) ||
      (p.categoria || '').toLowerCase().includes(termino)
    );
  }

  mostrarProductos(productosFiltrados, document.getElementById("catalogGrid"));
  actualizarContador();
}

function filtrarPorCategoria() {
  const categoryFilter = document.getElementById("categoryFilter");
  const categoria = categoryFilter.value;

  // Actualizar resaltado en dropdown del header
  document.querySelectorAll('.dropdown-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.category && item.dataset.category.toLowerCase() === categoria.toLowerCase()) {
      item.classList.add('active');
    }
  });

  if (categoria === '') {
    productosFiltrados = [...todosLosProductos];
  } else {
    productosFiltrados = todosLosProductos.filter(p =>
      (p.categoria || '').toLowerCase() === categoria.toLowerCase()
    );
  }

  mostrarProductos(productosFiltrados, document.getElementById("catalogGrid"));
  actualizarContador();
}

function ordenarProductos() {
  const sortSelect = document.getElementById("sortSelect");
  const criterio = sortSelect.value;

  switch(criterio) {
    case 'price-asc':
      productosFiltrados.sort((a, b) => (a.precio || 0) - (b.precio || 0));
      break;
    case 'price-desc':
      productosFiltrados.sort((a, b) => (b.precio || 0) - (a.precio || 0));
      break;
    default:
      productosFiltrados = [...todosLosProductos];
  }

  mostrarProductos(productosFiltrados, document.getElementById("catalogGrid"));
}

window.addEventListener('click', (e) => {
  const modal = document.getElementById("productModal");
  if (e.target === modal) {
    closeModal();
  }
});

function mostrarOfertas() {
  const ofertasGrid = document.getElementById("ofertasGrid");
  
  if (!ofertasGrid) return;
  
  const productosEnOferta = todosLosProductos.filter(p => p.oferta === true);
  
  console.log("Productos en oferta encontrados:", productosEnOferta.length);
  
  if (productosEnOferta.length === 0) {
    ofertasGrid.innerHTML = "<p>No hay ofertas disponibles en este momento.</p>";
    return;
  }
  
  mostrarProductos(productosEnOferta, ofertasGrid);
}
function mostrarCarrito() {
  const emptyCart  = document.getElementById("emptyCart");
  const cartTable  = document.getElementById("cartTable");
  const cartBody   = document.getElementById("cartBody");
  const cartTotal  = document.getElementById("cartTotal");

  if (cart.length === 0) {
    emptyCart.style.display = "block";
    cartTable.style.display = "none";
    cartBody.innerHTML = "";
    cartTotal.textContent = "$0,00";
    return;
  }

  emptyCart.style.display = "none";
  cartTable.style.display = "block";

  cartBody.innerHTML = "";
  let total = 0;

  cart.forEach(item => {
    const subtotal = (item.precio || 0) * item.cantidad;
    total += subtotal;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <img src="${item.imagen || 'placeholder.jpg'}" 
             alt="${item.nombre || ''}" 
             class="table-image">
      </td>
      <td class="table-product-name">
        ${item.nombre || 'Sin nombre'}
        ${item.unidad ? ` <span class="cart-unit">(${item.unidad})</span>` : ''}
      </td>
      <td class="table-price">
        $${Number(item.precio || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
      </td>
      <td>
        <div class="quantity-input">
          <button onclick="decreaseCartQuantity('${item.id}')">-</button>
          <input type="number" value="${item.cantidad}" min="1" readonly>
          <button onclick="increaseCartQuantity('${item.id}')">+</button>
        </div>
      </td>
      <td class="table-price">
        $${Number(subtotal).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
      </td>
      <td>
        <button class="remove-btn" onclick="removeFromCart('${item.id}')">&times;</button>
      </td>
    `;

    cartBody.appendChild(row);
  });

  cartTotal.textContent = `$${Number(total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
}


window.increaseCartQuantity = function(id) {
  const item = cart.find(p => p.id === id);
  if (item) {
    item.cantidad++;
    guardarCarrito();
    actualizarBadges();
    mostrarCarrito();
  }
}

window.decreaseCartQuantity = function(id) {
  const item = cart.find(p => p.id === id);
  if (item && item.cantidad > 1) {
    item.cantidad--;
    guardarCarrito();
    actualizarBadges();
    mostrarCarrito();
  }
}

window.removeFromCart = function(id) {
  cart = cart.filter(item => item.id !== id);
  guardarCarrito();
  actualizarBadges();
  mostrarCarrito();
  mostrarProductos(productosFiltrados, document.getElementById("catalogGrid"));
}

window.clearCart = function() {
  if (confirm('¿Estás seguro de vaciar el carrito?')) {
    cart = [];
    guardarCarrito();
    actualizarBadges();
    mostrarCarrito();
    mostrarProductos(productosFiltrados, document.getElementById("catalogGrid"));
  }
}

function mostrarCheckout() {
  const orderItems = document.getElementById("orderItems");
  const orderTotal = document.getElementById("orderTotal");
  
  if (!orderItems || !orderTotal) return;
  
  orderItems.innerHTML = "";
  let total = 0;
  
  cart.forEach(item => {
    const subtotal = (item.precio || 0) * item.cantidad;
    total += subtotal;
    
    const orderItem = document.createElement("div");
    orderItem.className = "order-item";
    orderItem.innerHTML = `
      <span>${item.nombre} × ${item.cantidad}</span>
      <span>$${Number(subtotal).toLocaleString('es-AR', {minimumFractionDigits: 2})}</span>
    `;
    orderItems.appendChild(orderItem);
  });
  
  orderTotal.textContent = `$${Number(total).toLocaleString('es-AR', {minimumFractionDigits: 2})}`;
}
window.submitOrder = function() {
  if (cart.length === 0) {
    showToast('El carrito está vacío', 'warning');
    return;
  }
  
  const form = document.getElementById("checkoutForm");
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  
  // Obtener datos del formulario
  const nombre = document.getElementById("customerName").value;
  const apellido = document.getElementById("customerLastName").value;
  const direccion = document.getElementById("customerAddress").value;
  const descripcion = document.getElementById("orderDescription").value;
  
  // Construir mensaje
  let mensaje = "*NUEVO PEDIDO*\n\n";
  mensaje += `*Cliente:* ${nombre} ${apellido}\n`;
  mensaje += `*Dirección:* ${direccion}\n`;
  
  if (descripcion.trim() !== '') {
    mensaje += `*Descripción:* ${descripcion}\n`;
  }
  
  mensaje += "\n*PRODUCTOS:*\n";
  
  let total = 0;
  cart.forEach(item => {
    const subtotal = (item.precio || 0) * item.cantidad;
    total += subtotal;
    mensaje += `- ${item.nombre} x${item.cantidad} = $${Number(subtotal).toLocaleString('es-AR', {minimumFractionDigits: 0})}\n`;
  });
  
  mensaje += `\n*TOTAL: $${Number(total).toLocaleString('es-AR', {minimumFractionDigits: 0})}*`;
  
  const numeroWhatsApp = "5493515286282";
  const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;
  
  window.open(url, '_blank');

  // Limpiar carrito
  cart = [];
  guardarCarrito();
  actualizarBadges();

  // Actualizar vista
  const catalogGrid = document.getElementById("catalogGrid");
  if (catalogGrid) {
    mostrarProductos(productosFiltrados, catalogGrid);
  }

  showToast('Pedido enviado! Te redirigimos a WhatsApp', 'success');
  form.reset();
  navigateTo('catalog');
}


const navigateToOriginal = window.navigateTo;
window.navigateTo = function(page) {
  navigateToOriginal(page);
  
  if (page === 'cart') {
    mostrarCarrito();
  } else if (page === 'checkout') {
    mostrarCheckout();
  } else if (page === 'ofertas') {
    mostrarOfertas();
  } else if (page === 'wishlist') {
    mostrarWishlist();
  }
}

window.toggleWishlistFromModal = function() {
  const modal = document.getElementById("productModal");
  const id = modal.dataset.productId;
  
  const producto = todosLosProductos.find(p => p.id === id);
  if (!producto) return;
  
  const index = wishlist.findIndex(item => item.id === id);
  
  if (index > -1) {
    wishlist.splice(index, 1);
    showToast('Producto quitado de la lista de deseos', 'info');
  } else {
    wishlist.push(producto);
    showToast('Producto agregado a la lista de deseos', 'success');
  }
  
  guardarWishlist();
  actualizarBadges();
}

function guardarWishlist() {
  localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

function mostrarWishlist() {
  const emptyWishlist = document.getElementById("emptyWishlist");
  const wishlistTable = document.getElementById("wishlistTable");
  const wishlistBody = document.getElementById("wishlistBody");
  
  if (wishlist.length === 0) {
    emptyWishlist.style.display = "block";
    wishlistTable.style.display = "none";
  } else {
    emptyWishlist.style.display = "none";
    wishlistTable.style.display = "block";
    
    wishlistBody.innerHTML = "";
    
    wishlist.forEach(item => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><img src="${item.imagen || 'placeholder.jpg'}" alt="${item.nombre}" class="table-image"></td>
        <td class="table-product-name">${item.nombre || 'Sin nombre'}</td>
        <td class="table-price">$${Number(item.precio || 0).toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
        <td>
          <button class="btn-primary" onclick="addToCartFromWishlist('${item.id}')">AGREGAR AL CARRITO</button>
        </td>
        <td><button class="remove-btn" onclick="removeFromWishlist('${item.id}')">&times;</button></td>
      `;
      wishlistBody.appendChild(row);
    });
  }
}

window.addToCartFromWishlist = function(id) {
  const producto = wishlist.find(p => p.id === id);
  if (!producto) return;
  
  const existente = cart.find(item => item.id === id);
  if (existente) {
    existente.cantidad++;
  } else {
    cart.push({
      ...producto,
      cantidad: 1
    });
  }

  guardarCarrito();
  actualizarBadges();
  showToast('Producto agregado al carrito', 'success');
}

window.removeFromWishlist = function(id) {
  wishlist = wishlist.filter(item => item.id !== id);
  guardarWishlist();
  actualizarBadges();
  mostrarWishlist();
}

window.clearWishlist = function() {
  if (confirm('¿Estás seguro de vaciar la lista de deseos?')) {
    wishlist = [];
    guardarWishlist();
    actualizarBadges();
    mostrarWishlist();
  }
}

// ==================== CARRUSEL DE PRODUCTOS DESTACADOS ====================
let currentSlide = 0;
let totalSlides = 0;
let autoplayInterval = null;
let itemsPerSlide = 4;

function initCarousel() {
  const track = document.getElementById('landingGrid');
  if (!track) return;

  // Detectar ancho de pantalla y ajustar itemsPerSlide
  const width = window.innerWidth;
  if (width <= 480) {
    itemsPerSlide = 1;
  } else if (width <= 768) {
    itemsPerSlide = 2;
  } else if (width <= 1200) {
    itemsPerSlide = 3;
  } else {
    itemsPerSlide = 4;
  }

  const cards = track.querySelectorAll('.product-card');
  totalSlides = Math.ceil(cards.length / itemsPerSlide);

  // Crear dots de navegación
  createCarouselDots();

  // Event listeners para botones
  const prevBtn = document.getElementById('carouselPrev');
  const nextBtn = document.getElementById('carouselNext');

  if (prevBtn) prevBtn.addEventListener('click', () => moveCarousel('prev'));
  if (nextBtn) nextBtn.addEventListener('click', () => moveCarousel('next'));

  // Auto-play cada 5 segundos
  startAutoplay();

  // Pausar al hacer hover
  const container = document.querySelector('.carousel-container');
  if (container) {
    container.addEventListener('mouseenter', stopAutoplay);
    container.addEventListener('mouseleave', startAutoplay);
  }

  // Actualizar vista
  updateCarouselPosition();
}

function createCarouselDots() {
  const dotsContainer = document.getElementById('carouselDots');
  if (!dotsContainer) return;

  dotsContainer.innerHTML = '';

  for (let i = 0; i < totalSlides; i++) {
    const dot = document.createElement('button');
    dot.className = `carousel-dot ${i === 0 ? 'active' : ''}`;
    dot.addEventListener('click', () => goToSlide(i));
    dotsContainer.appendChild(dot);
  }
}

function moveCarousel(direction) {
  if (direction === 'next') {
    currentSlide = (currentSlide + 1) % totalSlides;
  } else {
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
  }

  updateCarouselPosition();
}

function goToSlide(index) {
  currentSlide = index;
  updateCarouselPosition();
}

function updateCarouselPosition() {
  const track = document.getElementById('landingGrid');
  if (!track) return;

  // Calcular desplazamiento basado en el ancho de las cards + gap
  const card = track.querySelector('.product-card');
  if (!card) return;

  const cardWidth = card.offsetWidth;
  const gap = 25; // Debe coincidir con el gap del CSS
  const slideWidth = (cardWidth + gap) * itemsPerSlide;

  track.style.transform = `translateX(-${currentSlide * slideWidth}px)`;

  // Actualizar dots
  const dots = document.querySelectorAll('.carousel-dot');
  dots.forEach((dot, index) => {
    dot.classList.toggle('active', index === currentSlide);
  });
}

function startAutoplay() {
  stopAutoplay(); // Limpiar cualquier intervalo existente
  autoplayInterval = setInterval(() => {
    moveCarousel('next');
  }, 5000); // Cambiar cada 5 segundos
}

function stopAutoplay() {
  if (autoplayInterval) {
    clearInterval(autoplayInterval);
    autoplayInterval = null;
  }
}

// Recalcular al redimensionar ventana
window.addEventListener('resize', () => {
  // Actualizar itemsPerSlide según el ancho de pantalla
  const width = window.innerWidth;
  if (width <= 480) {
    itemsPerSlide = 1;
  } else if (width <= 768) {
    itemsPerSlide = 2;
  } else if (width <= 1200) {
    itemsPerSlide = 3;
  } else {
    itemsPerSlide = 4;
  }

  const track = document.getElementById('landingGrid');
  if (!track) return;

  const cards = track.querySelectorAll('.product-card');
  totalSlides = Math.ceil(cards.length / itemsPerSlide);

  // Asegurar que currentSlide no sea mayor que totalSlides
  if (currentSlide >= totalSlides) {
    currentSlide = totalSlides - 1;
  }

  createCarouselDots();
  updateCarouselPosition();
});


