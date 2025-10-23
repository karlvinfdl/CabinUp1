// ============================================================
// 🗺️ CATALOGUE — Carte + Pagination + Filtrage (JSON Server)
// ============================================================

const PAGE_SIZE = 6; // Taille de la page (nombre d'éléments par page)
let allCards = []; // Liste de toutes les cartes
let filteredCards = []; // Liste filtrée des cartes
let currentPage = 1; // Page courante
let map; // Carte Leaflet
let markerLayer; // Calque des marqueurs

// --- Initialisation de la carte du catalogue ---
function initMapCatalogue() {
  const mapEl = $('#map');
  if (!mapEl || typeof L === 'undefined') return;

  if (map) {
    console.warn("Carte du catalogue déjà initialisée");
    return;
  }

  map = L.map('map', { zoomControl: true }).setView([46.5, 2], 6);
  L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | <a href="https://carto.com/">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 20,
  }).addTo(map);

  markerLayer = L.layerGroup().addTo(map);
  setTimeout(() => map.invalidateSize(), 300);
}

// --- Mise à jour des marqueurs sur la carte ---
function updateMapFromVisibleCards() {
  if (!map || !markerLayer) return;
  markerLayer.clearLayers();

  const visible = filteredCards.filter(c => c.style.display !== 'none');
  const bounds = [];

  visible.forEach(card => {
    const lat = parseFloat(card.dataset.lat);
    const lng = parseFloat(card.dataset.lng);
    if (isNaN(lat) || isNaN(lng)) return;

    const prix = card.dataset.prix || '';
    const ville = card.dataset.ville || '';
    const img = card.querySelector('img')?.src || '';

    const marker = L.marker([lat, lng], {
      icon: L.divIcon({
        className: "price-marker",
        html: `${prix}€`,
        iconSize: null,
        iconAnchor: [30, 20],
      }),
    }).addTo(markerLayer);

    marker.bindPopup(`
      <div style="text-align:center;width:230px">
        ${img ? `<img src="${img}" alt="${ville}" style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:6px">` : ''}
        <strong style="font-size:16px">${ville}</strong><br>
        <span style="font-weight:bold;color:#2f6f3f;font-size:16px">${prix} € / nuit</span>
      </div>
    `);

    bounds.push([lat, lng]);
  });

  if (bounds.length > 0) {
    map.fitBounds(bounds, { padding: [50, 50] });
  } else {
    map.setView([46.5, 2], 6);
  }
}

// --- Pagination ---
function buildPagination(totalItems) {
  const container = $('#pagination');
  if (!container) return;
  container.innerHTML = '';

  const pageCount = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  for (let i = 1; i <= pageCount; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    if (i === currentPage) btn.classList.add('active');
    btn.addEventListener('click', () => {
      currentPage = i;
      renderCurrentPage();
    });
    container.appendChild(btn);
  }
}

// --- Affiche la page actuelle ---
function renderCurrentPage() {
  const start = (currentPage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;

  filteredCards.forEach((card, idx) => {
    card.style.display = idx >= start && idx < end ? '' : 'none';
  });

  buildPagination(filteredCards.length);
  updateMapFromVisibleCards();
}

// --- Filtrage par ville / titre ---
function applyFilter() {
  const q = ($('#dest-desktop')?.value || '').trim().toLowerCase();

  filteredCards = !q
    ? [...allCards]
    : allCards.filter(card => {
        const ville = (card.dataset.ville || '').toLowerCase();
        const titre = (card.querySelector('h3')?.textContent || '').toLowerCase();
        return ville.includes(q) || titre.includes(q);
      });

  currentPage = 1;
  renderCurrentPage();
}

// --- Chargement du catalogue ---
document.addEventListener('DOMContentLoaded', () => {
  const container = $('#cardsContainer');
  if (!container) return;

  fetch("http://localhost:3001/logements")
    .then(res => {
      if (!res.ok) throw new Error("Erreur serveur");
      return res.json();
    })
    .then(data => {
      container.innerHTML = data.map(l => `
        <a href="../pages/detail.html?id=${l.id}" class="card"
           data-lat="${l.lat}" data-lng="${l.lng}"
           data-ville="${l.ville}" data-prix="${l.prix}">
          <img src="${l.image || '../assets/images/placeholder.jpg'}" alt="${l.titre}">
          <div class="card-body">
            <div class="card-content">
              <h3>${l.titre}</h3>
              <p>${l.ville} • ${l.capacite || 1} personne${(l.capacite||1) > 1 ? 's' : ''}</p>
              <span class="available">
                ${typeof l.disponibilite === 'number'
                  ? `${l.disponibilite} logement(s) dispo`
                  : (l.disponibilite || '')}
              </span>
            </div>
            <p class="price">${l.prix} €/nuit</p>
          </div>
        </a>
      `).join('');

      allCards = $$('.card', container);
      filteredCards = [...allCards];

      $('#search-btn')?.addEventListener('click', applyFilter);
      $('#dest-desktop')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          applyFilter();
        }
      });

      initMapCatalogue();
      renderCurrentPage();
    })
    .catch(err => {
      console.error("❌ Erreur lors du chargement du JSON :", err);
      container.innerHTML = "<p style='color:red;'>Impossible de charger les logements 😢</p>";
    });
});


// ============================================================
// 🏡 PAGE DÉTAIL LOGEMENT — JSON SERVER + PANIER + GALERIE + CARTE
// ============================================================

// Sélecteurs rapides
const $ = (s, scope = document) => scope.querySelector(s);

// --- Récupération de l'ID dans l'URL
const id = new URLSearchParams(window.location.search).get("id");

if (id) {
  // --- URL du serveur JSON
  const BASE = "http://localhost:3001"; // ⚠️ utiliser localhost, pas 127.0.0.1

  // --- Chargement du logement depuis le JSON Server
  fetch(`${BASE}/logements/${id}`)
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
} else {
  console.error("❌ ID manquant dans l'URL.");
}

// --- Fonction pour initialiser la carte dans la page de détail ---
function initMapDetail(lat = 45.75, lng = 4.85, zoom = 12, title = "Emplacement du logement") {
  const mapEl = document.getElementById("map");
  if (!mapEl || typeof L === "undefined") {
    console.warn("⚠️ Leaflet non chargé ou #map introuvable");
    return;
  }

  // Empêche la double création de la carte
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

// Rendre la fonction accessible globalement
window.initMapDetail = initMapDetail;


// ============================================================
// 👇 Bouton "Voir plus" pour afficher les équipements cachés
// ============================================================

const toggleBtn = document.getElementById("toggleAmenities");
if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    const more = document.getElementById("moreAmenities"); // Section à afficher ou masquer
    
    // Toggle la classe 'hidden__detail' pour afficher/masquer les équipements
    more.classList.toggle("hidden__detail");

    // Changer le texte du bouton selon l'état
    toggleBtn.textContent = more.classList.contains("hidden__detail")
      ? "Voir plus"  // Si les équipements sont cachés
      : "Voir moins";  // Si les équipements sont visibles
  });
}
