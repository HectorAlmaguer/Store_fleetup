import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";
import { app } from "./app.js"; // Asegúrate de que `app.js` exporte `app`

const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "../index.html";
    } else {
      await initializePage(user); 
    }
  });
});

// Función para inicializar el contenido de la página
async function initializePage(user) {
  try {
    const uid = user.uid;
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      const area = userData.area || "";

      // Configura las opciones de la navbar según el área del usuario
      configureNavbarOptions(area);

      // Muestra los datos del usuario en los inputs correspondientes
      displayUserDetails(user.displayName, user.email);

      // Resto de la lógica de la página (formularios, etc.)
      setupEventListeners();
    } else {
      console.log("Usuario no encontrado en Firestore. Cerrando sesión.");
      await auth.signOut();
      window.location.href = "../index.html";
    }
  } catch (error) {
    console.error("Error al obtener los datos del usuario:", error);
  }
}

// Función para mostrar los detalles del usuario en los inputs
function displayUserDetails(displayName, email) {
  const userNameInput = document.getElementById("user-name");
  const userEmailInput = document.getElementById("user-email");

  if (userNameInput) {
    userNameInput.value = displayName || "Usuario";
  }
  if (userEmailInput) {
    userEmailInput.value = email || "Correo no disponible";
  }
}

function configureNavbarOptions(area) {
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

function setupEventListeners() {
  // Generar el reporte en PDF
  document.getElementById('generarReporte').addEventListener('click', () => {
    const nombre = document.getElementById('user-name').value;
    const correo = document.getElementById('user-email').value;
    const fechaHora = document.getElementById('fechaHora').value;
    const cliente = document.getElementById('cliente').value;
    const actividad = document.getElementById('actividad').value;
    const descripcion = document.getElementById('descripcion').value;
    const estatus = document.getElementById('estatus').value;

    // Asegúrate de que jsPDF esté disponible en window.jspdf
    if (window.jspdf) {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      doc.text(`Registro de Actividades de Almacén`, 10, 10);
      doc.text(`Nombre: ${nombre}`, 10, 20);
      doc.text(`Correo: ${correo}`, 10, 30);
      doc.text(`Fecha y hora: ${fechaHora}`, 10, 40);
      doc.text(`Cliente: ${cliente}`, 10, 50);
      doc.text(`Actividad Realizada: ${actividad}`, 10, 60);
      doc.text(`Descripción: ${descripcion}`, 10, 70);
      doc.text(`Estatus: ${estatus}`, 10, 80);

      doc.save(`Reporte_Almacen_${new Date().toLocaleDateString()}.pdf`);
    } else {
      console.error("jsPDF no está disponible");
    }
  });

  // Otros eventos que necesites configurar...
}
