// ============================================================
//  🌐 UTILITAIRES GÉNÉRAUX
// ============================================================

// === Sélecteurs globaux (une seule fois pour tout le site) ===
window.$ = (s, scope = document) => scope.querySelector(s);
window.$$ = (s, scope = document) => Array.from(scope.querySelectorAll(s));
// ============================================================
//  🧭 MENU MOBILE
// ============================================================

// Sélection des éléments du menu mobile
const navToggle = $("#nav-toggle");
const menuClose = $("#menu-close");
const mobileMenu = $("#mobile-menu");

// Vérification que les éléments existent avant d'ajouter des événements
document.addEventListener("DOMContentLoaded", () => {
  if (navToggle && menuClose && mobileMenu) {
    // Ouvrir le menu mobile
    navToggle.addEventListener("click", () => mobileMenu.style.display = "flex");
    // Fermer le menu mobile
    menuClose.addEventListener("click", () => mobileMenu.style.display = "none");
  } else {
    console.warn("⚠️ Les éléments du menu burger sont manquants.");
  }
});

// ============================================================
//  🪄 POPUP MOBILE "OÙ / QUAND / QUI"
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  const openBtn = $("#search-btn");
  const popup = $("#mobile-popup");
  const closeBtn = $("#popup-close");
  const clearBtn = $("#popup-clear");

  if (openBtn && popup && closeBtn) {
    openBtn.addEventListener("click", (e) => {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        popup.classList.add("active");
        popup.setAttribute("aria-hidden", "false");
        document.body.classList.add("popup-open");
      }
    });

    closeBtn.addEventListener("click", () => {
      popup.classList.remove("active");
      popup.setAttribute("aria-hidden", "true");
      document.body.classList.remove("popup-open");
    });

    clearBtn?.addEventListener("click", () => {
      popup.querySelectorAll("input").forEach(inp => inp.value = "");
      popup.querySelectorAll(".accueil__num").forEach(num => num.textContent = "0");
    });
  }
});

// ============================================================
//  🧩 ACCUEIL – Bouton "voir plus"
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = $(".features-toggle");
  const hiddenFeatures = $$(".feature__accueil2.feature-hidden");
  if (!toggleBtn) return;

  toggleBtn.addEventListener("click", () => {
    const isOpen = toggleBtn.classList.toggle("open");
    const icon = toggleBtn.querySelector("i");
    icon.classList.toggle("fa-chevron-down", !isOpen);
    icon.classList.toggle("fa-chevron-up", isOpen);
    toggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    hiddenFeatures.forEach((f) => (f.style.display = isOpen ? "flex" : "none"));
  });
});

// ============================================================
// 🗺️ CATALOGUE — Carte + Pagination + Filtrage (JSON Server)
// ============================================================

const PAGE_SIZE = 6;
let allCards = [];
let filteredCards = [];
let currentPage = 1;
let map; // Carte Leaflet
let markerLayer;

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
//  🏡 PAGE DÉTAIL – Carte (exemple statique tant que la page n’est pas connectée au JSON)
// ============================================================
function initMapDetail() {
  const mapEl = $('#map');
  if (!mapEl || typeof L === 'undefined') return;

  const map = L.map(mapEl).setView([45.75, 4.85], 10);
  L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; OpenStreetMap | CARTO',
    subdomains: "abcd",
    maxZoom: 20
  }).addTo(map);

  L.marker([45.75, 4.85])
    .addTo(map)
    .bindPopup('<strong>Cabane perchée en forêt</strong><br>Lyon');
}
window.initMapDetail = initMapDetail;

// ============================================================
//  🛒 PANIER — version finale corrigée (images + sélection + suppression)
// ============================================================
