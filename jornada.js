import { db, doc, setDoc, collection, query, where, getDocs } from './config.js';

const selectProveedor = document.getElementById('selectProveedor');
const inputCentral = document.getElementById('inputCentral');
const inputArmario = document.getElementById('inputArmario');
const btnIniciarJornada = document.getElementById('btnIniciarJornada');
const pantallaInicio = document.getElementById('pantallaInicioJornada');
const pantallaCarga = document.getElementById('pantallaCarga'); 

export async function mostrarInicioJornada(usuarioLogueado) {
    sessionStorage.setItem('usuarioApp', JSON.stringify(usuarioLogueado));
    
    // Validamos en la base de datos si ya tiene una iniciada antes de mostrar el formulario
    let idJornada = localStorage.getItem('jornadaActiva');
    if (!idJornada) {
        const q = query(collection(db, "jornadas_diarias"), 
            where("id_inspector", "==", usuarioLogueado.uid),
            where("estado", "==", "abierta")
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
            idJornada = snap.docs[0].id;
            localStorage.setItem('jornadaActiva', idJornada);
        }
    }

    if (idJornada) {
        // Si tiene, lo manda directo a la carga
        document.getElementById('pantallaMenuPrincipal').classList.add('hidden');
        pantallaCarga.classList.remove('hidden');
    } else {
        // Si no tiene, le pide proveedor
        document.getElementById('pantallaMenuPrincipal').classList.add('hidden');
        pantallaInicio.classList.remove('hidden');
        pantallaInicio.classList.add('active');
    }
}

btnIniciarJornada.addEventListener('click', async () => {
    const proveedor = selectProveedor.value;
    const central = inputCentral.value.trim(); 
    const armario = inputArmario.value.trim(); 

    if (proveedor === "") { alert("Selecciona un proveedor."); return; }

    const usuario = JSON.parse(sessionStorage.getItem('usuarioApp'));
    const idJornada = `JORNADA_${Date.now()}`;

    const nuevaJornada = {
        id_jornada: idJornada,
        id_inspector: usuario.uid,
        nombre_inspector: usuario.nombre,
        fecha_inicio: new Date(), 
        proveedor: proveedor, central: central, armario: armario, estado: "abierta"
    };

    try {
        btnIniciarJornada.disabled = true;
        btnIniciarJornada.innerText = "Iniciando...";
        await setDoc(doc(db, "jornadas_diarias", idJornada), nuevaJornada);
        localStorage.setItem('jornadaActiva', idJornada);

        pantallaInicio.classList.remove('active');
        pantallaInicio.classList.add('hidden');
        pantallaCarga.classList.remove('hidden');
        pantallaCarga.classList.add('active');
        
        btnIniciarJornada.disabled = false;
        btnIniciarJornada.innerText = "Comenzar Jornada";
    } catch (error) {
        alert("Error al conectar.");
        btnIniciarJornada.disabled = false;
    }
});