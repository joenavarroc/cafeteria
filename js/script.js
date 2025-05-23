
document.addEventListener('DOMContentLoaded', () => {
activarModoFacturacion(); // ← muestra productos disponibles

const datosEdicion = JSON.parse(localStorage.getItem('facturaEnEdicion'));

if (datosEdicion) {
  const { factura } = datosEdicion;
  if (factura && Array.isArray(factura.productos)) {
      window.factura = factura.productos;
      document.getElementById('metodoPago').value = factura.metodoPago || '';
  } else {
      console.error("No se encontró la lista de productos en los datos de edición.");
      window.factura = [];
  }
} else {
  console.error("No se encontraron datos de edición en localStorage.");
  window.factura = [];
}


renderFacturaEnLista();
});

function renderFacturaEnLista() {
const lista = document.getElementById('factura');
lista.innerHTML = ''; // Limpiar la lista antes de renderizar

console.log("Productos a renderizar: ", window.factura);  // Verifica qué datos estás recibiendo

if (!window.factura || window.factura.length === 0) {
  lista.innerHTML = '';
  return;
}

let subtotal = 0;

window.factura.forEach((p, i) => {
  const totalItem = p.precio * p.cantidad;
  subtotal += totalItem;

  const li = document.createElement('li');
  li.className = 'list-group-item d-flex justify-content-between align-items-center';
  li.innerHTML = `
    <div>
      ${p.nombre} x 
      <input type="number" value="${p.cantidad}" min="1" onchange="actualizarCantidad(${i}, this.value)" style="width: 60px;">
    </div>
    <div>
      $${totalItem.toFixed(2)}
      <button class="btn btn-sm btn-danger ms-2" onclick="eliminarProductoDeFactura(${i})">❌</button>
    </div>
  `;

  lista.appendChild(li); // Agregar el elemento a la lista
});

document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`; // Actualizar subtotal
}

function actualizarCantidad(index, cantidad) {
cantidad = parseInt(cantidad);
if (isNaN(cantidad) || cantidad < 1) {
  alert("La cantidad debe ser al menos 1.");
  return;
}
window.factura[index].cantidad = cantidad;
renderFacturaEnLista();
}

function eliminarProductoDeFactura(index) {
window.factura.splice(index, 1);
renderFacturaEnLista();
}

function guardarFacturaEditada() {
const datosEdicion = JSON.parse(localStorage.getItem('facturaEnEdicion'));
const index = datosEdicion.index;

const metodoPago = document.getElementById('metodoPago').value;
const total = window.factura.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);

const ventas = JSON.parse(localStorage.getItem('ventas')) || [];

ventas[index] = {
  ...ventas[index],
  productos: window.factura,
  metodoPago,
  total
};

localStorage.setItem('ventas', JSON.stringify(ventas));
localStorage.removeItem('facturaEnEdicion');

window.location.href = 'ventas.html';
}

function agregarAFactura(id) {
    const producto = productos.find(p => p.id === id);
    const existente = window.factura.find(p => p.id === id);
  
    if (!producto) return;
  
    const cantidadExistente = existente ? existente.cantidad : 0;
  
    if (cantidadExistente + 1 > producto.stock) {
      alert("No hay suficiente stock disponible.");
      return;
    }
  
    if (existente) {
      existente.cantidad += 1;
    } else {
      window.factura.push({ ...producto, cantidad: 1 });
    }
  
    renderFacturaEnLista();
  }
  

let ventas = [];

function finalizarVenta() {
    if (!window.factura || window.factura.length === 0) {
      alert("No hay productos en la factura.");
      return;
    }
  
    const metodo = document.getElementById("metodoPago").value;
    const fecha = new Date().toISOString().split('T')[0];
    const datosEdicion = JSON.parse(localStorage.getItem('facturaEnEdicion'));
    const ventas = JSON.parse(localStorage.getItem('ventas')) || [];
  
    const total = window.factura.reduce((acc, prod) => acc + prod.precio * (prod.cantidad || 1), 0);
    let venta = null;
  
    if (datosEdicion) {
      const index = datosEdicion.index;
  
      venta = {
        ...ventas[index],
        productos: [...window.factura],
        metodoPago: metodo,
        fecha,
        total
      };
  
      ventas[index] = venta;
      localStorage.removeItem('facturaEnEdicion');
      alert("Factura editada correctamente.");
    } else {
      venta = {
        id: Date.now(),
        productos: [...window.factura],
        metodoPago: metodo,
        fecha,
        total,
        numeroFactura: null
      };
  
      ventas.push(venta);
    }
  
    // 🔽 DESCONTAR STOCK
    window.factura.forEach(pFactura => {
      const pStock = productos.find(p => p.id === pFactura.id);
      if (pStock) {
        pStock.stock = (pStock.stock || 0) - pFactura.cantidad;
        if (pStock.stock < 0) pStock.stock = 0; // Por si acaso
      }
    });
  
    // Guardar productos actualizados en localStorage
    localStorage.setItem('productos', JSON.stringify(productos));
  
    // Guardar ventas
    localStorage.setItem('ventas', JSON.stringify(ventas));
  
    // Guardar en historial de cierres
    let historial = JSON.parse(localStorage.getItem('historialCierres')) || [];
    const existente = historial.find(dia => dia.fecha === fecha);
  
    if (existente) {
      existente.ventas.push(venta);
      existente.total += venta.total;
    } else {
      historial.push({
        id: historial.length + 1,
        fecha,
        ventas: [venta],
        total: venta.total
      });
    }
  
    localStorage.setItem('historialCierres', JSON.stringify(historial));
  
    // Mostrar ticket
    let ticket = `🧾 Ticket temporal\n`;
    ticket += `📅 Fecha: ${venta.fecha}\n`;
    ticket += `🧍‍♂️ Método de pago: ${venta.metodoPago}\n\n`;
    venta.productos.forEach(p => {
      ticket += `• ${p.nombre} - $${p.precio.toFixed(2)} x${p.cantidad}\n`;
    });
    ticket += `\n💵 Total: $${venta.total.toFixed(2)}`;
    alert(ticket);
  
    // Limpiar factura
    window.factura = [];
    renderFacturaEnLista();
  }
  
function quitarDeFactura(index) {
if (window.factura[index].cantidad > 1) {
  window.factura[index].cantidad -= 1;
} else {
  window.factura.splice(index, 1); // Eliminar el producto si ya está en 1
}
renderFacturaEnLista();
}    

// =============================
// 🧰 FUNCIONES DE EDICIÓN VISUAL
// =============================
let modoEdicion = false;

let productos = [
{ id: 1, nombre: 'Café', precio: 300, stock: 10, imagen: 'https://cdn.pixabay.com/photo/2014/12/11/02/57/coffee-563800_1280.jpg' },
{ id: 2, nombre: 'Tostado', precio: 500, stock: 10, imagen: 'https://cdn.pixabay.com/photo/2016/11/29/04/00/bread-1867208_1280.jpg' },
{ id: 3, nombre: 'Pastel', precio: 600, stock: 10, imagen: 'https://cdn.pixabay.com/photo/2020/03/10/03/49/red-velvet-cake-4917734_1280.jpg' },
{ id: 4, nombre: 'Medialuna', precio: 250, stock: 10, imagen: 'https://cdn.pixabay.com/photo/2018/11/24/23/46/croissant-3836578_1280.jpg' },
{ id: 5, nombre: 'Jugo', precio: 150, stock: 10, imagen: 'https://cdn.pixabay.com/photo/2020/03/02/15/22/ginger-juice-4896003_1280.jpg' },
{ id: 6, nombre: 'Muffin', precio: 350, stock: 10, imagen: 'https://cdn.pixabay.com/photo/2020/03/06/03/25/red-velvet-cake-4905933_1280.jpg' },
{ id: 7, nombre: 'Cookie', precio: 200, stock: 10, imagen: 'https://cdn.pixabay.com/photo/2015/08/12/17/23/pastries-886098_960_720.jpg' },
{ id: 8, nombre: 'Frape', precio: 2000, stock: 10, imagen: 'https://cdn.pixabay.com/photo/2020/03/07/05/18/beverage-4908765_1280.jpg' },
{ id: 9, nombre: 'Macarrones', precio: 3000, stock: 10, imagen: 'https://cdn.pixabay.com/photo/2021/03/04/10/14/macaroons-6067490_1280.jpg' },
{ id: 10, nombre: 'Smoothie', precio: 7000, stock: 10, imagen: 'https://cdn.pixabay.com/photo/2020/01/09/04/21/smoothie-4751820_1280.jpg' },
{ id: 11, nombre: 'Te', precio: 2500, stock: 10, imagen: 'https://cdn.pixabay.com/photo/2016/10/14/18/21/tee-1740871_1280.jpg' },
{ id: 12, nombre: 'Panini', precio: 6300, stock: 10, imagen: 'https://cdn.pixabay.com/photo/2015/09/11/07/34/food-935393_1280.jpg' },
{ id: 13, nombre: 'Scone', precio: 3000, stock: 10, imagen: 'https://cdn.pixabay.com/photo/2018/12/12/20/19/scone-3871598_960_720.jpg' },
{ id: 14, nombre: 'Tostadas', precio: 5300, stock: 10, imagen: 'https://cdn.pixabay.com/photo/2015/07/14/12/56/blackberries-844876_960_720.jpg' },
{ id: 15, nombre: 'Wrap', precio: 7600, stock: 10, imagen: 'https://cdn.pixabay.com/photo/2022/08/27/14/12/tawook-chicken-sandwich-7414558_960_720.jpg' },
{ id: 16, nombre: 'Ensalada', precio: 3000, stock: 10, imagen: 'https://cdn.pixabay.com/photo/2015/05/31/13/59/salad-791891_1280.jpg' }
];      

let factura = [];

const listaProductos = document.getElementById('lista-productos');
const facturaList = document.getElementById('factura');
const subtotalSpan = document.getElementById('subtotal');



// =============================
// 🔍 BÚSQUEDA
// =============================
function buscarProductos(nombre) {
const nombreLower = nombre.toLowerCase();
return productos.filter(p => p.nombre.toLowerCase().includes(nombreLower));
}


function renderBusqueda(lista) {
const contenedorResultados = document.getElementById('resultadosBusqueda');
const contenedorProductos = document.getElementById('lista-productos');

if (!contenedorResultados || !contenedorProductos) {
console.error('❌ No se encontraron los contenedores necesarios');
return;
}

// Mostrar mensaje si no hay coincidencias
if (lista.length === 0) {
contenedorResultados.style.display = 'block';
contenedorResultados.innerHTML = '<p class="text-light">No se encontraron productos.</p>';
contenedorProductos.style.display = 'none';
return;
}

// Mostrar resultados filtrados
contenedorResultados.innerHTML = '';
contenedorResultados.style.display = 'flex';
contenedorProductos.style.display = 'none';

lista.forEach(prod => {
const div = document.createElement('div');
div.className = 'producto position-relative me-3';
div.innerHTML = `
<img src="${prod.imagen}" alt="${prod.nombre}">
<h6>${prod.nombre}</h6>
<p>$${prod.precio}</p>
`;
div.onclick = () => {
if (!modoEdicion) agregarAFactura(prod.id);
};
contenedorResultados.appendChild(div);
});
}

function renderProductos() {
listaProductos.innerHTML = '';
productos.forEach(prod => {
  const div = document.createElement('div');
  div.className = 'producto position-relative me-3';
  div.innerHTML = `
    <img src="${prod.imagen}" alt="${prod.nombre}">
    <h6>${prod.nombre}</h6>
    <p>$${prod.precio}</p>
    ${
      modoEdicion
        ? `<div class="position-absolute top-0 end-0 p-1">
            <button class="btn btn-sm btn-outline-primary me-1" onclick="editarProducto(${prod.id}, event)">✏️</button>
            <button class="btn btn-sm btn-outline-danger" onclick="eliminarProducto(${prod.id}, event)">🗑️</button>
          </div>`
        : ''
    }
  `;
  div.onclick = () => {
    if (!modoEdicion) agregarAFactura(prod.id);
  };
  listaProductos.appendChild(div);
});
}

function actualizarVistaModo() {
const etiqueta = document.getElementById('modoActual');
if (etiqueta) {
  etiqueta.textContent = modoEdicion ? 'Modo: Edición' : 'Modo: Facturación';
  etiqueta.className = modoEdicion ? 'me-3 fw-bold text-danger' : 'me-3 fw-bold text-primary';
}
}


function activarModoEdicion() {
modoEdicion = true;
document.getElementById('btnNuevoProducto').style.display = 'inline-block';
renderProductos();
actualizarVistaModo();
}

function activarModoFacturacion() {
modoEdicion = false;
document.getElementById('btnNuevoProducto').style.display = 'none';
renderProductos();
actualizarVistaModo();
}


function editarProducto(id, event) {
event.stopPropagation(); // Prevenir que se agregue a la factura
const producto = productos.find(p => p.id === id);
document.getElementById('productoId').value = id;
document.getElementById('nombreProducto').value = producto.nombre;
document.getElementById('precioProducto').value = producto.precio;
document.getElementById('imagenProducto').value = producto.imagen;
const modal = new bootstrap.Modal(document.getElementById('modalProducto'));
modal.show();
}

function eliminarProducto(id, event) {
event.stopPropagation(); // Prevenir agregar a factura
if (confirm('¿Estás seguro de eliminar este producto?')) {
  productos = productos.filter(p => p.id !== id);
  renderProductos();
}
}

function abrirNuevoProducto() {
document.getElementById('productoId').value = '';
document.getElementById('nombreProducto').value = '';
document.getElementById('precioProducto').value = '';
document.getElementById('imagenProducto').value = '';
const modal = new bootstrap.Modal(document.getElementById('modalProducto'));
modal.show();
}

function mostrarPreviewImagenes() {
const contenedor = document.getElementById('previewImagenes');
contenedor.innerHTML = '';
const urlsUnicas = [...new Set(productos.map(p => p.imagen))];

urlsUnicas.forEach(url => {
  const img = document.createElement('img');
  img.src = url;
  img.title = 'Click para usar esta imagen';
  img.style.width = '64px';
  img.style.height = '64px';
  img.style.objectFit = 'cover';
  img.style.border = '2px solid transparent';
  img.style.borderRadius = '6px';
  img.style.cursor = 'pointer';
  img.style.marginRight = '8px';
  img.onclick = () => {
    document.getElementById('imagenProducto').value = url;
  };
  contenedor.appendChild(img);
});
}

document.getElementById('formProducto').addEventListener('submit', function (e) {
e.preventDefault();
const id = document.getElementById('productoId').value;
const nombre = document.getElementById('nombreProducto').value;
const precio = parseFloat(document.getElementById('precioProducto').value);
const imagen = document.getElementById('imagenProducto').value || 'https://cdn-icons-png.flaticon.com/512/1046/1046784.png';

if (id) {
  const prod = productos.find(p => p.id == id);
  prod.nombre = nombre;
  prod.precio = precio;
  prod.imagen = imagen;
} else {
  const nuevo = { id: Date.now(), nombre, precio, imagen };
  productos.push(nuevo);
}

renderProductos();
bootstrap.Modal.getInstance(document.getElementById('modalProducto')).hide();
});   

document.getElementById('imagenLocal').addEventListener('change', function(event) {
const file = event.target.files[0];
if (file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById('imagenProducto').value = e.target.result; // Establece la URL de la imagen en el campo de texto
    mostrarPreviewImagenes(); // Muestra la imagen en la vista previa
  };
  reader.readAsDataURL(file); // Lee el archivo como una URL de datos
}
});


// CLAVE PARA EDICION
function solicitarClaveEdicion() {
const clave = prompt("Ingrese la clave para activar el modo edición:");
const claveCorrecta = "admin123"; // Podés cambiarla

if (clave === claveCorrecta) {
  activarModoEdicion();
} else {
  alert("Clave incorrecta. No se activó el modo edición.");
}
}

document.addEventListener('mousemove', function(e) {
const navbar = document.querySelector('.navbar-inferior');
if (window.innerHeight - e.clientY < 50) {
  navbar.style.opacity = 1;
  navbar.style.pointerEvents = 'auto';
} else {
  navbar.style.opacity = 0;
  navbar.style.pointerEvents = 'none';
}
});

// Buscador de productos

document.getElementById('busquedaProducto').addEventListener('input', (e) => {
const texto = e.target.value.trim();
const listaProductos = document.getElementById('resultadosBusqueda'); // Asegúrate de que el contenedor sea 'resultadosBusqueda'

if (texto === '') {
// 🧹 Vaciar productos si no hay búsqueda
listaProductos.innerHTML = '';  // Ahora se actualiza 'resultadosBusqueda'
} else {
const resultados = buscarProductos(texto);
renderBusqueda(resultados);
}
});


document.getElementById('busquedaProducto').addEventListener('input', (e) => {
const termino = e.target.value.trim().toLowerCase();

if (termino === '') {
// Si el input está vacío, mostrar lista original
document.getElementById('resultadosBusqueda').style.display = 'none';
document.getElementById('lista-productos').style.display = 'flex';
return;
}

const filtrados = listaProductos.filter(prod => 
prod.nombre.toLowerCase().includes(termino)
);

renderBusqueda(filtrados);
});

// CALCULADORA
let calculoActual = '';

function abrirCalculadora() {
calculoActual = '';
document.getElementById('calcDisplay').value = '';
const modal = new bootstrap.Modal(document.getElementById('modalCalculadora'));
modal.show();
}

function agregarCalc(valor) {
calculoActual += valor;
document.getElementById('calcDisplay').value = calculoActual;
}

function borrarCalc() {
calculoActual = '';
document.getElementById('calcDisplay').value = '';
}

function calcular() {
try {
const resultado = eval(calculoActual);
calculoActual = resultado;
document.getElementById('calcDisplay').value = resultado;
} catch {
document.getElementById('calcDisplay').value = 'Error';
calculoActual = '';
}
}
// Habilitar uso del teclado para la calculadora
document.addEventListener('keydown', function (event) {
const modal = document.getElementById('modalCalculadora');
const isVisible = modal.classList.contains('show');
if (!isVisible) return; // Solo si el modal está abierto

const tecla = event.key;

if (!isNaN(tecla) || ['+', '-', '*', '/', '.'].includes(tecla)) {
agregarCalc(tecla);
} else if (tecla === 'Enter') {
calcular();
} else if (tecla === 'Backspace') {
calculoActual = calculoActual.slice(0, -1);
document.getElementById('calcDisplay').value = calculoActual;
} else if (tecla.toLowerCase() === 'c') {
borrarCalc();
}
});

modoEdicion = true; // Bien

function solicitarClaveEdicion() {
const clave = prompt("Ingrese la clave para activar el modo edición:");
const claveCorrecta = "admin123"; // Cambiala si querés

if (clave === claveCorrecta) {
  activarModoEdicion();
} else {
  alert("Clave incorrecta. No se activó el modo edición.");
}
}

function activarModoEdicion() {
modoEdicion = true;
console.log("🔧 Modo edición ACTIVADO");

const configBtn = document.getElementById('btnConfigNegocio');
if (configBtn) configBtn.style.display = 'inline-block';

const btnNuevo = document.getElementById('btnNuevoProducto');
if (btnNuevo) btnNuevo.style.display = 'inline-block';

if (typeof renderProductos === 'function') {
  renderProductos();
}

if (typeof actualizarVistaModo === 'function') {
  actualizarVistaModo();
}

alert('🔓 Modo edición activado');
}

function activarModoFacturacion() {
modoEdicion = false;
document.getElementById('btnNuevoProducto').style.display = 'none';
document.getElementById('btnConfigNegocio').style.display = 'none';
renderProductos();
actualizarVistaModo();
}

function abrirModalConfiguracion() {
const nombreActual = localStorage.getItem('nombreNegocio') || '';
const imagenActual = localStorage.getItem('imagenFondo') || '';
const colorActual = localStorage.getItem('colorTexto') || '#000000';

document.getElementById('nuevoNombreNegocio').value = nombreActual;
document.getElementById('nuevaImagenFondo').value = imagenActual;
document.getElementById('colorTexto').value = colorActual;

const modal = new bootstrap.Modal(document.getElementById('modalConfiguracion'));
modal.show();
}

document.getElementById('formConfiguracion').addEventListener('submit', function (e) {
e.preventDefault();

const nuevoNombre = document.getElementById('nuevoNombreNegocio').value.trim();
const nuevaImagen = document.getElementById('nuevaImagenFondo').value.trim();
const nuevoColor = document.getElementById('colorTexto').value;

if (nuevoNombre) {
  localStorage.setItem('nombreNegocio', nuevoNombre);
  document.getElementById('nombreNegocioTexto').textContent = nuevoNombre;
}

if (nuevaImagen) {
  localStorage.setItem('imagenFondo', nuevaImagen);
  document.body.style.backgroundImage = `url('${nuevaImagen}')`;

  const fondo = document.querySelector('.bg-body');
  if (fondo) fondo.style.backgroundImage = `url('${nuevaImagen}')`;
}

if (nuevoColor) {
  localStorage.setItem('colorTexto', nuevoColor);
  aplicarColorTexto(nuevoColor);
}

const modal = bootstrap.Modal.getInstance(document.getElementById('modalConfiguracion'));
modal.hide();
});

function aplicarColorTexto(color) {
// Encabezados
document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(el => {
  el.style.color = color;
});

// Elementos <strong> como el de Subtotal
document.querySelectorAll('strong').forEach(el => {
  el.style.color = color;
});

// Si querés agregar más clases específicas:
document.querySelectorAll('.titulo-dinamico, .factura-box div').forEach(el => {
  el.style.color = color;
});
}


document.addEventListener('DOMContentLoaded', () => {
const nombre = localStorage.getItem('nombreNegocio');
const imagen = localStorage.getItem('imagenFondo');
const colorTexto = localStorage.getItem('colorTexto');

if (nombre) {
  document.getElementById('nombreNegocioTexto').textContent = nombre;
}

if (imagen) {
  document.body.style.backgroundImage = `url('${imagen}')`;

  const fondo = document.querySelector('.bg-body');
  if (fondo) fondo.style.backgroundImage = `url('${imagen}')`;
}

if (colorTexto) {
  aplicarColorTexto(colorTexto);
}
});




    let fechaSeleccionada = null;

    function cargarHistorial() {
      const historial = JSON.parse(localStorage.getItem('historialCierres')) || [];
      const tbody = document.getElementById('historialBody');
      tbody.innerHTML = '';

      if (historial.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center">No hay cierres registrados.</td></tr>`;
        return;
      }

      historial.forEach(dia => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
          <td>${dia.id}</td>
          <td>${dia.fecha}</td>
          <td>$${dia.total.toFixed(2)}</td>
          <td>
            <button class="btn btn-sm btn-primary" onclick="verDetalle(${dia.id})">👁️ Ver</button>
            <button class="btn btn-sm btn-warning" onclick="verDetalleMetodoPago('${dia.fecha}')">💳 Detalle</button>
            <button class="btn btn-sm btn-info" onclick="verGrafico('${dia.fecha}')">📊 Gráfico</button>
          </td>
        `;
        tbody.appendChild(fila);
      });
    }

    function verDetalleMetodoPago(fecha) {
      const historial = JSON.parse(localStorage.getItem('historialCierres')) || [];
      const dia = historial.find(d => d.fecha === fecha);
      if (!dia) return;
    
      const resumen = {};
    
      dia.ventas.forEach(v => {
        resumen[v.metodoPago] = (resumen[v.metodoPago] || 0) + v.total;
      });
    
      let mensaje = `💳 Detalle de pagos del día ${fecha}:\n\n`;
      for (const metodo in resumen) {
        mensaje += `• ${metodo}: $${resumen[metodo].toFixed(2)}\n`;
      }
    
      alert(mensaje); // Podés usar un modal si preferís algo más elegante
    }    

    function verDetalle(id) {
      const historial = JSON.parse(localStorage.getItem('historialCierres')) || [];
      const dia = historial.find(d => d.id === id);
      if (!dia) return;
    
      const contenedor = document.getElementById('detalleVentasDia');
      const nombreNegocio = localStorage.getItem('nombreNegocio') || 'Mi Negocio';
      contenedor.innerHTML = '';
    
      dia.ventas.forEach(v => {
        let cuerpoTicket = `
          <div style="font-family: monospace; max-width: 320px; background: #fff; padding: 16px; border: 1px dashed #999;">
            <div class="text-center mb-2">
              <strong style="font-size: 1.2em;">${nombreNegocio}</strong><br>
              -----------------------------<br>
              Venta #${v.id}<br>
              Fecha: ${v.fecha}<br>
              Pago: ${v.metodoPago}<br>
              -----------------------------<br>
            </div>
        `;
    
        v.productos.forEach(p => {
          const cantidad = p.cantidad || 1;
          const precio = p.precio;
          const total = precio * cantidad;
    
          cuerpoTicket += `
            ${p.nombre}<br>
            ${cantidad} x $${precio.toFixed(2)} = $${total.toFixed(2)}<br>
          `;
        });
    
        cuerpoTicket += `
            -----------------------------<br>
            <strong>Total: $${v.total.toFixed(2)}</strong><br>
            -----------------------------<br>
        `;
    
        // QR
        const textoQR = `
    ${nombreNegocio}
    Venta ID: ${v.id}
    Fecha: ${v.fecha}
    Método de pago: ${v.metodoPago}
    Total: $${v.total.toFixed(2)}
        `.trim();
    
        const textoCodificado = encodeURIComponent(textoQR);
        const qr = `<div class="text-center mt-2"><img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${textoCodificado}" alt="QR Ticket"></div>`;
    
        const div = document.createElement('div');
        div.className = 'mb-4 d-flex flex-column align-items-center';
        div.innerHTML = cuerpoTicket + qr + '</div>';
    
        contenedor.appendChild(div);
      });
    
      new bootstrap.Modal(document.getElementById('modalDetalle')).show();
    }
    
    

    function verGrafico(fecha) {
      fechaSeleccionada = fecha;
      const historial = JSON.parse(localStorage.getItem('historialCierres')) || [];
      const dia = historial.find(d => d.fecha === fecha);
      if (!dia) return;
    
      const totalesPorProducto = {};
    
      dia.ventas.forEach(venta => {
        venta.productos.forEach(producto => {
          const nombre = producto.nombre;
          const cantidad = producto.cantidad || 1;
          const subtotal = producto.precio * cantidad;
    
          totalesPorProducto[nombre] = (totalesPorProducto[nombre] || 0) + subtotal;
        });
      });
    
      const nombres = Object.keys(totalesPorProducto);
      const montos = Object.values(totalesPorProducto);
    
      if (window.miGrafico) {
        window.miGrafico.destroy();
      }
    
      const tipoGrafico = document.getElementById('tipoGrafico').value;
      const ctx = document.getElementById('graficoVentas').getContext('2d');
      window.miGrafico = new Chart(ctx, {
        type: tipoGrafico,
        data: {
          labels: nombres,
          datasets: [{
            label: 'Monto Vendido ($)',
            data: montos,
            backgroundColor: nombres.map(() => `hsl(${Math.random() * 360}, 70%, 60%)`)
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: tipoGrafico !== 'bar' },
            tooltip: {
              callbacks: {
                label: ctx => `Total: $${ctx.raw.toFixed(2)}`
              }
            }
          }
        }
      });
    }  

    function actualizarGrafico() {
      if (fechaSeleccionada) verGrafico(fechaSeleccionada);
    }

    document.addEventListener('DOMContentLoaded', cargarHistorial);




      document.addEventListener('DOMContentLoaded', () => {
        const ventas = JSON.parse(localStorage.getItem('ventas')) || [];
        const ventasBody = document.getElementById('ventasBody');
        const totalGeneralTd = document.getElementById('totalGeneral');
      
        ventasBody.innerHTML = '';
        let totalGeneral = 0;
      
        if (ventas.length === 0) {
          ventasBody.innerHTML = '<tr><td colspan="5" class="text-center">No hay ventas registradas.</td></tr>';
          totalGeneralTd.textContent = '$0.00';
        } else {
          ventas.filter(v => v && typeof v.total === 'number' && v.fecha && v.metodoPago).forEach((v, i) => {
            // Acá va tu lógica actual para mostrar cada venta
            // ...
          });
        
          totalGeneralTd.textContent = `$${totalGeneral.toFixed(2)}`;
        }
        
      
        ventas.filter(v => v && typeof v.total === 'number' && v.fecha && v.metodoPago).forEach((v, i) => {
          const fila = document.createElement('tr');
          const numeroFactura = v.numeroFactura || '---';
      
          const btnTicket = document.createElement('button');
          btnTicket.className = 'icon-btn text-primary';
          btnTicket.innerHTML = '<i class="bi bi-receipt"></i>';
          btnTicket.type = 'button';
          btnTicket.addEventListener('click', () => verTicket(v));
      
          const contenedorAcciones = document.createElement('td');
          contenedorAcciones.appendChild(btnTicket);
      
          if (!v.numeroFactura) {
            const btnAceptar = document.createElement('button');
            btnAceptar.className = 'icon-btn text-success';
            btnAceptar.innerHTML = '<i class="bi bi-check-circle-fill"></i>';
            btnAceptar.type = 'button';
            btnAceptar.addEventListener('click', () => aceptarFactura(i));
      
            const btnEditar = document.createElement('button');
            btnEditar.className = 'icon-btn text-warning';
            btnEditar.innerHTML = '<i class="bi bi-pencil-square"></i>';
            btnEditar.type = 'button';
            btnEditar.addEventListener('click', () => editarFactura(i));
      
            const btnEliminar = document.createElement('button');
            btnEliminar.className = 'icon-btn text-danger';
            btnEliminar.innerHTML = '<i class="bi bi-trash-fill"></i>';
            btnEliminar.type = 'button';
            btnEliminar.addEventListener('click', () => eliminarVenta(i));
      
            contenedorAcciones.appendChild(btnAceptar);
            contenedorAcciones.appendChild(btnEditar);
            contenedorAcciones.appendChild(btnEliminar);
          }
      
          fila.innerHTML = `
            <td>${numeroFactura}</td>
            <td>${v.fecha}</td>
            <td>${v.metodoPago}</td>
            <td>$${v.total.toFixed(2)}</td>
          `;
          fila.appendChild(contenedorAcciones);
          ventasBody.appendChild(fila);
      
          totalGeneral += typeof v.total === 'number' ? v.total : 0;
        });
      
        totalGeneralTd.textContent = `$${totalGeneral.toFixed(2)}`;
      
        // Agregar eventos a botones globales
        document.getElementById('btnCerrarDia')?.addEventListener('click', confirmarCierre);
        document.getElementById('btnVolver')?.addEventListener('click', () => {
        location.href = 'cobro.html'; // Aquí deberías verificar que 'cobro.html' esté en la ruta correcta
        });
      });
      
    
      function aceptarFactura(index) {
        const ventas = JSON.parse(localStorage.getItem('ventas')) || [];
        const venta = ventas[index];
    
        if (!venta.numeroFactura) {
          let ultimo = parseInt(localStorage.getItem('ultimoNumeroFactura') || '0', 10);
          ultimo += 1;
    
          venta.numeroFactura = ultimo.toString().padStart(7, '0');
          localStorage.setItem('ultimoNumeroFactura', ultimo);
          ventas[index] = venta;
          localStorage.setItem('ventas', JSON.stringify(ventas));
    
          alert(`✅ Venta aceptada con número de factura ${venta.numeroFactura}`);
          location.reload();
        }
      }
    
      function eliminarVenta(index) {
        if (confirm('¿Seguro que querés eliminar esta venta?')) {
          const ventas = JSON.parse(localStorage.getItem('ventas')) || [];
          ventas.splice(index, 1);
          localStorage.setItem('ventas', JSON.stringify(ventas));
          location.reload();
        }
      }
    
      function editarFactura(index) {
        const ventas = JSON.parse(localStorage.getItem('ventas')) || [];
        const factura = ventas[index];
        localStorage.setItem('facturaEnEdicion', JSON.stringify({ factura, index }));
        window.location.href = 'cobro.html';
      }
    
      function verTicket(venta) {
        const nombreNegocio = localStorage.getItem('nombreNegocio') || 'Mi Negocio';
    
        let cuerpoTicket = `
          <div style="font-family: monospace; max-width: 320px; background: #fff; padding: 16px; border: 1px dashed #999;">
            <div class="text-center mb-2">
              <strong style="font-size: 1.2em;">${nombreNegocio}</strong><br>
              -----------------------------<br>
              Venta #${venta.id}<br>
              Fecha: ${venta.fecha}<br>
              Pago: ${venta.metodoPago}<br>
              -----------------------------<br>
            </div>
        `;
    
        venta.productos.forEach(p => {
          const cantidad = p.cantidad || 1;
          const total = p.precio * cantidad;
          cuerpoTicket += `${p.nombre}<br>${cantidad} x $${p.precio.toFixed(2)} = $${total.toFixed(2)}<br>`;
        });
    
        cuerpoTicket += `
            -----------------------------<br>
            <strong>Total: $${venta.total.toFixed(2)}</strong><br>
            -----------------------------<br>
        `;
    
        const textoQR = `
    ${nombreNegocio}
    Venta ID: ${venta.id}
    Fecha: ${venta.fecha}
    Método de pago: ${venta.metodoPago}
    Total: $${venta.total.toFixed(2)}
        `.trim();
    
        const qr = `<div class="text-center mt-2"><img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(textoQR)}" alt="QR Ticket"></div>`;
    
        document.getElementById('ticketContenido').innerHTML = cuerpoTicket + qr + '</div>';
    
        const modal = new bootstrap.Modal(document.getElementById('ticketModal'));
        modal.show();
      }
    
      function enviarPorEmail(id) {
        const ventas = JSON.parse(localStorage.getItem('ventas')) || [];
        const venta = ventas.find(v => v.id === id);
    
        if (venta) {
          const templateParams = {
            subject: 'Detalles de tu Venta',
            id: venta.id,
            fecha: venta.fecha,
            productos: venta.productos.map(p => `${p.nombre} ($${p.precio.toFixed(2)})`).join(', '),
            total: `$${venta.total.toFixed(2)}`
          };
    
          emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams)
            .then(() => alert('Correo enviado con éxito'))
            .catch(error => alert('Error al enviar el correo: ' + error.text));
        }
      }
    
      function cerrarDia() {
        const hoy = new Date().toISOString().split('T')[0];
        const ventasTodas = JSON.parse(localStorage.getItem('ventas')) || [];
        const ventasHoy = ventasTodas.filter(v => v.fecha.startsWith(hoy));
      
        if (ventasHoy.length === 0) {
          alert('No hay ventas para cerrar el día.');
          return;
        }
      
        // ✅ Aquí usamos la línea corregida
        const totalHoy = ventasHoy.reduce((acc, v) => acc + (typeof v.total === 'number' ? v.total : 0), 0);
      
        const historial = JSON.parse(localStorage.getItem('historialCierres')) || [];
        const indexCierre = historial.findIndex(c => c.fecha === hoy);
      
        if (indexCierre !== -1) {
          historial[indexCierre].ventas = historial[indexCierre].ventas.concat(ventasHoy);
          historial[indexCierre].total += totalHoy;
        } else {
          const nuevoId = historial.length > 0 ? historial[historial.length - 1].id + 1 : 1;
          historial.push({
            id: nuevoId,
            fecha: hoy,
            total: totalHoy,
            ventas: ventasHoy
          });
        }
      
        localStorage.setItem('historialCierres', JSON.stringify(historial));
      
        const ventasRestantes = ventasTodas.filter(v => !v.fecha.startsWith(hoy));
        localStorage.setItem('ventas', JSON.stringify(ventasRestantes));
      
        alert('✅ Día cerrado correctamente. Podés iniciar nuevas ventas.');
        location.reload();
      }
      
    
      function confirmarCierre() {
        const clave = prompt("🔐 Ingrese la clave de administrador para cerrar el día:");
    
        if (clave === "admin123") {
          cerrarDia();
        } else if (clave === null) {
          alert("⛔ Cancelado.");
        } else {
          alert("❌ Clave incorrecta. No se cerró el día.");
        }
      }