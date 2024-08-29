import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";
import { app } from "./app.js"; // Asegúrate de que `app.js` exporte `app`

const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      // Redirigir al login si no está autenticado
      window.location.href = "../index.html";
    } else {
      // Usuario autenticado, obtén los datos de Firestore
      try {
        const uid = user.uid;
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          const area = userData.area || "";

          // Configurar la visibilidad de la navbar según el área del usuario
          configureNavbarOptions(area);

          // Muestra los datos del usuario en los inputs correspondientes
          displayUserDetails(user.displayName, user.email);

        } else {
          console.log("Usuario no encontrado en Firestore. Cerrando sesión.");
          await auth.signOut();
          window.location.href = "../index.html";
        }
      } catch (error) {
        console.error("Error al obtener los datos del usuario:", error);
      }
    }
  });
});

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
// Función para configurar las opciones de la navbar según el área del usuario
function configureNavbarOptions(area) {
  const consultarIDsNav = document.getElementById("consultar-ids-nav");
  const registerTecnicosNav = document.getElementById("register-tecnicos");
  const sacMicuentaNav = document.getElementById("sac-micuenta-nav");
  const almacenActividadesNav = document.getElementById(
    "almacen-actividades-nav"
  );

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

// Lógica adicional para manejar los checkboxes y ciudades
const estadosYciudades = {
  Aguascalientes: ["Aguascalientes"],
  "Baja California": ["Mexicali", "Tijuana", "Ensenada", "Tecate", "Rosarito"],
  "Baja California Sur": ["La Paz", "Los Cabos", "Loreto", "Comondú", "Mulegé"],
  Campeche: ["Campeche", "Ciudad del Carmen", "Champotón", "Escárcega"],
  Chiapas: [
    "Tuxtla Gutiérrez",
    "San Cristóbal de las Casas",
    "Tapachula",
    "Comitán",
  ],
  Chihuahua: ["Chihuahua", "Ciudad Juárez", "Delicias", "Cuauhtémoc", "Parral"],
  Coahuila: ["Saltillo", "Torreón", "Monclova", "Piedras Negras", "Acuña"],
  Colima: ["Colima", "Manzanillo", "Tecomán"],
  Durango: ["Durango", "Gómez Palacio", "Lerdo"],
  Guanajuato: [
    "Guanajuato",
    "León",
    "Irapuato",
    "Celaya",
    "Salamanca",
    "Silao",
  ],
  Guerrero: ["Chilpancingo", "Acapulco", "Zihuatanejo", "Iguala"],
  Hidalgo: ["Pachuca", "Tulancingo", "Tula", "Tepeji"],
  Jalisco: [
    "Guadalajara",
    "Zapopan",
    "Tlaquepaque",
    "Tonalá",
    "Puerto Vallarta",
    "Tepatitlán",
  ],
  Mexico: ["Toluca", "Naucalpan", "Tlalnepantla", "Nezahualcóyotl", "Ecatepec"],
  "Mexico City": ["Mexico City"],
  Michoacán: ["Morelia", "Uruapan", "Zamora", "Lázaro Cárdenas"],
  Morelos: ["Cuernavaca", "Cuautla", "Jiutepec"],
  Nayarit: ["Tepic", "Bahía de Banderas"],
  "Nuevo León": [
    "Monterrey",
    "Guadalupe",
    "San Nicolás",
    "San Pedro Garza García",
    "Santa Catarina",
  ],
  Oaxaca: ["Oaxaca", "Salina Cruz", "Juchitán"],
  Puebla: ["Puebla", "Tehuacán", "San Martín Texmelucan"],
  Querétaro: ["Querétaro", "San Juan del Río"],
  "Quintana Roo": ["Chetumal", "Cancún", "Playa del Carmen", "Cozumel"],
  "San Luis Potosí": ["San Luis Potosí", "Ciudad Valles", "Matehuala"],
  Sinaloa: ["Culiacán", "Mazatlán", "Los Mochis"],
  Sonora: ["Hermosillo", "Ciudad Obregón", "Nogales"],
  Tabasco: ["Villahermosa", "Cárdenas"],
  Tamaulipas: [
    "Ciudad Victoria",
    "Tampico",
    "Matamoros",
    "Nuevo Laredo",
    "Reynosa",
  ],
  Tlaxcala: ["Tlaxcala"],
  Veracruz: ["Xalapa", "Veracruz", "Coatzacoalcos", "Córdoba", "Orizaba"],
  Yucatán: ["Mérida", "Valladolid", "Progreso"],
  Zacatecas: ["Zacatecas", "Fresnillo", "Guadalupe"],
};

$(document).ready(function () {
  const displayedCities = {};

  $(".state-checkbox").change(function () {
    const selectedStates = $(".state-checkbox:checked")
      .map(function () {
        return $(this).val();
      })
      .get();

    // Vaciar el contenedor de ciudades solo si no hay estados seleccionados
    if (selectedStates.length === 0) {
      $("#ciudades-container").empty();
      return;
    }

    selectedStates.forEach((state) => {
      const cities = estadosYciudades[state];
      if (cities) {
        cities.forEach((city) => {
          const cityId = `city-${city.replace(/\s+/g, "-")}`;

          if (!displayedCities[cityId]) {
            const cityCheckbox = $("<input>").attr({
              type: "checkbox",
              class: "city-checkbox",
              value: city,
              id: cityId, // Usar un ID único
            });

            const cityLabel = $("<label>")
              .attr("for", cityId)
              .html(`${cityCheckbox[0].outerHTML} ${city}`);
            $("#ciudades-container").append(cityLabel);

            // Registrar ciudad como mostrada
            displayedCities[cityId] = city;
          }
        });
      }
    });

    // Eliminar ciudades que ya no están asociadas con los estados seleccionados
    $("#ciudades-container label").each(function () {
      const cityId = $(this).find("input.city-checkbox").attr("id");
      if (
        !selectedStates.some((state) =>
          estadosYciudades[state].includes(displayedCities[cityId])
        )
      ) {
        $(this).remove();
        delete displayedCities[cityId];
      }
    });
  });
});
