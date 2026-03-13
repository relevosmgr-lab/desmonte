import { db, doc, updateDoc } from './config.js'; // Ya no importamos storage

const btnCerrarDiaModal = document.getElementById('btnCerrarDiaModal');
const modalCierre = document.getElementById('modalCierre');
const btnCancelarCierre = document.getElementById('btnCancelarCierre');
const btnConfirmarCierre = document.getElementById('btnConfirmarCierre');
const inputPinCierre = document.getElementById('inputPinCierre');

const PIN_SECRETO = "4956";

// Mostrar Modal
btnCerrarDiaModal.addEventListener('click', () => {
    inputPinCierre.value = ""; 
    modalCierre.classList.remove('hidden');
});

// Cancelar Cierre
btnCancelarCierre.addEventListener('click', () => {
    modalCierre.classList.add('hidden');
});

// Confirmar y Procesar Cierre
btnConfirmarCierre.addEventListener('click', async () => {
    const pinIngresado = inputPinCierre.value.trim();

    if (pinIngresado !== PIN_SECRETO) {
        alert("PIN incorrecto. Intente nuevamente.");
        return;
    }

    const idJornadaActiva = localStorage.getItem('jornadaActiva');
    if (!idJornadaActiva) {
        alert("No se encontró una jornada activa para cerrar.");
        return;
    }

    btnConfirmarCierre.disabled = true;
    btnConfirmarCierre.innerText = "Cerrando jornada...";

    try {
        // Solo actualizamos el documento de la jornada en Firestore
        const jornadaRef = doc(db, "jornadas_diarias", idJornadaActiva);
        await updateDoc(jornadaRef, {
            estado: "cerrada",
            fecha_cierre: new Date()
        });

        console.log("Jornada cerrada exitosamente.");
        localStorage.removeItem('jornadaActiva'); 
        
        alert("Jornada finalizada y guardada con éxito.");
        window.location.reload(); 

    } catch (error) {
        console.error("Error al cerrar la jornada:", error);
        alert("Hubo un error al procesar el cierre. Revise su conexión.");
        btnConfirmarCierre.disabled = false;
        btnConfirmarCierre.innerText = "Confirmar y Cerrar";
    }
});