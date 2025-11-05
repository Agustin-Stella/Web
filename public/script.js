import { db } from './firebase-config.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js';

const contenedor = document.getElementById('catalogo')
const inputSearch = document.getElementById('search')

// 📦 Cargar productos desde Firestore
async function cargarProductos(filtro = '') {
  try {
    const productosCol = collection(db, 'productos')
    const snapshot = await getDocs(productosCol)
    const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))

    // Filtrado simple en el cliente (case-insensitive)
    const filtered = filtro
      ? data.filter(p => p.nombre && p.nombre.toLowerCase().includes(filtro.toLowerCase()))
      : data

    contenedor.innerHTML = ''

    if (filtered.length === 0) {
      contenedor.innerHTML = '<p>No se encontraron productos.</p>'
      return
    }

    filtered.forEach(prod => {
      const card = document.createElement('div')
      card.className = 'producto'
      card.innerHTML = `
      <img src="${prod.imagen_url || ''}" alt="${prod.nombre || ''}">
      <h2>${prod.nombre || ''}</h2>
      <p class="precio">$${prod.precio ?? ''}</p>
      <p class="descripcion">${prod.descripcion || ''}</p>
    `
      contenedor.appendChild(card)
    })
  } catch (error) {
    console.error('Error al cargar productos desde Firestore:', error)
    contenedor.innerHTML = '<p>Error al cargar los productos.</p>'
  }
}

// 🔍 Buscar mientras se escribe
inputSearch.addEventListener('input', e => {
  const filtro = e.target.value
  cargarProductos(filtro)
})

// 🚀 Cargar al iniciar
cargarProductos()
