import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// 🔧 Configura con tus datos de Supabase
const SUPABASE_URL = 'https://hfszfljvmppgdcvkrjqy.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhmc3pmbGp2bXBwZ2RjdmtyanF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NzQ5MTMsImV4cCI6MjA3NzE1MDkxM30.z_RqXPMcqHHHy1brSc9Yom6atMoNTPIhwbwhBohIFb4'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const contenedor = document.getElementById('catalogo')
const inputSearch = document.getElementById('search')

// 📦 Cargar productos desde la base
async function cargarProductos(filtro = '') {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .ilike('nombre', `%${filtro}%`)

  if (error) {
    console.error('Error al cargar productos:', error)
    contenedor.innerHTML = '<p>Error al cargar los productos.</p>'
    return
  }

  contenedor.innerHTML = ''

  data.forEach(prod => {
    const card = document.createElement('div')
    card.className = 'producto'
    card.innerHTML = `
      <img src="${prod.imagen_url}" alt="${prod.nombre}">
      <h2>${prod.nombre}</h2>
      <p class="precio">$${prod.precio}</p>
      <p class="descripcion">${prod.descripcion}</p>
    `
    contenedor.appendChild(card)
  })
}

// 🔍 Buscar mientras se escribe
inputSearch.addEventListener('input', e => {
  const filtro = e.target.value
  cargarProductos(filtro)
})

// 🚀 Cargar al iniciar
cargarProductos()
