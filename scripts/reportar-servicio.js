import {
    getAuth,
    onAuthStateChanged,
    signOut,
  } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
  import {
    getFirestore,
    doc,
    getDoc,
  } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";
  import { app } from "../scripts/app.js"; // Asegúrate de que `app.js` exporte `app`
  
  const auth = getAuth(app);
  const db = getFirestore(app);
  
  document.addEventListener("DOMContentLoaded", () => {
    // Verificar autenticación y configurar la navbar
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = "../index.html"; // Redirige al login si no está autenticado
      } else {
        const userNameDisplay = document.getElementById("user-name");
        const userEmailDisplay = document.getElementById("user-email");
  
        userNameDisplay.value = user.displayName;
        userEmailDisplay.value = user.email;
  
        try {
          const uid = user.uid;
          const docRef = doc(db, "users", uid);
          const docSnap = await getDoc(docRef);
  
          if (docSnap.exists()) {
            const userData = docSnap.data();
            configureUserOptions(userData.area, userData.nombre);
  
            // Cargar las listas desplegables de IDs y clientes/técnicos
            loadOptions();
          } else {
            Swal.fire("Error", "Usuario no encontrado en Firestore. Cerrando sesión.", "error");
            auth.signOut().then(() => {
              window.location.href = "../index.html";
            });
          }
        } catch (error) {
          Swal.fire("Error", "Ocurrió un error al obtener los datos del usuario.", "error");
        }
      }
    });
  
    // Función para configurar las opciones según el área y nombre del usuario
    function configureUserOptions(area, nombre) {
      const btnDelivery = document.getElementById("btn-delivery");
      const btnAlmacenActividades = document.getElementById("btn-almacen-actividades");
      const btnConsultarID = document.getElementById("btn-consultar-id");
      const btnTecnicos = document.getElementById("btn-tecnicos");
      const btnSACMiCuenta = document.getElementById("btn-sac-micuenta");
  
      // Ocultar todos los botones al inicio
      if (btnDelivery) btnDelivery.style.display = "none";
      if (btnAlmacenActividades) btnAlmacenActividades.style.display = "none";
      if (btnConsultarID) btnConsultarID.style.display = "none";
      if (btnTecnicos) btnTecnicos.style.display = "none";
      if (btnSACMiCuenta) btnSACMiCuenta.style.display = "none";
  
      // Mostrar botones según el área y nombre del usuario
      if (area === "almacen") {
        if (btnDelivery) btnDelivery.style.display = "block";
        if (btnAlmacenActividades) btnAlmacenActividades.style.display = "block";
        if (btnConsultarID) btnConsultarID.style.display = "block";
      }
  
      if (area === "sac") {
        if (btnSACMiCuenta) btnSACMiCuenta.style.display = "block";
      }
  
      if (nombre === "Alejandra Dotor" || nombre === "Alexis Gutierrez") {
        if (btnTecnicos) btnTecnicos.style.display = "block";
      }
  
      if (area === "it") {
        // IT tiene acceso a todas las opciones
        if (btnDelivery) btnDelivery.style.display = "block";
        if (btnAlmacenActividades) btnAlmacenActividades.style.display = "block";
        if (btnConsultarID) btnConsultarID.style.display = "block";
        if (btnTecnicos) btnTecnicos.style.display = "block";
        if (btnSACMiCuenta) btnSACMiCuenta.style.display = "block";
      }
    }
  
    // Función para cargar opciones de IDs y clientes/técnicos
    async function loadOptions() {
      try {
        const idList = document.getElementById("id-list");
        const clientList = document.getElementById("client-list");
  
        const idsQuerySnapshot = await getDocs(collection(db, "ids"));
        idsQuerySnapshot.forEach((doc) => {
          const option = document.createElement("option");
          option.value = doc.id;
          option.textContent = doc.data().id;
          idList.appendChild(option);
        });
  
        const clientsQuerySnapshot = await getDocs(collection(db, "clientes"));
        clientsQuerySnapshot.forEach((doc) => {
          const option = document.createElement("option");
          option.value = doc.id;
          option.textContent = doc.data().nombre;
          clientList.appendChild(option);
        });
      } catch (error) {
        Swal.fire("Error", "Ocurrió un error al cargar las opciones.", "error");
      }
    }
  
    // Función para mostrar vistas previas de las imágenes y PDFs
    document.getElementById("device-photo").addEventListener("change", function () {
      previewImage(this, "device-photo-preview");
    });
  
    document.getElementById("installation-photo").addEventListener("change", function () {
      previewImage(this, "installation-photo-preview");
    });
  
    document.getElementById("service-sheet").addEventListener("change", function () {
      previewFile(this, "service-sheet-preview");
    });
  
    function previewImage(input, previewId) {
      const file = input.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          const preview = document.getElementById(previewId);
          preview.src = e.target.result;
          preview.style.display = "block";
        };
        reader.readAsDataURL(file);
      }
    }
  
    function previewFile(input, previewId) {
      const file = input.files[0];
      const previewContainer = document.getElementById(previewId);
      previewContainer.innerHTML = ""; // Limpia cualquier vista previa anterior
  
      if (file) {
        if (file.type.startsWith("image/")) {
          // Mostrar vista previa de la imagen
          const reader = new FileReader();
          reader.onload = function (e) {
            const img = document.createElement("img");
            img.src = e.target.result;
            img.className = "img-thumbnail";
            img.style.maxWidth = "150px";
            previewContainer.appendChild(img);
          };
          reader.readAsDataURL(file);
        } else if (file.type === "application/pdf") {
          // Mostrar vista previa de PDF
          const pdfPreview = document.createElement("p");
          pdfPreview.textContent = "Archivo PDF seleccionado: " + file.name;
          previewContainer.appendChild(pdfPreview);
        }
      }
    }
  
    // Logout
    document.getElementById("logout").addEventListener("click", async () => {
      try {
        await signOut(auth);
        window.location.href = "../index.html"; // Redirige al login después de cerrar sesión
      } catch (error) {
        Swal.fire("Error", "Error al cerrar sesión.", "error");
      }
    });
  });
  