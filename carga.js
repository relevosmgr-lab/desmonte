import { db, doc, setDoc } from './config.js';

// Elementos de la UI
const botonesPar = document.querySelectorAll('.btn-par');
const modalCantidad = document.getElementById('modalCantidad');
const tituloModalCantidad = document.getElementById('tituloModalCantidad');
const labelCantidad = document.getElementById('labelCantidad');
const inputCantidad = document.getElementById('inputCantidad');
const btnGuardarRegistro = document.getElementById('btnGuardarRegistro');
const btnCancelarCarga = document.getElementById('btnCancelarCarga');
const btnVolverMenuDesdeCarga = document.getElementById('btnVolverMenuDesdeCarga');

// Variables temporales
let elementoSeleccionado = "";
let unidadMedida = "";

// 1. Escuchar los clics en la botonera de pares
botonesPar.forEach(boton => {
    boton.addEventListener('click', () => {
        elementoSeleccionado = boton.innerText;
        unidadMedida = boton.getAttribute('data-tipo'); 

        tituloModalCantidad.innerText = `Desmonte de ${elementoSeleccionado}`;
        labelCantidad.innerText = unidadMedida === "metro" ? "Indique cantidad de Metros:" : "Indique Cantidad (Unidades):";
        
        inputCantidad.value = ""; 
        modalCantidad.classList.remove('hidden'); 
        inputCantidad.focus();
    });
});

// Botón cancelar del modal
btnCancelarCarga.addEventListener('click', () => {
    modalCantidad.classList.add('hidden');
});

// Botón para volver al menú principal (sin cerrar la jornada)
btnVolverMenuDesdeCarga.addEventListener('click', () => {
    document.getElementById('pantallaCarga').classList.add('hidden');
    document.getElementById('pantallaMenuPrincipal').classList.remove('hidden');
});

// 2. Lógica del botón "+" (Guardar y capturar GPS)
btnGuardarRegistro.addEventListener('click', async () => {
    const cantidadStr = inputCantidad.value;
    const cantidad = parseFloat(cantidadStr);

    if (isNaN(cantidad) || cantidad <= 0) {
        alert("Por favor, ingrese un valor válido.");
        return;
    }

    // Bloqueamos el botón para evitar doble clic
    btnGuardarRegistro.disabled = true;
    btnGuardarRegistro.innerText = "Ubicando GPS...";

    try {
        const coordenadas = await obtenerUbicacion();
        
        const idJornada = localStorage.getItem('jornadaActiva');
        const usuarioApp = JSON.parse(sessionStorage.getItem('usuarioApp'));
        const idRegistro = `REC_${Date.now()}`;

        const nuevoRegistro = {
            id_registro: idRegistro,
            id_jornada: idJornada,
            id_inspector: usuarioApp.uid,
            timestamp_carga: new Date(),
            tipo_elemento: elementoSeleccionado,
            unidad_medida: unidadMedida,
            cantidad: cantidad,
            coordenadas: {
                latitud: coordenadas.coords.latitude,
                longitud: coordenadas.coords.longitude,
                precision: coordenadas.coords.accuracy
            }
        };

        await setDoc(doc(db, "registros_extraccion", idRegistro), nuevoRegistro);
        
        // Restaurar UI al guardar exitosamente
        modalCantidad.classList.add('hidden');
        btnGuardarRegistro.disabled = false;
        btnGuardarRegistro.innerText = "+";

    } catch (error) {
        console.error("Error al guardar:", error);
        alert("Error al guardar. Asegúrese de tener activado el GPS del navegador.");
        btnGuardarRegistro.disabled = false;
        btnGuardarRegistro.innerText = "+";
    }
});

// Función para forzar la precisión del GPS
function obtenerUbicacion() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject("El navegador no soporta geolocalización.");
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true, 
            timeout: 10000,           
            maximumAge: 0             
        });
    });
}