// Configuración de Firebase
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs, Timestamp, getDoc, doc } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";
import { app } from "../scripts/app.js";

const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('alta-cliente-form');
    const accessDeniedMessage = document.getElementById('access-denied');
    const ejecutivoSelect = document.getElementById('ejecutivo');
    const correoUsuario = document.getElementById('correo-usuario');
    const usuarioNombre = document.getElementById('usuario-nombre');
    const fechaHora = document.getElementById('fecha-hora');

    // Verificar autenticación y acceso
    onAuthStateChanged(auth, async (user) => {
        if (user && (user.email === "adotor@fleetup.com" || user.email === "halmaguer@fleetup.com")) {
            form.style.display = 'block';

            // Llenar los campos de usuario y fecha/hora automáticamente
            correoUsuario.value = user.email;
            usuarioNombre.value = user.displayName;
            fechaHora.value = new Date().toLocaleString();

            // Llenar la lista de ejecutivos con los usuarios que son SAC
            try {
                const q = query(collection(db, "users"), where("area", "==", "sac"));
                const querySnapshot = await getDocs(q);
                querySnapshot.forEach((doc) => {
                    const option = document.createElement('option');
                    option.value = doc.data().nombre;
                    option.textContent = doc.data().nombre;
                    ejecutivoSelect.appendChild(option);
                });
            } catch (error) {
                console.error("Error al cargar ejecutivos:", error);
            }

            // Obtener el área del usuario y configurar el navbar
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    configureNavbar(userData.area);
                } else {
                    console.error("No se encontró el documento del usuario.");
                }
            } catch (error) {
                console.error("Error al obtener el área del usuario:", error);
            }

        } else {
            accessDeniedMessage.style.display = 'block';
        }
    });

    // Manejar el envío del formulario
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const cliente = document.getElementById('cliente').value;
        const correo = document.getElementById('correo').value;
        const cxc = document.getElementById('cxc').value;
        const contactoCxc = document.getElementById('contacto-cxc').value;
        const telContactoCxc = document.getElementById('tel-contacto-cxc').value;
        const morosidad = document.getElementById('morosidad').value;
        const ejecutivo = document.getElementById('ejecutivo').value;
        const status = document.getElementById('status').value;

        try {
            await addDoc(collection(db, "clientes"), {
                cliente: cliente,
                correo: correo,
                cxc: cxc,
                contactoCxc: contactoCxc,
                telContactoCxc: telContactoCxc,
                morosidad: morosidad,
                ejecutivo: ejecutivo,
                status: status,
                correoUsuario: correoUsuario.value,
                usuarioNombre: usuarioNombre.value,
                fechaHora: Timestamp.now()
            });
            alert("Cliente dado de alta exitosamente.");
            form.reset();
            fechaHora.value = new Date().toLocaleString(); // Actualiza la fecha y hora después de dar de alta
        } catch (error) {
            console.error("Error al dar de alta al cliente:", error);
            alert("Hubo un error al dar de alta al cliente.");
        }
    });
});

function configureNavbar(area) {
    const consultarIDsNav = document.getElementById("consultar-ids-nav");
    const registerTecnicosNav = document.getElementById("register-tecnicos");
    const sacMicuentaNav = document.getElementById("sac-micuenta-nav");
    const almacenActividadesNav = document.getElementById("almacen-actividades-nav");
    
    // Oculta todos los elementos al inicio
    if (consultarIDsNav) consultarIDsNav.style.display = "none";
    if (registerTecnicosNav) registerTecnicosNav.style.display = "none";
    if (sacMicuentaNav) sacMicuentaNav.style.display = "none";
    if (almacenActividadesNav) almacenActividadesNav.style.display = "none";

    // Configura la visibilidad de acuerdo al área
    if (area === "almacen") {
        if (consultarIDsNav) consultarIDsNav.style.display = "block";
        if (almacenActividadesNav) almacenActividadesNav.style.display = "block";
    }
    if (area === "sac") {
        if (sacMicuentaNav) sacMicuentaNav.style.display = "block";
    }
    if (area === "it") {
        // IT tiene acceso a todas las opciones
        if (consultarIDsNav) consultarIDsNav.style.display = "block";
        if (almacenActividadesNav) almacenActividadesNav.style.display = "block";
        if (registerTecnicosNav) registerTecnicosNav.style.display = "block";
        if (sacMicuentaNav) sacMicuentaNav.style.display = "block";
    }
}
