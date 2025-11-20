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

    if (landingGrid) {
      const destacados = obtenerProductosDestacados(todosLosProductos, 9);
      mostrarProductos(destacados, landingGrid);
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

document.addEventListener('DOMContentLoaded', function() {
  cargarProductos();
  actualizarBadges();
  navigateTo('catalog');

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
  const emptyCart = document.getElementById("emptyCart");
  const cartTable = document.getElementById("cartTable");
  const cartBody = document.getElementById("cartBody");
  const cartTotal = document.getElementById("cartTotal");
  
  if (cart.length === 0) {
    emptyCart.style.display = "block";
    cartTable.style.display = "none";
  } else {
    emptyCart.style.display = "none";
    cartTable.style.display = "block";
    
    cartBody.innerHTML = "";
    let total = 0;
    
    cart.forEach(item => {
      const subtotal = (item.precio || 0) * item.cantidad;
      total += subtotal;
      
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><img src="${item.imagen || 'placeholder.jpg'}" alt="${item.nombre}" class="table-image"></td>
        <td class="table-product-name">${item.nombre || 'Sin nombre'}</td>
        <td class="table-price">$${Number(item.precio || 0).toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
        <td>
          <div class="quantity-input">
            <button onclick="decreaseCartQuantity('${item.id}')">-</button>
            <input type="number" value="${item.cantidad}" min="1" readonly>
            <button onclick="increaseCartQuantity('${item.id}')">+</button>
          </div>
        </td>
        <td class="table-price">$${Number(subtotal).toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
        <td><button class="remove-btn" onclick="removeFromCart('${item.id}')">&times;</button></td>
      `;
      cartBody.appendChild(row);
    });
    
    cartTotal.textContent = `$${Number(total).toLocaleString('es-AR', {minimumFractionDigits: 2})}`;
  }
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
    alert('El carrito está vacío');
    return;
  }
  
  const form = document.getElementById("checkoutForm");
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  
  let mensaje = `*NUEVO PEDIDO*

*Cliente:* ${form.querySelector('input[type="text"]').value}
*Productos:*
`;
  
  let total = 0;
  cart.forEach(item => {
    const subtotal = (item.precio || 0) * item.cantidad;
    total += subtotal;
    mensaje += `- ${item.nombre} x${item.cantidad} = $${Number(subtotal).toLocaleString('es-AR')}
`;
  });
  
  mensaje += `
*TOTAL: $${Number(total).toLocaleString('es-AR')}*`;
  
  const numeroWhatsApp = "543515503079";
  const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;
  
  window.open(url, '_blank');
  
  cart = [];
  guardarCarrito();
  actualizarBadges();
  
  alert('Pedido enviado! Te redirigimos a WhatsApp');
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
    alert('Producto quitado de la lista de deseos');
  } else {
    wishlist.push(producto);
    alert('Producto agregado a la lista de deseos');
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
  alert('Producto agregado al carrito');
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
