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

// Botones de Exportación
const btnExportarCSV = document.getElementById('btnExportarCSV');
const btnExportarMapa = document.getElementById('btnExportarMapa');

let usuarioApp = JSON.parse(sessionStorage.getItem('usuarioApp'));
let idRegistroEnEdicion = null;
let idJornadaEnVista = null;

// Variables para retener los datos y exportarlos
let recortesActualesParaExportar = [];
let infoJornadaActual = {};

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
            
            // Le pasamos el nombre del inspector a la función del detalle
            html += `
                <div class="tarjeta-jornada" onclick="verDetalleJornada('${data.id_jornada}', '${data.proveedor}', '${fecha}', '${data.nombre_inspector}')">
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

window.verDetalleJornada = async function(idJornada, proveedor, fecha, nombreInspector) {
    idJornadaEnVista = idJornada;
    infoJornadaActual = { idJornada, proveedor, fecha, nombreInspector };
    recortesActualesParaExportar = []; // Limpiamos la memoria anterior
    
    pantallaHistorico.classList.add('hidden');
    pantallaDetalleJornada.classList.remove('hidden');
    document.getElementById('tituloDetalleJornada').innerText = `${proveedor} - ${fecha}`;
    contenidoDetalleJornada.innerHTML = "<p>Cargando recortes...</p>";
    
    // Ocultamos botones de exportar hasta asegurar que hay datos
    btnExportarCSV.classList.add('hidden');
    btnExportarMapa.classList.add('hidden');

    try {
        const q = query(collection(db, "registros_extraccion"), where("id_jornada", "==", idJornada));
        const querySnapshot = await getDocs(q);

        const resumen = {};

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            recortesActualesParaExportar.push(data); // Guardamos para exportar
            
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

        // Si hay datos, mostramos los botones de descarga
        btnExportarCSV.classList.remove('hidden');
        btnExportarMapa.classList.remove('hidden');

        let html = "";
        for (const [tipo, datos] of Object.entries(resumen)) {
            const sufijo = datos.unidad === "metro" ? "m" : "u";
            
            html += `
                <div class="grupo-par">
                    <div class="grupo-par-header" onclick="toggleGrupo('${tipo}')">
                        <span>${tipo}</span>
                        <span>${datos.total} ${sufijo} ▼</span>
                    </div>
                    <div class="grupo-par-body" id="grupo-${tipo}">
            `;

            datos.recortes.forEach(recorte => {
                let btnEditar = "";
                if (usuarioApp.rol === "supervisor" || usuarioApp.rol === "superadmin") {
                    btnEditar = `<button class="btn-editar-chico" onclick="abrirModalEdicion('${recorte.id_registro}', '${recorte.tipo_elemento}', ${recorte.cantidad})">Editar</button>`;
                }

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

            html += `</div></div>`;
        }
        contenidoDetalleJornada.innerHTML = html;

    } catch (error) {
        console.error("Error al cargar detalle:", error);
        contenidoDetalleJornada.innerHTML = "<p>Error al cargar recortes.</p>";
    }
}

// LÓGICA DE EXPORTACIÓN CSV
btnExportarCSV.addEventListener('click', () => {
    if (recortesActualesParaExportar.length === 0) return alert("No hay datos para exportar.");

    let csvContent = "Fecha Trabajo,Hora Carga,Inspector,Proveedor,Tipo Par,Cantidad,Unidad,Latitud,Longitud\n";

    // Ordenamos cronológicamente
    recortesActualesParaExportar.sort((a, b) => a.timestamp_carga - b.timestamp_carga);

    recortesActualesParaExportar.forEach(r => {
        const horaCarga = r.timestamp_carga ? r.timestamp_carga.toDate().toLocaleTimeString('es-AR') : "--:--";
        const lat = r.coordenadas ? r.coordenadas.latitud : "";
        const lng = r.coordenadas ? r.coordenadas.longitud : "";
        
        csvContent += `${infoJornadaActual.fecha},${horaCarga},${infoJornadaActual.nombreInspector},${infoJornadaActual.proveedor},${r.tipo_elemento},${r.cantidad},${r.unidad_medida},${lat},${lng}\n`;
    });

    // Usamos BOM para que Excel detecte los tildes y ñ correctamente
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Desmonte_${infoJornadaActual.proveedor}_${infoJornadaActual.fecha.replace(/\//g, '-')}.csv`;
    link.click();
});

// LÓGICA DE EXPORTACIÓN MAPA HTML (LEAFLET)
btnExportarMapa.addEventListener('click', () => {
    const conCoordenadas = recortesActualesParaExportar.filter(r => r.coordenadas && r.coordenadas.latitud);
    if (conCoordenadas.length === 0) return alert("No hay coordenadas registradas en esta jornada.");

    // Ordenamos para que la línea roja tenga sentido geográfico en el tiempo
    conCoordenadas.sort((a, b) => a.timestamp_carga - b.timestamp_carga);

    const centerLat = conCoordenadas[0].coordenadas.latitud;
    const centerLng = conCoordenadas[0].coordenadas.longitud;

    let markersJs = "";
    let latlngs = [];

    conCoordenadas.forEach(r => {
        const lat = r.coordenadas.latitud;
        const lng = r.coordenadas.longitud;
        latlngs.push(`[${lat}, ${lng}]`);
        
        const hora = r.timestamp_carga.toDate().toLocaleTimeString('es-AR');
        const popupText = `<b>${r.tipo_elemento}</b><br>${r.cantidad} ${r.unidad_medida}<br>Hora: ${hora}`;
        markersJs += `L.marker([${lat}, ${lng}]).addTo(map).bindPopup('${popupText}');\n`;
    });

    const polylineJs = `var latlngs = [${latlngs.join(',')}];
    var polyline = L.polyline(latlngs, {color: 'red', weight: 3}).addTo(map);
    map.fitBounds(polyline.getBounds(), {padding: [50, 50]});`;

    // Plantilla HTML del Mapa
    const htmlMap = `<!DOCTYPE html>
<html>
<head>
    <title>Mapa de Desmonte - ${infoJornadaActual.proveedor}</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body { margin: 0; padding: 0; font-family: sans-serif; }
        #map { height: 100vh; width: 100vw; }
        .info-panel { position: absolute; top: 10px; right: 10px; z-index: 1000; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.3); }
    </style>
</head>
<body>
    <div class="info-panel">
        <h3 style="margin-top:0;">Ruta de Desmonte</h3>
        <p><b>Proveedor:</b> ${infoJornadaActual.proveedor}</p>
        <p><b>Inspector:</b> ${infoJornadaActual.nombreInspector}</p>
        <p><b>Fecha:</b> ${infoJornadaActual.fecha}</p>
    </div>
    <div id="map"></div>
    <script>
        var map = L.map('map').setView([${centerLat}, ${centerLng}], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
        ${markersJs}
        ${polylineJs}
    </script>
</body>
</html>`;

    const blob = new Blob([htmlMap], { type: "text/html;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Mapa_${infoJornadaActual.proveedor}_${infoJornadaActual.fecha.replace(/\//g, '-')}.html`;
    link.click();
});

// Utilidades del acordeón y edición
window.toggleGrupo = function(tipo) { document.getElementById(`grupo-${tipo}`).classList.toggle('active'); }
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
        verDetalleJornada(infoJornadaActual.idJornada, infoJornadaActual.proveedor, infoJornadaActual.fecha, infoJornadaActual.nombreInspector);
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