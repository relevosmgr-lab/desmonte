import { db, collection, query, where, getDocs } from './config.js';

const btnVerConsolidado = document.getElementById('btnVerConsolidado');
const btnVolverCarga = document.getElementById('btnVolverCarga');
const pantallaCarga = document.getElementById('pantallaCarga');
const pantallaConsolidado = document.getElementById('pantallaConsolidado');
const listaConsolidado = document.getElementById('listaConsolidado');

// Mostrar pantalla de consolidado y cargar datos
btnVerConsolidado.addEventListener('click', async () => {
    pantallaCarga.classList.add('hidden');
    pantallaConsolidado.classList.remove('hidden');
    
    listaConsolidado.innerHTML = "<p>Cargando registros...</p>";

    const idJornadaActiva = localStorage.getItem('jornadaActiva');
    if (!idJornadaActiva) {
        listaConsolidado.innerHTML = "<p>No hay una jornada activa.</p>";
        return;
    }

    try {
        // Consultamos Firestore: Traer solo los registros de esta jornada
        const q = query(
            collection(db, "registros_extraccion"), 
            where("id_jornada", "==", idJornadaActiva)
        );
        
        const querySnapshot = await getDocs(q);
        
        // Objeto temporal para agrupar y sumar por tipo de elemento
        const resumen = {};
        let totalMetros = 0;
        let totalUnidades = 0;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const tipo = data.tipo_elemento;
            
            if (!resumen[tipo]) {
                resumen[tipo] = {
                    cantidadTotal: 0,
                    unidad: data.unidad_medida,
                    recortes: [] // Acá guardamos el detalle de cada extracción
                };
            }
            
            resumen[tipo].cantidadTotal += data.cantidad;
            resumen[tipo].recortes.push(data.cantidad); // Guardamos para el desglose

            if (data.unidad_medida === "metro") totalMetros += data.cantidad;
            if (data.unidad_medida === "unidad") totalUnidades += data.cantidad;
        });

        renderizarConsolidado(resumen, totalMetros, totalUnidades);

    } catch (error) {
        console.error("Error al cargar consolidado:", error);
        listaConsolidado.innerHTML = "<p>Error al cargar los datos.</p>";
    }
});

function renderizarConsolidado(resumen, totalMetros, totalUnidades) {
    if (Object.keys(resumen).length === 0) {
        listaConsolidado.innerHTML = "<p>Aún no hay registros en esta jornada.</p>";
        return;
    }

    // Cabecera con totales generales
    let html = `
        <div style="background: #e9ecef; padding: 10px; border-radius: 8px; margin-bottom: 15px;">
            <strong>Total Metros: ${totalMetros} m</strong><br>
            <strong>Total Unidades: ${totalUnidades} unid.</strong>
        </div>
    `;

    // Subtotales por par
    for (const [tipo, datos] of Object.entries(resumen)) {
        const sufijo = datos.unidad === "metro" ? "m" : "u";
        // Convertimos el array de recortes en un texto (Ej: "50 + 20 + 30")
        const detalleRecortes = datos.recortes.join(" + "); 

        html += `
            <div style="border-bottom: 1px solid #ccc; padding: 10px 0; text-align: left;">
                <div style="display: flex; justify-content: space-between; font-weight: bold;">
                    <span>${tipo}:</span>
                    <span>${datos.cantidadTotal} ${sufijo}</span>
                </div>
                <div style="font-size: 12px; color: #666; margin-top: 4px;">
                    Detalle: [ ${detalleRecortes} ]
                </div>
            </div>
        `;
    }

    listaConsolidado.innerHTML = html;
}

// Botón para volver a la botonera principal
btnVolverCarga.addEventListener('click', () => {
    pantallaConsolidado.classList.add('hidden');
    pantallaCarga.classList.remove('hidden');
});