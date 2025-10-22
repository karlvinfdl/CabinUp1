// ============================================================
// 🏡 PAGE DÉTAIL — Affichage d’un logement et carte Leaflet
// ============================================================

// --- Récupération de l'ID dans l'URL ---
const id = new URLSearchParams(window.location.search).get("id");

if (!id) {
  document.body.innerHTML = "<h2 style='text-align:center;color:red;'>❌ Aucun logement sélectionné</h2>";
  throw new Error("ID manquant dans l’URL !");
}

// --- URL du serveur JSON ---
const BASE_URL = "http://localhost:3001";

// --- Chargement du logement depuis le JSON Server ---
fetch(`${BASE_URL}/logements/${id}`)
  .then(res => {
    if (!res.ok) throw new Error(`Erreur ${res.status} : logement non trouvé`);
    return res.json();
  })
  .then(l => {
    if (!l || !l.id) throw new Error("Aucun logement correspondant trouvé.");

    // === Image principale ===
    const mainImg = $("#product-image");
    const fixedMainImg = l.image?.replace(/^(\.\.\/)+/, "../") || "../assets/images/placeholder.jpg";
    mainImg.src = fixedMainImg;
    mainImg.alt = l.titre;

    // === Galerie ===
    const thumbs = document.querySelector(".thumbs__detail");
    const lightboxSlides = document.querySelector("#lightbox-slides");
    thumbs.innerHTML = "";
    lightboxSlides.innerHTML = "";

    const allImages = [fixedMainImg, ...(l.galerie || []).map(img => img.replace(/^(\.\.\/)+/, "../"))];
    allImages.forEach((img, idx) => {
      if (idx > 0) {
        const div = document.createElement("div");
        div.className = "thumb__detail";
        div.innerHTML = `<img src="${img}" alt="${l.titre}">`;
        div.addEventListener("click", () => (mainImg.src = img));
        thumbs.appendChild(div);
      }
      const imageEl = document.createElement("img");
      imageEl.src = img;
      imageEl.alt = l.titre;
      lightboxSlides.appendChild(imageEl);
    });

    // === Infos principales ===
    $("#product-title").textContent = l.titre;
    $("#product-desc p").textContent = l.description;
    $("#product-price").innerHTML = `${l.prix} € <span class="muted__detail">/ nuit</span>`;
    $(".meta__detail").innerHTML = `<span>${l.ville}</span> • <span>${l.capacite} pers.</span>`;

    // === Équipements ===
    const amenContainer = $(".amen-grid__detail");
    amenContainer.innerHTML = (l.equipements || [])
      .map(eq => `<div class="amen__detail"><i class="fa-solid fa-check"></i><span>${eq}</span></div>`)
      .join("");

    // === Carte Leaflet ===
    initMapDetail(l.lat, l.lng, 12, `${l.titre} — ${l.ville}`);

    // === Ajouter au panier ===
    $("#add-to-cart").addEventListener("click", e => {
      e.preventDefault();
      let cart = JSON.parse(localStorage.getItem("cart")) || [];

      if (cart.find(item => item.id === l.id)) {
        alert("⚠️ Ce logement est déjà dans votre panier !");
        return;
      }

      cart.push({
        id: l.id,
        titre: l.titre,
        ville: l.ville,
        prix: l.prix,
        description: l.description,
        capacite: l.capacite,
        image: fixedMainImg,
        galerie: l.galerie,
        lat: l.lat,
        lng: l.lng,
        nights: 1,
        guests: 1
      });

      localStorage.setItem("cart", JSON.stringify(cart));
      alert("✅ Logement ajouté au panier !");
    });
  })
  .catch(err => {
    console.error("Erreur lors du chargement du logement :", err);
    document.body.innerHTML = `<h2 style="color:red;text-align:center;">⚠️ ${err.message}</h2>`;
  });

// --- Initialisation de la carte Leaflet ---
function initMapDetail(lat, lng, zoom = 13, popupText = "Logement") {
  if (typeof L === "undefined") return;

  const map = L.map("map-detail").setView([lat, lng], zoom);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap',
  }).addTo(map);

  L.marker([lat, lng]).addTo(map).bindPopup(popupText).openPopup();
}



// ============================================================
// 🗺️ Fonction de carte Leaflet (empêche double initialisation)
// ============================================================
function initMapDetail(lat = 45.75, lng = 4.85, zoom = 12, title = "Emplacement du logement") {
  const mapEl = document.getElementById("map");
  if (!mapEl || typeof L === "undefined") {
    console.warn("⚠️ Leaflet non chargé ou #map introuvable");
    return;
  }

  // 🔒 Évite la double création de carte
  if (mapEl._leaflet_id) {
    console.log("✅ Carte déjà initialisée, on ne la recrée pas.");
    return;
  }

  const map = L.map(mapEl).setView([lat, lng], zoom);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  L.marker([lat, lng]).addTo(map).bindPopup(`<b>${title}</b>`).openPopup();
}

// 🌍 Rendre la fonction disponible globalement
window.initMapDetail = initMapDetail;



// ======================================================
// 👇 Bouton "Voir plus" pour afficher les équipements cachés
// ======================================================
const toggleBtn = document.getElementById("toggleAmenities");
if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    const more = document.getElementById("moreAmenities");
    more.classList.toggle("hidden__detail");

    // changer le texte du bouton selon l'état
    toggleBtn.textContent = more.classList.contains("hidden__detail")
      ? "Voir plus"
      : "Voir moins";
  });
}
