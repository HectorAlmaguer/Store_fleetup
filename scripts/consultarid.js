import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";
import { app } from "./app.js"; // Asegúrate de que `app.js` exporte `app`

// Inicializa Firebase con los módulos importados
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
  const tablaBody = document.getElementById('tabla-ids-body');
  const filtroCuentaCliente = document.getElementById('filtro-cuenta-cliente');
  const filtroIdDispositivo = document.getElementById('filtro-id-dispositivo');
  const filtroTecnico = document.getElementById('filtro-tecnico');
  const btnFiltrar = document.getElementById('btn-filtrar');
  const btnDescargarPDF = document.getElementById('btn-descargar-pdf');
  const btnDescargarExcel = document.getElementById('btn-descargar-excel');

  const mostrarRegistros = (registros) => {
    tablaBody.innerHTML = '';
    registros.forEach((registro) => {
      const fila = document.createElement('tr');
      const celdaCuentaCliente = document.createElement('td');
      const celdaIdDispositivo = document.createElement('td');
      const celdaSim = document.createElement('td');
      const celdaTecnico = document.createElement('td');
      const celdaEvidencia = document.createElement('td');

      celdaCuentaCliente.textContent = registro.cliente;
      celdaIdDispositivo.textContent = registro.deviceId;
      celdaSim.textContent = registro.simNumber;
      celdaTecnico.textContent = registro.assignedTo;

      // Mostrar miniatura de la evidencia si existe
      if (registro.evidence) {
        const img = document.createElement('img');
        img.src = registro.evidence;
        img.alt = "Evidencia";
        img.className = "evidencia-miniatura";
        img.style.width = "50px";
        img.style.height = "50px";
        celdaEvidencia.appendChild(img);
      } else {
        celdaEvidencia.textContent = "Sin evidencia";
      }

      fila.appendChild(celdaCuentaCliente);
      fila.appendChild(celdaIdDispositivo);
      fila.appendChild(celdaSim);
      fila.appendChild(celdaTecnico);
      fila.appendChild(celdaEvidencia);
      tablaBody.appendChild(fila);
    });
  };

  const cargarTodosLosRegistros = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "dispositivos_almacen"));
      const registros = querySnapshot.docs.map(doc => doc.data());

      mostrarRegistros(registros);
    } catch (error) {
      console.error("Error al cargar todos los registros:", error);
      Swal.fire("Error", "Hubo un problema al cargar todos los registros.", "error");
    }
  };

  const filtrarRegistros = async () => {
    const cuentaCliente = filtroCuentaCliente.value.toLowerCase();
    const idDispositivo = filtroIdDispositivo.value.toLowerCase();
    const tecnico = filtroTecnico.value.toLowerCase();

    let q = collection(db, "dispositivos_almacen");

    if (cuentaCliente) {
      q = query(q, where("cliente", "==", cuentaCliente));
    }

    if (idDispositivo) {
      q = query(q, where("deviceId", "==", idDispositivo));
    }

    if (tecnico) {
      q = query(q, where("assignedTo", "==", tecnico));
    }

    try {
      const querySnapshot = await getDocs(q);
      const registros = querySnapshot.docs.map(doc => doc.data());

      mostrarRegistros(registros);
    } catch (error) {
      console.error("Error al filtrar los registros:", error);
      Swal.fire("Error", "Hubo un problema al filtrar los registros.", "error");
    }
  };

  const descargarPDF = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Listado de Dispositivos", 20, 10);

    let y = 20;
    const rows = [];
    tablaBody.querySelectorAll('tr').forEach(row => {
      const cells = row.querySelectorAll('td');
      rows.push([cells[0].textContent, cells[1].textContent, cells[2].textContent, cells[3].textContent, cells[4].textContent]);
    });

    doc.autoTable({
      startY: y,
      head: [['Cuenta Cliente', 'ID del Dispositivo', 'SIM', 'Técnico', 'Evidencia']],
      body: rows,
      theme: 'grid',
      styles: { cellPadding: 2, fontSize: 10 },
      headStyles: { fillColor: [22, 160, 133] },
      margin: { top: 10 }
    });

    doc.save("listado_dispositivos.pdf");
  };

  const descargarExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws_data = [["Cuenta Cliente", "ID del Dispositivo", "SIM", "Técnico", "Evidencia"]];

    tablaBody.querySelectorAll('tr').forEach(row => {
      const cells = row.querySelectorAll('td');
      ws_data.push([cells[0].textContent, cells[1].textContent, cells[2].textContent, cells[3].textContent, cells[4].textContent]);
    });

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, "Dispositivos");

    XLSX.writeFile(wb, "listado_dispositivos.xlsx");
  };

  btnFiltrar.addEventListener('click', filtrarRegistros);
  btnDescargarPDF.addEventListener('click', descargarPDF);
  btnDescargarExcel.addEventListener('click', descargarExcel);

  // Manejo del estado de autenticación
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Muestra los datos del usuario en el formulario
      document.getElementById("user-name").value = user.displayName;

      try {
        // Obtén datos del usuario desde Firestore
        const uid = user.uid;
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          const area = userData.area || "";

          configureNavbar(area);

          if (window.location.pathname === "/index.html") {
            window.location.href = "../pages/opciones.html";
          }

          // Cargar todos los registros al inicio
          await cargarTodosLosRegistros();
        } else {
          Swal.fire("Error", "Usuario no encontrado en Firestore. Cerrando sesión.", "error");
          await auth.signOut();
          window.location.href = "../index.html";
        }
      } catch (error) {
        console.error("Error al obtener los datos del usuario:", error);
      }
    } else {
      // Si no está autenticado, redirige al login
      Swal.fire("No autenticado", "Redirigiendo al login.", "info");
      if (window.location.pathname !== "/index.html") {
        window.location.href = "../index.html";
      }
    }
  });

  // Función para configurar la navbar según el área del usuario
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
});

