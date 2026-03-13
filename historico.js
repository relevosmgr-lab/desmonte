import { db, collection, query, where, getDocs, doc, updateDoc } from './config.js';

const pantallaHistorico = document.getElementById('pantallaHistorico');
const pantallaDetalleJornada = document.getElementById('pantallaDetalleJornada');
const listaJornadas = document.getElementById('listaJornadas');
const contenidoDetalleJornada = document.getElementById('contenidoDetalleJornada');
const btnVolverHistorico = document.getElementById('btnVolverHistorico');
const modalEditarRegistro = document.getElementById('modalEditarRegistro');
const inputEditarCantidad = document.getElementById('inputEditarCantidad');
const btnGuardarEdicion = document.getElementById('btnGuardarEdicion');
const btnCancelarEdicion = document.getElementById('btnCancelarEdicion');

let usuarioApp = JSON.parse(sessionStorage.getItem('usuarioApp'));
let idRegistroEnEdicion = null;
let idJornadaEnVista = null;

export async function cargarHistorico() {
    pantallaHistorico.classList.remove('hidden');
    listaJornadas.innerHTML = "<p>Buscando historial...</p>";
    usuarioApp = JSON.parse(sessionStorage.getItem('usuarioApp')); 

    try {
        let q;
        const jornadasRef = collection(db, "jornadas_diarias");

        if (usuarioApp.rol === "veedor") {
            q = query(jornadasRef, where("proveedor", "==", usuarioApp.proveedor));
        } else if (usuarioApp.rol === "autorizado") {
            q = query(jornadasRef, where("id_inspector", "==", usuarioApp.uid));
        } else {
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
        listaJornadas.innerHTML = "<p>Error al cargar los datos.</p>";
    }
}

// NUEVA FUNCIÓN AGRUPADA
window.verDetalleJornada = async function(idJornada, proveedor, fecha) {
    idJornadaEnVista = idJornada;
    pantallaHistorico.classList.add('hidden');
    pantallaDetalleJornada.classList.remove('hidden');
    document.getElementById('tituloDetalleJornada').innerText = `${proveedor} - ${fecha}`;
    contenidoDetalleJornada.innerHTML = "<p>Cargando recortes...</p>";

    try {
        const q = query(collection(db, "registros_extraccion"), where("id_jornada", "==", idJornada));
        const querySnapshot = await getDocs(q);

        // Objeto para agrupar los recortes por tipo de elemento
        const resumen = {};

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const tipo = data.tipo_elemento;
            
            if (!resumen[tipo]) {
                resumen[tipo] = { total: 0, unidad: data.unidad_medida, recortes: [] };
            }
            
            resumen[tipo].total += data.cantidad;
            resumen[tipo].recortes.push(data);
        });

        if (Object.keys(resumen).length === 0) {
            contenidoDetalleJornada.innerHTML = "<p>No hay recortes en esta jornada.</p>";
            return;
        }

        let html = "";

        // Generamos el acordeón
        for (const [tipo, datos] of Object.entries(resumen)) {
            const sufijo = datos.unidad === "metro" ? "m" : "u";
            
            // Encabezado del grupo (Clickable)
            html += `
                <div class="grupo-par">
                    <div class="grupo-par-header" onclick="toggleGrupo('${tipo}')">
                        <span>${tipo}</span>
                        <span>${datos.total} ${sufijo} ▼</span>
                    </div>
                    <div class="grupo-par-body" id="grupo-${tipo}">
            `;

            // Detalle de cada recorte dentro del grupo
            datos.recortes.forEach(recorte => {
                let btnEditar = "";
                if (usuarioApp.rol === "supervisor" || usuarioApp.rol === "superadmin") {
                    btnEditar = `<button class="btn-editar-chico" onclick="abrirModalEdicion('${recorte.id_registro}', '${recorte.tipo_elemento}', ${recorte.cantidad})">Editar</button>`;
                }

                // Sumamos la hora exacta si la necesitamos auditar
                let horaCarga = "";
                if (recorte.timestamp_carga) {
                    horaCarga = recorte.timestamp_carga.toDate().toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'});
                }

                html += `
                    <div class="item-recorte">
                        <div>
                            <span style="font-size: 12px; color: #888;">Hora: ${horaCarga}</span><br>
                            <span style="font-size: 18px; font-weight: bold;">${recorte.cantidad} ${sufijo}</span>
                        </div>
                        ${btnEditar}
                    </div>
                `;
            });

            // Cerramos los divs del grupo
            html += `
                    </div>
                </div>
            `;
        }
        
        contenidoDetalleJornada.innerHTML = html;

    } catch (error) {
        console.error("Error al cargar detalle:", error);
        contenidoDetalleJornada.innerHTML = "<p>Error al cargar recortes.</p>";
    }
}

// Función global para abrir/cerrar los grupos del acordeón
window.toggleGrupo = function(tipo) {
    const body = document.getElementById(`grupo-${tipo}`);
    body.classList.toggle('active');
}

window.abrirModalEdicion = function(idRegistro, tipoElemento, cantidadActual) {
    idRegistroEnEdicion = idRegistro;
    document.getElementById('labelEditarInfo').innerText = `Modificando: ${tipoElemento}`;
    inputEditarCantidad.value = cantidadActual;
    modalEditarRegistro.classList.remove('hidden');
}

btnCancelarEdicion.addEventListener('click', () => modalEditarRegistro.classList.add('hidden'));

btnGuardarEdicion.addEventListener('click', async () => {
    const nuevaCantidad = parseFloat(inputEditarCantidad.value);
    if (isNaN(nuevaCantidad) || nuevaCantidad <= 0) return alert("Ingrese un valor válido.");

    try {
        btnGuardarEdicion.disabled = true;
        btnGuardarEdicion.innerText = "Guardando...";
        await updateDoc(doc(db, "registros_extraccion", idRegistroEnEdicion), { cantidad: nuevaCantidad });
        modalEditarRegistro.classList.add('hidden');
        btnGuardarEdicion.disabled = false;
        btnGuardarEdicion.innerText = "Guardar Cambios";
        // Refrescamos la vista
        verDetalleJornada(idJornadaEnVista, document.getElementById('tituloDetalleJornada').innerText.split(' - ')[0], "");
    } catch (error) {
        alert("Error al guardar cambios.");
        btnGuardarEdicion.disabled = false;
    }
});

btnVolverHistorico.addEventListener('click', () => {
    pantallaDetalleJornada.classList.add('hidden');
    pantallaHistorico.classList.remove('hidden');
});

document.getElementById('btnVolverMenu').addEventListener('click', () => {
    pantallaHistorico.classList.add('hidden');
    document.getElementById('pantallaMenuPrincipal').classList.remove('hidden');
});