import { db } from './firebase.js'; // Asegúrate de que este archivo exporte `db`
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js';

console.log('public/script.js cargado');

const contenedor = document.getElementById('catalogo');
const inputSearch = document.getElementById('search');

if (!contenedor) {
  console.error('Elemento con id "catalogo" no encontrado. Asegúrate de que el script se cargue después del DOM.');
}
if (!inputSearch) {
  console.warn('Elemento con id "search" no encontrado. La búsqueda quedará deshabilitada.');
}

// 📦 Cargar productos desde Firestore
async function cargarProductos(filtro = '') {
  try {
    console.log('cargarProductos(): iniciando consulta a Firestore, filtro=', filtro);

    if (!db) {
      console.error('La variable `db` es undefined. Revisa que `firebase.js` exporte correctamente `db`.');
      contenedor && (contenedor.innerHTML = '<p>Error de configuración de Firebase.</p>');
      return;
    }

    const productosCol = collection(db, 'productos');
    const snapshot = await getDocs(productosCol);
    console.log('Firestore snapshot obtenido, docs count =', snapshot.size);
    const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    console.log('Productos crudos desde Firestore:', JSON.stringify(data, null, 2));
    
    // Debug: mostrar campos específicos
    data.forEach(prod => {
      console.log(`Producto "${prod.nombre}":`);
      console.log('- URL imagen:', prod.imagen);
      console.log('- Precio:', prod.precio);
      console.log('- ID:', prod.id);
    });

    // Filtrado simple en el cliente (case-insensitive)
    const filtered = filtro
      ? data.filter(p => p.nombre && p.nombre.toLowerCase().includes(filtro.toLowerCase()))
      : data;

    console.log('Filtrando productos:', filtered.map(p => ({
      id: p.id,
      nombre: p.nombre,
      imagen: p.imagen,
      imagen_url: p.imagen_url
    })));

    if (!contenedor) return;

    contenedor.innerHTML = '';

    if (filtered.length === 0) {
      contenedor.innerHTML = '<p>No se encontraron productos.</p>';
      return;
    }

    filtered.forEach(prod => {
      const card = document.createElement('div');
      card.className = 'producto';
      const imagenUrl = prod.imagen || prod.imagen_url || '';
      console.log(`Creando card para ${prod.nombre}, URL imagen:`, imagenUrl);
      card.innerHTML = `
        <img src="${imagenUrl}" alt="${prod.nombre || ''}" onerror="this.style.display='none'" onload="this.style.display='block'">
        <h2>${prod.nombre || ''}</h2>
        <p class="precio">$${prod.precio ?? ''}</p>
        <p class="descripcion">${prod.descripcion || ''}</p>
      `;
      contenedor.appendChild(card);
    });
  } catch (error) {
    console.error('Error al cargar productos desde Firestore:', error);
    contenedor && (contenedor.innerHTML = '<p>Error al cargar los productos.</p>');
  }
}

// Buscar mientras se escribe (si existe el input)
if (inputSearch) {
  inputSearch.addEventListener('input', e => {
    const filtro = e.target.value;
    cargarProductos(filtro);
  });
}

// 🚀 Cargar al iniciar
try {
  cargarProductos();
} catch (e) {
  console.error('Error en la llamada inicial a cargarProductos():', e);
}
