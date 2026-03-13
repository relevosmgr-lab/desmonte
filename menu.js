import { auth } from './config.js';
import { signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { mostrarInicioJornada } from './jornada.js'; 
import { cargarHistorico } from './historico.js';

const pantallaLogin = document.getElementById('loginScreen');
const pantallaMenuPrincipal = document.getElementById('pantallaMenuPrincipal');
const btnMenuCargar = document.getElementById('btnMenuCargar');
const btnMenuHistorico = document.getElementById('btnMenuHistorico');
const btnCerrarSesion = document.getElementById('btnCerrarSesion');

export function rutearUsuario() {
    const usuarioApp = JSON.parse(sessionStorage.getItem('usuarioApp'));
    pantallaLogin.classList.remove('active');
    pantallaLogin.classList.add('hidden');

    if (usuarioApp.rol === "veedor") {
        btnMenuCargar.classList.add('hidden');
        btnMenuHistorico.classList.remove('hidden');
        pantallaMenuPrincipal.classList.remove('hidden');
    } else if (usuarioApp.rol === "autorizado" || usuarioApp.rol === "supervisor" || usuarioApp.rol === "superadmin") {
        // Ahora el inspector también ve el menú para poder ir a "Ver Histórico" de sus propios cortes
        btnMenuCargar.classList.remove('hidden');
        btnMenuHistorico.classList.remove('hidden');
        pantallaMenuPrincipal.classList.remove('hidden');
    } else {
        alert("Rol no reconocido o en espera de aprobación.");
    }
}

btnMenuCargar.addEventListener('click', () => {
    pantallaMenuPrincipal.classList.add('hidden');
    const usuarioApp = JSON.parse(sessionStorage.getItem('usuarioApp'));
    mostrarInicioJornada(usuarioApp);
});

btnMenuHistorico.addEventListener('click', () => {
    pantallaMenuPrincipal.classList.add('hidden');
    cargarHistorico();
});

btnCerrarSesion.addEventListener('click', async () => {
    try {
        await signOut(auth);
        sessionStorage.clear();
        localStorage.clear();
        window.location.reload(); 
    } catch (error) { console.error("Error al cerrar sesión:", error); }
});