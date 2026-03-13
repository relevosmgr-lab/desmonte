import { auth } from './config.js';
import { signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { mostrarInicioJornada } from './jornada.js'; 
import { cargarHistorico } from './historico.js';

const pantallaLogin = document.getElementById('loginScreen');
const pantallaMenuPrincipal = document.getElementById('pantallaMenuPrincipal');
const btnMenuCargar = document.getElementById('btnMenuCargar');
const btnMenuHistorico = document.getElementById('btnMenuHistorico');
const btnCerrarSesion = document.getElementById('btnCerrarSesion');

// Esta función se llama desde auth.js cuando el logueo es exitoso
export function rutearUsuario() {
    const usuarioApp = JSON.parse(sessionStorage.getItem('usuarioApp'));
    
    // Ocultamos el login
    pantallaLogin.classList.remove('active');
    pantallaLogin.classList.add('hidden');

    if (usuarioApp.rol === "autorizado") {
        // El inspector va directo a trabajar
        mostrarInicioJornada(usuarioApp);
        
    } else if (usuarioApp.rol === "veedor") {
        // El proveedor va directo a auditar
        cargarHistorico();
        
    } else if (usuarioApp.rol === "supervisor" || usuarioApp.rol === "superadmin") {
        // Los jefes eligen qué hacer
        pantallaMenuPrincipal.classList.remove('hidden');
    } else {
        alert("Rol no reconocido o en espera de aprobación.");
    }
}

// Botones del menú (Solo visibles para Admins)
btnMenuCargar.addEventListener('click', () => {
    pantallaMenuPrincipal.classList.add('hidden');
    const usuarioApp = JSON.parse(sessionStorage.getItem('usuarioApp'));
    mostrarInicioJornada(usuarioApp);
});

btnMenuHistorico.addEventListener('click', () => {
    pantallaMenuPrincipal.classList.add('hidden');
    cargarHistorico();
});

// Botón global de Cerrar Sesión
btnCerrarSesion.addEventListener('click', async () => {
    try {
        await signOut(auth);
        sessionStorage.removeItem('usuarioApp');
        localStorage.removeItem('jornadaActiva');
        window.location.reload(); // Recarga limpia de la app
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
    }
});