import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getFirestore, doc, getDoc, addDoc, collection } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";
import { app } from "./app.js"; // Asegúrate de que `app.js` exporte `app`

const auth = getAuth(app);
const db = getFirestore(app);
let devices = []; // Array para almacenar los dispositivos añadidos temporalmente

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
  // Manejar el envío del formulario de dispositivos
  document.getElementById('device-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const deviceId = document.getElementById('device-id').value;
    const simNumber = document.getElementById('sim-number').value;

    const deviceData = {
      deviceId: deviceId,
      simNumber: simNumber,
    };

    // Añadir el dispositivo al array de dispositivos
    devices.push(deviceData);

    // Añadir el dispositivo a la tabla en la página
    const tableBody = document.getElementById('device-table-body');
    const row = document.createElement('tr');

    const cellDeviceId = document.createElement('td');
    cellDeviceId.textContent = deviceId;

    const cellSimNumber = document.createElement('td');
    cellSimNumber.textContent = simNumber;

    const cellActions = document.createElement('td');
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Eliminar';
    deleteButton.className = 'btn btn-danger btn-sm';
    deleteButton.addEventListener('click', function() {
      tableBody.removeChild(row);
      // Eliminar el dispositivo del array de dispositivos
      devices = devices.filter(device => device.deviceId !== deviceId);
    });

    cellActions.appendChild(deleteButton);

    row.appendChild(cellDeviceId);
    row.appendChild(cellSimNumber);
    row.appendChild(cellActions);

    tableBody.appendChild(row);

    // Limpiar los campos del formulario después de añadir el dispositivo
    document.getElementById('device-form').reset();
  });

  // Manejar el envío de todos los dispositivos añadidos
  document.getElementById('send_form').addEventListener('click', async function() {
    const roleSelect = document.getElementById("role").value;
    const addedBy = auth.currentUser.uid;
    const timestamp = new Date();
    const status = "Entregados";
    const clientName = document.getElementById("client_name").value;
    const guiaDhl = document.getElementById("guia-dhl").value;
    const evidenceFile = document.getElementById("image-upload").files[0];  // Extrae el archivo de imagen
    const tecnicoName = document.getElementById("tecnico").value;

    let evidenceBase64 = null;

    try {
      // Convertir la imagen a base64 si existe
      if (evidenceFile) {
        evidenceBase64 = await convertImageToBase64(evidenceFile);
      }

      // Enviar cada dispositivo a Firestore bajo el técnico o cliente seleccionado
      for (const device of devices) {
        const deviceData = {
          ...device,
          entregado: addedBy,
          fecha: timestamp,
          status: status,
          assignedTo: roleSelect,
          tecnico: tecnicoName,
          cliente: clientName,
          guia: guiaDhl,
          evidence: evidenceBase64  // Guarda la imagen en base64
        };

        // Referencia a la colección 'dispositivos_almacen'
        await addDoc(collection(db, 'dispositivos_almacen'), deviceData);
      }

      console.log("Todos los dispositivos han sido añadidos a Firestore.");

      // Limpiar la tabla y el array de dispositivos
      document.getElementById('device-table-body').innerHTML = '';
      devices = [];

      alert("Dispositivos añadidos correctamente.");
    } catch (error) {
      console.error("Error al añadir los dispositivos: ", error);
      alert("Hubo un error al guardar los dispositivos. Por favor, inténtalo de nuevo.");
    }
  });

  // Función para convertir una imagen a base64
  function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  // Manejador de cambios en el campo "role"
  const roleSelect = document.getElementById("role");
  const tecnicoField = document.getElementById("tecnico-field");
  const guiaDhlField = document.getElementById("guia-dhl-field");
  const clientNameField = document.getElementById("cliente-field");

  roleSelect.addEventListener("change", function() {
    const selectedRole = this.value;

    // Oculta ambos campos al inicio
    tecnicoField.style.display = "none";
    guiaDhlField.style.display = "none";
    clientNameField.style.display = "none";

    // Muestra el campo correspondiente según la selección
    if (selectedRole === "tecnico") {
      tecnicoField.style.display = "block";
    } else if (selectedRole === "cliente") {
      guiaDhlField.style.display = "block";
      clientNameField.style.display = "block";
    }
  });
}
