import { db, collection, query, where, getDocs, doc, updateDoc, orderBy } from './config.js';

const pantallaHistorico = document.getElementById('pantallaHistorico');
const pantallaDetalleJornada = document.getElementById('pantallaDetalleJornada');
const listaJornadas = document.getElementById('listaJornadas');
const contenidoDetalleJornada = document.getElementById('contenidoDetalleJornada');
const btnVolverHistorico = document.getElementById('btnVolverHistorico');

// Modal de edición
const modalEditarRegistro = document.getElementById('modalEditarRegistro');
const inputEditarCantidad = document.getElementById('inputEditarCantidad');
const btnGuardarEdicion = document.getElementById('btnGuardarEdicion');
const btnCancelarEdicion = document.getElementById('btnCancelarEdicion');

let usuarioApp = JSON.parse(sessionStorage.getItem('usuarioApp'));
let idRegistroEnEdicion = null;
let idJornadaEnVista = null;

// 1. CARGAR LA LISTA DE JORNADAS
export async function cargarHistorico() {
    pantallaHistorico.classList.remove('hidden');
    listaJornadas.innerHTML = "<p>Buscando historial...</p>";

    try {
        let q;
        const jornadasRef = collection(db, "jornadas_diarias");

        // Lógica de permisos
        if (usuarioApp.rol === "veedor") {
            // El veedor solo ve lo de su proveedor
            q = query(jornadasRef, where("proveedor", "==", usuarioApp.proveedor));
        } else {
            // Supervisor o Superadmin ven TODO
            q = query(jornadasRef); 
        }

        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            listaJornadas.innerHTML = "<p>No hay jornadas registradas.</p>";
            return;
        }

        let html = "";
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const fecha = data.fecha_inicio.toDate().toLocaleDateString('es-AR');
            const estadoClase = data.estado === "abierta" ? "estado-abierta" : "estado-cerrada";
            
            html += `
                <div class="tarjeta-jornada" onclick="verDetalleJornada('${data.id_jornada}', '${data.proveedor}', '${fecha}')">
                    <div style="display: flex; justify-content: space-between;">
                        <strong>${data.proveedor}</strong>
                        <span class="badge-estado ${estadoClase}">${data.estado.toUpperCase()}</span>
                    </div>
                    <div style="font-size: 14px; color: #666; margin-top: 5px;">
                        Fecha: ${fecha} | Inspector: ${data.nombre_inspector}
                    </div>
                </div>
            `;
        });

        listaJornadas.innerHTML = html;

    } catch (error) {
        console.error("Error al cargar jornadas:", error);
        listaJornadas.innerHTML = "<p>Error al cargar los datos.</p>";
    }
}

// 2. VER EL DETALLE Y LOS RECORTES DE UN DÍA
window.verDetalleJornada = async function(idJornada, proveedor, fecha) {
    idJornadaEnVista = idJornada;
    pantallaHistorico.classList.add('hidden');
    pantallaDetalleJornada.classList.remove('hidden');
    document.getElementById('tituloDetalleJornada').innerText = `${proveedor} - ${fecha}`;
    contenidoDetalleJornada.innerHTML = "<p>Cargando recortes...</p>";

    try {
        const q = query(collection(db, "registros_extraccion"), where("id_jornada", "==", idJornada));
        const querySnapshot = await getDocs(q);

        let html = "";
        
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const sufijo = data.unidad_medida === "metro" ? "m" : "u";
            
            // Validamos si mostramos el botón de editar
            let btnEditar = "";
            if (usuarioApp.rol === "supervisor" || usuarioApp.rol === "superadmin") {
                btnEditar = `<button class="btn-editar-chico" onclick="abrirModalEdicion('${data.id_registro}', '${data.tipo_elemento}', ${data.cantidad})">Editar</button>`;
            }

            html += `
                <div class="item-recorte">
                    <div>
                        <strong>${data.tipo_elemento}</strong><br>
                        <span style="font-size: 18px;">${data.cantidad} ${sufijo}</span>
                    </div>
                    ${btnEditar}
                </div>
            `;
        });

        if(html === "") html = "<p>No hay recortes en esta jornada.</p>";
        contenidoDetalleJornada.innerHTML = html;

    } catch (error) {
        console.error("Error al cargar detalle:", error);
        contenidoDetalleJornada.innerHTML = "<p>Error al cargar recortes.</p>";
    }
}

// 3. LÓGICA DE EDICIÓN (SOLO ADMIN)
window.abrirModalEdicion = function(idRegistro, tipoElemento, cantidadActual) {
    idRegistroEnEdicion = idRegistro;
    document.getElementById('labelEditarInfo').innerText = `Modificando: ${tipoElemento}`;
    inputEditarCantidad.value = cantidadActual;
    modalEditarRegistro.classList.remove('hidden');
}

btnCancelarEdicion.addEventListener('click', () => {
    modalEditarRegistro.classList.add('hidden');
});

btnGuardarEdicion.addEventListener('click', async () => {
    const nuevaCantidad = parseFloat(inputEditarCantidad.value);
    
    if (isNaN(nuevaCantidad) || nuevaCantidad <= 0) {
        alert("Ingrese un valor válido.");
        return;
    }

    try {
        btnGuardarEdicion.disabled = true;
        btnGuardarEdicion.innerText = "Guardando...";

        const registroRef = doc(db, "registros_extraccion", idRegistroEnEdicion);
        await updateDoc(registroRef, { cantidad: nuevaCantidad });

        modalEditarRegistro.classList.add('hidden');
        btnGuardarEdicion.disabled = false;
        btnGuardarEdicion.innerText = "Guardar Cambios";
        
        // Recargamos el detalle para ver el impacto
        verDetalleJornada(idJornadaEnVista, document.getElementById('tituloDetalleJornada').innerText.split(' - ')[0], "");

    } catch (error) {
        console.error("Error al actualizar:", error);
        alert("Error al guardar cambios.");
        btnGuardarEdicion.disabled = false;
    }
});

btnVolverHistorico.addEventListener('click', () => {
    pantallaDetalleJornada.classList.add('hidden');
    pantallaHistorico.classList.remove('hidden');
});