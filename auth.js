import { auth, db, provider, signInWithPopup, doc, getDoc, setDoc, collection, query, where, getDocs } from './config.js';
import { rutearUsuario } from './menu.js'; 
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js"; 

const btnLogin = document.getElementById('btnLogin');
const textoLogin = document.getElementById('textoLogin');
const loginScreen = document.getElementById('loginScreen');
const modalNombre = document.getElementById('modalNombre'); 
const btnGuardarNombre = document.getElementById('btnGuardarNombre');
const inputNombre = document.getElementById('inputNombre');

let usuarioTemporal = null; 

// 1. Escuchar sesión activa
onAuthStateChanged(auth, async (user) => {
    if (user) {
        textoLogin.innerText = "Cargando tu perfil...";
        btnLogin.classList.add('hidden');

        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const userData = docSnap.data();
            sessionStorage.setItem('usuarioApp', JSON.stringify({uid: user.uid, ...userData}));
            
            // BUSCAR JORNADA ABIERTA EN LA BASE DE DATOS DIRECTAMENTE
            let idJornada = localStorage.getItem('jornadaActiva');
            if (!idJornada && userData.rol !== 'veedor' && userData.rol !== 'nuevo') {
                const q = query(collection(db, "jornadas_diarias"), 
                    where("id_inspector", "==", user.uid),
                    where("estado", "==", "abierta")
                );
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    idJornada = querySnapshot.docs[0].id;
                    localStorage.setItem('jornadaActiva', idJornada);
                }
            }

            if (idJornada && userData.rol !== 'veedor' && userData.rol !== 'nuevo') {
                loginScreen.classList.remove('active');
                loginScreen.classList.add('hidden');
                document.getElementById('pantallaCarga').classList.remove('hidden');
            } else {
                evaluarRol(userData.rol);
            }
        } else {
            usuarioTemporal = user;
            modalNombre.classList.remove('hidden'); 
        }
    } else {
        // No hay sesión en el celular
        textoLogin.innerText = "Inicie sesión para comenzar la jornada";
        btnLogin.classList.remove('hidden');
        loginScreen.classList.remove('hidden');
        loginScreen.classList.add('active');
    }
});

// 2. Iniciar sesión manual con botón
btnLogin.addEventListener('click', async () => {
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Error en autenticación:", error);
    }
});

// 3. Guardar el nombre del nuevo usuario
btnGuardarNombre.addEventListener('click', async () => {
    const nombreRegistrado = inputNombre.value.trim();
    if (nombreRegistrado === "") { alert("Por favor, ingresa tu nombre y apellido."); return; }

    try {
        const nuevoUsuario = { email: usuarioTemporal.email, nombre: nombreRegistrado, rol: "nuevo", proveedor: "", estado: "activo" };
        await setDoc(doc(db, "usuarios", usuarioTemporal.uid), nuevoUsuario);
        modalNombre.classList.add('hidden'); 
        sessionStorage.setItem('usuarioApp', JSON.stringify({uid: usuarioTemporal.uid, ...nuevoUsuario}));
        evaluarRol("nuevo");
    } catch (error) { console.error("Error:", error); }
});

function evaluarRol(rol) {
    if (rol === "nuevo") {
        loginScreen.classList.add('hidden');
        document.getElementById('modalEspera').classList.remove('hidden');
    } else {
        rutearUsuario();
    }
}