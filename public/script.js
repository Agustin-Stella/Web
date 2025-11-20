import { db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";


// Variables globales
let todosLosProductos = [];
let productosFiltrados = [];
let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];


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

    // Mostrar productos destacados en landing
    if (landingGrid) {
      const destacados = obtenerProductosDestacados(todosLosProductos, 9);
      mostrarProductos(destacados, landingGrid);
    }

    // Mostrar todos en catálogo
    if (catalogGrid) {
      mostrarProductos(todosLosProductos, catalogGrid);
      actualizarContador();
    }

    // Cargar categorías en el filtro
    cargarCategorias();

  } catch (error) {
    console.error("Error al cargar productos:", error);
    if (landingGrid) landingGrid.innerHTML = `<p>Error al cargar productos: ${error.message}</p>`;
    if (catalogGrid) catalogGrid.innerHTML = `<p>Error al cargar productos: ${error.message}</p>`;
  }
}


// Obtener productos destacados según diferentes criterios
function obtenerProductosDestacados(productos, cantidad = 9) {
  // SOLO productos marcados como destacados
  const destacados = productos.filter(p => p.destacado === true);

  console.log("Productos destacados en Firestore:", destacados.length);
  console.log("Mostrando en landing:", destacados.length, "productos");


  return destacados.slice(0, cantidad);
}



// Mostrar productos en el grid
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

    // Solo mostrar badge si el producto REALMENTE tiene oferta === true
    const badgeOferta = producto.oferta === true ? '<span class="product-badge">OFERTA</span>' : '';

    card.innerHTML = `
      ${badgeOferta}
      <div class="product-image">
        <img src="${producto.imagen || 'placeholder.jpg'}" alt="${producto.nombre || 'Producto'}">
        <div class="product-overlay">
          <button class="overlay-btn" onclick="verProducto('${producto.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            VER
          </button>
          <button class="overlay-btn ${enCarrito ? 'btn-added' : ''}" onclick="agregarAlCarrito('${producto.id}')" ${enCarrito ? 'disabled' : ''}>
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
        <p class="product-price">$${Number(producto.precio || 0).toLocaleString('es-AR', {minimumFractionDigits: 2})}</p>
      </div>
    `;

    container.appendChild(card);
  });
}


// Cargar categorías únicas en el select
function cargarCategorias() {
  const categoryFilter = document.getElementById("categoryFilter");
  if (!categoryFilter) return;

  const categorias = [...new Set(todosLosProductos.map(p => p.categoria).filter(Boolean))];
  categorias.sort();

  categoryFilter.innerHTML = '<option value="">Todas las categorías</option>';
  categorias.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat.toUpperCase();
    categoryFilter.appendChild(option);
  });
}


// Ver detalle del producto
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


// Cerrar modal
window.closeModal = function() {
  document.getElementById("productModal").classList.remove("active");
}


// Agregar al carrito
window.agregarAlCarrito = function(id) {
  const producto = todosLosProductos.find(p => p.id === id);
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
  mostrarProductos(productosFiltrados, document.getElementById("catalogGrid"));
  alert("Producto agregado al carrito");
}


// Agregar al carrito desde modal
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
  alert("Producto agregado al carrito");
}


// Funciones de cantidad en modal
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


// Guardar carrito
function guardarCarrito() {
  localStorage.setItem('cart', JSON.stringify(cart));
}


// Actualizar badges
function actualizarBadges() {
  document.getElementById("cartBadge").textContent = cart.reduce((sum, item) => sum + item.cantidad, 0);
  document.getElementById("wishlistBadge").textContent = wishlist.length;
}


// Actualizar contador de productos
function actualizarContador() {
  const counter = document.getElementById("productsCount");
  if (counter) {
    counter.textContent = `Mostrando ${productosFiltrados.length} de ${todosLosProductos.length} productos`;
  }
}


// Navegación
window.navigateTo = function(page) {
  // Ocultar todas las páginas
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');

  // Mostrar la página seleccionada
  const pageElement = document.getElementById(`page-${page}`);
  if (pageElement) {
    pageElement.style.display = 'block';
  }

  // Actualizar enlaces activos
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  const activeLink = document.querySelector(`[data-page="${page}"]`);
  if (activeLink) {
    activeLink.classList.add('active');
  }
}


// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
  // Cargar productos
  cargarProductos();

  // Actualizar badges iniciales
  actualizarBadges();

  // Navegar a catalog al cargar (muestra destacados + catálogo completo)
  navigateTo('catalog');

  // Búsqueda
  const searchBtn = document.getElementById("searchBtn");
  const searchInput = document.getElementById("searchInput");

  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', buscarProductos);
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') buscarProductos();
    });
  }

  // Filtro de categoría
  const categoryFilter = document.getElementById("categoryFilter");
  if (categoryFilter) {
    categoryFilter.addEventListener('change', filtrarPorCategoria);
  }

  // Ordenamiento
  const sortSelect = document.getElementById("sortSelect");
  if (sortSelect) {
    sortSelect.addEventListener('change', ordenarProductos);
  }

  // Navegación
  document.querySelectorAll('[data-page]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(link.dataset.page);
    });
  });

  // Logo click - volver al inicio (catalog con destacados + productos)
  const logo = document.getElementById("logoImg");
  if (logo) {
    logo.addEventListener('click', () => navigateTo('catalog'));
  }

  // Iconos carrito y wishlist
  const cartIcon = document.getElementById("cartIcon");
  const wishlistIcon = document.getElementById("wishlistIcon");

  if (cartIcon) {
    cartIcon.addEventListener('click', () => navigateTo('cart'));
  }

  if (wishlistIcon) {
    wishlistIcon.addEventListener('click', () => navigateTo('wishlist'));
  }
});


// Búsqueda de productos
function buscarProductos() {
  const searchInput = document.getElementById("searchInput");
  const termino = searchInput.value.toLowerCase().trim();

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


// Filtrar por categoría
function filtrarPorCategoria() {
  const categoryFilter = document.getElementById("categoryFilter");
  const categoria = categoryFilter.value;

  if (categoria === '') {
    productosFiltrados = [...todosLosProductos];
  } else {
    productosFiltrados = todosLosProductos.filter(p => p.categoria === categoria);
  }

  mostrarProductos(productosFiltrados, document.getElementById("catalogGrid"));
  actualizarContador();
}


// Ordenar productos
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


// Cerrar modal al hacer click fuera
window.addEventListener('click', (e) => {
  const modal = document.getElementById("productModal");
  if (e.target === modal) {
    closeModal();
  }
});