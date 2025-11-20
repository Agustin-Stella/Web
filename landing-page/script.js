// Base de datos de productos
const products = [
    {
        id: 1,
        name: "AROMATIZANTE URBAN - FRESH - ANGELUS-OFERTA",
        category: "aromatizantes-ambiente",
        price: 2194.00,
        image: "https://via.placeholder.com/300x300/cccccc/666666?text=ANGELUS",
        offer: true
    },
    {
        id: 2,
        name: "AROMATIZANTE URBAN - FRESH - BABY -OFERTA",
        category: "aromatizantes-ambiente",
        price: 2194.00,
        image: "https://via.placeholder.com/300x300/e8d5b5/666666?text=BABY",
        offer: true
    },
    {
        id: 3,
        name: "AROMATIZANTE URBAN - FRESH - CHICLE -OFERTA",
        category: "aromatizantes-ambiente",
        price: 2194.00,
        image: "https://via.placeholder.com/300x300/ff69b4/666666?text=CHICLE",
        offer: true
    },
    {
        id: 4,
        name: "HUMIFICADOR DIFUSOR ESFERA NATURAL-OFERTA.",
        category: "aromatizantes-ambiente",
        price: 7653.00,
        image: "https://via.placeholder.com/300x300/d4a574/666666?text=HUMIDIFICADOR",
        offer: true
    },
    {
        id: 5,
        name: "BALDE CENTRIFUGOS-OFERTA",
        category: "baldes",
        price: 10050.00,
        image: "https://via.placeholder.com/300x300/4169E1/666666?text=BALDE+CENTRIFUGO",
        offer: true
    },
    {
        id: 6,
        name: "BALDE PLAST-MANIJA COLOR X 12 LTS-OFERTA",
        category: "baldes",
        price: 1950.00,
        image: "https://via.placeholder.com/300x300/FF6347/666666?text=BALDE+12L",
        offer: true
    },
    {
        id: 7,
        name: "FIBRA NEGRA EXTRA FUERTE X 12 UN. ECOOO X 1",
        category: "esponja",
        price: 476.00,
        image: "https://via.placeholder.com/300x300/333333/ffffff?text=FIBRA+NEGRA",
        offer: false
    },
    {
        id: 8,
        name: "FIBRA VERDE EXTRA FUERTE X 12 UN. ECOOO X 1",
        category: "esponja",
        price: 476.00,
        image: "https://via.placeholder.com/300x300/228B22/ffffff?text=FIBRA+VERDE",
        offer: false
    },
    {
        id: 9,
        name: "LANA DE ACERO FINA X 12 UN. ECOOO X 1",
        category: "esponja",
        price: 476.00,
        image: "https://via.placeholder.com/300x300/696969/ffffff?text=LANA+ACERO",
        offer: false
    },
    {
        id: 10,
        name: "ESPONJA CLASICA X 6 UN. ECOOO X 1",
        category: "esponja",
        price: 476.00,
        image: "https://via.placeholder.com/300x300/FFD700/666666?text=ESPONJA",
        offer: false
    },
    {
        id: 11,
        name: "LAMPAZO ALGODON 250GR X 1",
        category: "lampazo",
        price: 1850.00,
        image: "https://via.placeholder.com/300x300/F5F5DC/666666?text=LAMPAZO",
        offer: false
    },
    {
        id: 12,
        name: "MOPA MICROFIBRA 40CM X 1",
        category: "mopa",
        price: 2200.00,
        image: "https://via.placeholder.com/300x300/87CEEB/666666?text=MOPA",
        offer: false
    },
    {
        id: 13,
        name: "GUANTES LATEX TALLE M X 1 PAR",
        category: "guantes",
        price: 890.00,
        image: "https://via.placeholder.com/300x300/FFB6C1/666666?text=GUANTES",
        offer: false
    },
    {
        id: 14,
        name: "REPASADOR ALGODON 40X60 X 1",
        category: "repasador",
        price: 650.00,
        image: "https://via.placeholder.com/300x300/F0E68C/666666?text=REPASADOR",
        offer: false
    },
    {
        id: 15,
        name: "ESCOBILLON PARA BAÑO X 1",
        category: "escobillones",
        price: 1200.00,
        image: "https://via.placeholder.com/300x300/20B2AA/ffffff?text=ESCOBILLON",
        offer: false
    }
];

// Estado global de la aplicación
let currentPage = 'catalog';
let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentCategory = '';
let searchQuery = '';
let sortOrder = 'default';

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    setupEventListeners();
    updateBadges();
    renderProducts();
    populateCategoryFilter();
    
    // Verificar si hay un hash en la URL
    const hash = window.location.hash.substring(1);
    if (hash) {
        navigateTo(hash);
    }
}

function setupEventListeners() {
    // Logo click
    document.getElementById('logoImg').addEventListener('click', () => {
        navigateTo('catalog');
        currentCategory = '';
        renderProducts();
    });
    
    // Navegación
    document.querySelectorAll('[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.target.getAttribute('data-page');
            navigateTo(page);
        });
    });
    
    // Dropdown de categorías
    document.getElementById('categoriasBtn').addEventListener('mouseenter', showCategoriesMenu);
    document.querySelectorAll('[data-category]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const category = e.target.getAttribute('data-category');
            filterByCategory(category);
        });
    });
    
    // Iconos del header
    document.getElementById('wishlistIcon').addEventListener('click', () => navigateTo('wishlist'));
    document.getElementById('cartIcon').addEventListener('click', toggleCartDropdown);
    
    // Búsqueda
    document.getElementById('searchBtn').addEventListener('click', performSearch);
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
    
    // Filtros y ordenamiento
    document.getElementById('categoryFilter').addEventListener('change', (e) => {
        currentCategory = e.target.value;
        renderProducts();
    });
    
    document.getElementById('sortSelect').addEventListener('change', (e) => {
        sortOrder = e.target.value;
        renderProducts();
    });
    
    // Vista de productos
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.currentTarget.getAttribute('data-view');
            switchView(view);
        });
    });
    
    // Scroll to top
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    });
    
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    // Header sticky animation
    let lastScroll = 0;
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        if (currentScroll > lastScroll && currentScroll > 80) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }
        lastScroll = currentScroll;
    });
}

function navigateTo(page) {
    // Ocultar todas las páginas
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    
    // Mostrar la página seleccionada
    const pageElement = document.getElementById('page-' + page);
    if (pageElement) {
        pageElement.style.display = 'block';
        currentPage = page;
        
        // Actualizar navegación activa
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === page) {
                link.classList.add('active');
            }
        });
        
        // Renderizar contenido específico de la página
        switch(page) {
            case 'ofertas':
                renderOfertas();
                break;
            case 'wishlist':
                renderWishlist();
                break;
            case 'cart':
                renderCart();
                break;
            case 'checkout':
                renderCheckout();
                break;
        }
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Actualizar URL
        window.location.hash = page;
    }
}

function showCategoriesMenu() {
    // Ya está manejado con CSS :hover
}

function filterByCategory(category) {
    currentCategory = category;
    navigateTo('catalog');
    renderProducts();
    document.getElementById('categoryFilter').value = category;
}

function performSearch() {
    searchQuery = document.getElementById('searchInput').value.trim();
    navigateTo('catalog');
    renderProducts();
}

function renderProducts() {
    let filteredProducts = [...products];
    
    // Filtrar por categoría
    if (currentCategory) {
        filteredProducts = filteredProducts.filter(p => p.category === currentCategory);
    }
    
    // Filtrar por búsqueda
    if (searchQuery) {
        filteredProducts = filteredProducts.filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }
    
    // Ordenar
    if (sortOrder === 'price-asc') {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'price-desc') {
        filteredProducts.sort((a, b) => b.price - a.price);
    }
    
    // Actualizar contador
    const totalProducts = filteredProducts.length;
    document.getElementById('productsCount').textContent = 
        `Mostrando ${Math.min(15, totalProducts)} de ${totalProducts} productos`;
    
    // Renderizar
    const grid = document.getElementById('catalogGrid');
    if (filteredProducts.length === 0) {
        grid.innerHTML = '<div class="empty-state"><p>No se encontraron productos</p></div>';
        return;
    }
    
    grid.innerHTML = filteredProducts.map(product => createProductCard(product)).join('');
}

function renderOfertas() {
    const ofertasProducts = products.filter(p => p.offer);
    const grid = document.getElementById('ofertasGrid');
    grid.innerHTML = ofertasProducts.map(product => createProductCard(product)).join('');
}

function createProductCard(product) {
    const isInWishlist = wishlist.some(item => item.id === product.id);
    const isInCart = cart.some(item => item.id === product.id);
    
    return `
        <div class="product-card">
            ${product.offer ? '<div class="product-badge">Oferta</div>' : ''}
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
                <div class="product-overlay">
                    <button class="overlay-btn" onclick="openProductModal(${product.id})">
                        Ver Producto
                    </button>
                    <button class="overlay-btn" onclick="openProductModal(${product.id})">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M22 12c-2-4-6-7-10-7s-8 3-10 7c2 4 6 7 10 7s8-3 10-7z"></path>
                        </svg>
                    </button>
                    <button class="overlay-btn" onclick="toggleWishlist(${product.id})">
                        <svg viewBox="0 0 24 24" fill="${isInWishlist ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="product-info">
                <div class="product-title">${product.name}</div>
                <div class="product-category">(${getCategoryName(product.category)})</div>
                <div class="product-price">$${product.price.toLocaleString('es-AR', {minimumFractionDigits: 2})}</div>
            </div>
        </div>
    `;
}

function getCategoryName(category) {
    return category.toUpperCase().replace(/-/g, ' ');
}

function populateCategoryFilter() {
    const categories = [...new Set(products.map(p => p.category))];
    const select = document.getElementById('categoryFilter');
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = getCategoryName(cat);
        select.appendChild(option);
    });
}

function switchView(view) {
    const grid = document.getElementById('catalogGrid');
    const buttons = document.querySelectorAll('.view-btn');
    
    buttons.forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    if (view === 'list') {
        grid.classList.add('list-view');
    } else {
        grid.classList.remove('list-view');
    }
}

// Wishlist functions
function toggleWishlist(productId) {
    const product = products.find(p => p.id === productId);
    const index = wishlist.findIndex(item => item.id === productId);
    
    if (index > -1) {
        wishlist.splice(index, 1);
    } else {
        wishlist.push(product);
    }
    
    saveWishlist();
    updateBadges();
    renderProducts();
    if (currentPage === 'wishlist') {
        renderWishlist();
    }
}

function saveWishlist() {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

function renderWishlist() {
    const emptyState = document.getElementById('emptyWishlist');
    const table = document.getElementById('wishlistTable');
    const tbody = document.getElementById('wishlistBody');
    
    if (wishlist.length === 0) {
        emptyState.style.display = 'block';
        table.style.display = 'none';
        return;
    }
    
    emptyState.style.display = 'none';
    table.style.display = 'block';
    
    tbody.innerHTML = wishlist.map(product => {
        const isInCart = cart.some(item => item.id === product.id);
        return `
            <tr>
                <td><img src="${product.image}" alt="${product.name}" class="table-image"></td>
                <td class="table-product-name">${product.name}</td>
                <td class="table-price">desde: $${product.price.toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
                <td>
                    <button class="btn-primary ${isInCart ? 'btn-added' : ''}" 
                            onclick="addToCart(${product.id})"
                            ${isInCart ? 'disabled' : ''}>
                        ${isInCart ? 'AGREGADO' : 'AGREGAR AL CARRITO'}
                    </button>
                </td>
                <td>
                    <button class="remove-btn" onclick="toggleWishlist(${product.id})">×</button>
                </td>
            </tr>
        `;
    }).join('');
}

function clearWishlist() {
    if (confirm('¿Estás seguro de que quieres limpiar la lista de deseos?')) {
        wishlist = [];
        saveWishlist();
        updateBadges();
        renderWishlist();
    }
}

// Cart functions
function addToCart(productId, quantity = 1) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ ...product, quantity });
    }
    
    saveCart();
    updateBadges();
    renderProducts();
    updateCartDropdown();
    
    if (currentPage === 'wishlist') {
        renderWishlist();
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateBadges();
    renderCart();
    updateCartDropdown();
}

function updateCartQuantity(productId, quantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = Math.max(1, quantity);
        saveCart();
        renderCart();
        updateCartDropdown();
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function renderCart() {
    const emptyState = document.getElementById('emptyCart');
    const table = document.getElementById('cartTable');
    const tbody = document.getElementById('cartBody');
    const totalElement = document.getElementById('cartTotal');
    
    if (cart.length === 0) {
        emptyState.style.display = 'block';
        table.style.display = 'none';
        return;
    }
    
    emptyState.style.display = 'none';
    table.style.display = 'block';
    
    let total = 0;
    tbody.innerHTML = cart.map(item => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        
        return `
            <tr>
                <td><img src="${item.image}" alt="${item.name}" class="table-image"></td>
                <td class="table-product-name">${item.name}</td>
                <td class="table-price">$${item.price.toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
                <td>
                    <div class="quantity-input">
                        <button onclick="updateCartQuantity(${item.id}, ${item.quantity - 1})">-</button>
                        <input type="number" value="${item.quantity}" min="1" 
                               onchange="updateCartQuantity(${item.id}, parseInt(this.value))">
                        <button onclick="updateCartQuantity(${item.id}, ${item.quantity + 1})">+</button>
                    </div>
                </td>
                <td class="table-price">$${subtotal.toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
                <td>
                    <button class="remove-btn" onclick="removeFromCart(${item.id})">×</button>
                </td>
            </tr>
        `;
    }).join('');
    
    totalElement.textContent = '$' + total.toLocaleString('es-AR', {minimumFractionDigits: 2});
}

function clearCart() {
    if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
        cart = [];
        saveCart();
        updateBadges();
        renderCart();
        updateCartDropdown();
    }
}

function toggleCartDropdown() {
    const dropdown = document.getElementById('cartDropdown');
    dropdown.classList.toggle('active');
    updateCartDropdown();
}

function closeCartDropdown() {
    document.getElementById('cartDropdown').classList.remove('active');
}

function updateCartDropdown() {
    const itemsContainer = document.getElementById('cartDropdownItems');
    const totalElement = document.getElementById('cartDropdownTotal');
    
    if (cart.length === 0) {
        itemsContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">El carrito está vacío</p>';
        totalElement.textContent = '$0,00';
        return;
    }
    
    let total = 0;
    itemsContainer.innerHTML = cart.map(item => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        
        return `
            <div class="cart-dropdown-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-dropdown-item-info">
                    <div class="cart-dropdown-item-name">${item.name}</div>
                    <div class="cart-dropdown-item-price">
                        ${item.quantity} x $${item.price.toLocaleString('es-AR', {minimumFractionDigits: 2})}
                    </div>
                </div>
                <button class="cart-dropdown-remove" onclick="removeFromCart(${item.id})">×</button>
            </div>
        `;
    }).join('');
    
    totalElement.textContent = '$' + total.toLocaleString('es-AR', {minimumFractionDigits: 2});
}

function updateBadges() {
    document.getElementById('wishlistBadge').textContent = wishlist.length;
    document.getElementById('cartBadge').textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
}

// Product Modal
let currentModalProduct = null;
let modalQuantity = 1;

function openProductModal(productId) {
    const product = products.find(p => p.id === productId);
    currentModalProduct = product;
    modalQuantity = 1;
    
    const modal = document.getElementById('productModal');
    document.getElementById('modalImage').src = product.image;
    document.getElementById('modalTitle').textContent = product.name;
    document.getElementById('modalPrice').textContent = '$' + product.price.toLocaleString('es-AR', {minimumFractionDigits: 2});
    document.getElementById('modalQuantity').value = 1;
    
    // Update cart status
    const isInCart = cart.some(item => item.id === productId);
    document.getElementById('modalCartStatus').textContent = isInCart ? 
        'Este producto está en el carrito' : 'El carrito está vacío';
    
    // Thumbnails (simuladas)
    const thumbnails = document.getElementById('modalThumbnails');
    thumbnails.innerHTML = `
        <img src="${product.image}" alt="${product.name}">
        <img src="${product.image}" alt="${product.name}">
        <img src="${product.image}" alt="${product.name}">
    `;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('productModal').classList.remove('active');
    document.body.style.overflow = '';
    currentModalProduct = null;
}

function increaseQuantity() {
    modalQuantity++;
    document.getElementById('modalQuantity').value = modalQuantity;
}

function decreaseQuantity() {
    if (modalQuantity > 1) {
        modalQuantity--;
        document.getElementById('modalQuantity').value = modalQuantity;
    }
}

function addToCartFromModal() {
    if (currentModalProduct) {
        const quantity = parseInt(document.getElementById('modalQuantity').value);
        addToCart(currentModalProduct.id, quantity);
        closeModal();
    }
}

function toggleWishlistFromModal() {
    if (currentModalProduct) {
        toggleWishlist(currentModalProduct.id);
    }
}

// Checkout
function renderCheckout() {
    if (cart.length === 0) {
        navigateTo('cart');
        return;
    }
    
    const orderItems = document.getElementById('orderItems');
    const orderTotal = document.getElementById('orderTotal');
    
    let total = 0;
    orderItems.innerHTML = cart.map(item => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        
        return `
            <div class="order-item">
                <span>${item.name} × ${item.quantity}</span>
                <span>$${subtotal.toLocaleString('es-AR', {minimumFractionDigits: 2})}</span>
            </div>
        `;
    }).join('');
    
    orderTotal.textContent = '$' + total.toLocaleString('es-AR', {minimumFractionDigits: 2});
}

function submitOrder() {
    alert('¡Pedido realizado con éxito! En una versión futura, esto te redirigirá a WhatsApp.');
    // Aquí iría la lógica para redirigir a WhatsApp
    // Por ejemplo: window.location.href = 'https://wa.me/5493512345678?text=...';
}

// Click fuera del modal o dropdown para cerrar
document.addEventListener('click', (e) => {
    const modal = document.getElementById('productModal');
    if (e.target === modal) {
        closeModal();
    }
    
    const cartDropdown = document.getElementById('cartDropdown');
    const cartIcon = document.getElementById('cartIcon');
    if (!cartDropdown.contains(e.target) && !cartIcon.contains(e.target)) {
        closeCartDropdown();
    }
});
