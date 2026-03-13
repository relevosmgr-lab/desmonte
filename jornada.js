import { db, doc, setDoc } from './config.js';

// Elementos del DOM (asumiendo que los agregaremos al HTML)
const formInicioJornada = document.getElementById('formInicioJornada');
const selectProveedor = document.getElementById('selectProveedor');
const inputCentral = document.getElementById('inputCentral');
const inputArmario = document.getElementById('inputArmario');
const btnIniciarJornada = document.getElementById('btnIniciarJornada');

// Contenedores de pantallas
const pantallaInicio = document.getElementById('pantallaInicioJornada');
const pantallaCarga = document.getElementById('pantallaCarga'); // La botonera que haremos luego

// Función que se llama desde auth.js cuando el usuario está autorizado
export function mostrarInicioJornada(usuarioLogueado) {
    // Guardamos los datos del usuario en memoria para usarlos en toda la app
    sessionStorage.setItem('usuarioApp', JSON.stringify(usuarioLogueado));
    
    // Mostramos la pantalla para elegir proveedor
    pantallaInicio.classList.remove('hidden');
    pantallaInicio.classList.add('active');
}

btnIniciarJornada.addEventListener('click', async () => {
    const proveedor = selectProveedor.value;
    const central = inputCentral.value.trim(); // Opcional
    const armario = inputArmario.value.trim(); // Opcional

    if (proveedor === "") {
        alert("Por favor, selecciona un proveedor para continuar.");
        return;
    }

    // Recuperamos el usuario que guardamos al loguear
    const usuario = JSON.parse(sessionStorage.getItem('usuarioApp'));
    
    // Generamos un ID único para la jornada (ej: Jornada_1684329... )
    const idJornada = `JORNADA_${Date.now()}`;

    // Armamos el objeto con los datos de la jornada
    const nuevaJornada = {
        id_jornada: idJornada,
        id_inspector: usuario.uid,
        nombre_inspector: usuario.nombre,
        fecha_inicio: new Date(), // Timestamp exacto de inicio
        proveedor: proveedor,
        central: central,
        armario: armario,
        estado: "abierta"
    };

    try {
        btnIniciarJornada.disabled = true;
        btnIniciarJornada.innerText = "Iniciando...";

        // Guardamos en la colección 'jornadas_diarias' en Firestore
        await setDoc(doc(db, "jornadas_diarias", idJornada), nuevaJornada);

        // Guardamos el ID de la jornada en el dispositivo por si cierra el navegador sin querer
        localStorage.setItem('jornadaActiva', idJornada);

        console.log("Jornada creada con éxito:", idJornada);

        // Ocultamos el inicio y pasamos a la botonera de carga (Paso 4)
        pantallaInicio.classList.remove('active');
        pantallaInicio.classList.add('hidden');
        
        pantallaCarga.classList.remove('hidden');
        pantallaCarga.classList.add('active');

    } catch (error) {
        console.error("Error al iniciar la jornada:", error);
        alert("Hubo un error al conectar. Verifica tu señal.");
        btnIniciarJornada.disabled = false;
        btnIniciarJornada.innerText = "Comenzar Jornada";
    }
});