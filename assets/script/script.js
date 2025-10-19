// ============================
//  UTILITAIRES DOM
// ============================
const $  = (sel, scope = document) => scope.querySelector(sel);
const $$ = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));

// ============================
//  MENU MOBILE
// ============================
const navToggle = document.getElementById("nav-toggle");
const menuClose = document.getElementById("menu-close");
const mobileMenu = document.getElementById("mobile-menu");

navToggle?.addEventListener("click", () => {
  mobileMenu.style.display = "flex";
});
menuClose?.addEventListener("click", () => {
  mobileMenu.style.display = "none";
});

// ============================================================
// POPUP MOBILE "OÙ / QUAND / QUI"
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
// DROPDOWN DES FEATURES (ACCUEIL)
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
//  CATALOGUE + PAGINATION + MAP
// ============================================================
const PAGE_SIZE = 6;
let allCards = [];
let filteredCards = [];
let currentPage = 1;
let map;
let markerLayer;

// ---------- CARTE CATALOGUE ----------
function initMapCatalogue() {
  const mapEl = $('#map');
  if (!mapEl) return;
  if (typeof L === 'undefined') {
    console.error('❌ Leaflet non chargé.');
    return;
  }

  map = L.map('map', { zoomControl: true }).setView([46.5, 2], 6);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 20,
  }).addTo(map);

  markerLayer = L.layerGroup().addTo(map);
  setTimeout(() => map.invalidateSize(), 300);
  console.log("✅ Carte Leaflet catalogue initialisée !");
}

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
    const dispo = card.dataset.dispo || '';
    const img = card.querySelector('img')?.src || '';

    const marker = L.marker([lat, lng], {
      icon: L.divIcon({
        className: "price-marker",
        html: prix,
        iconSize: null,
        iconAnchor: [30, 20],
      }),
    }).addTo(markerLayer);

    marker.bindPopup(`
      <div style="text-align:center;width:230px">
        ${img ? `<img src="${img}" alt="${ville}" style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:6px">` : ''}
        <strong style="font-size:16px">${ville}</strong><br>
        ${dispo ? `<small>${dispo}</small><br>` : ''}
        <span style="font-weight:bold;color:#2f6f3f;font-size:16px">${prix}</span>
      </div>
    `);

    bounds.push([lat, lng]);
  });

  if (bounds.length > 0) map.fitBounds(bounds, { padding: [50, 50] });
  else map.setView([46.5, 2], 6);
}

// ============================
//  PAGINATION
// ============================
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

function renderCurrentPage() {
  const start = (currentPage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;

  filteredCards.forEach((card, idx) => {
    card.style.display = idx >= start && idx < end ? '' : 'none';
  });

  buildPagination(filteredCards.length);
  updateMapFromVisibleCards();
}

// ============================
//  FILTRAGE
// ============================
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

// ============================
//  INITIALISATION GLOBALE
// ============================
document.addEventListener('DOMContentLoaded', () => {
  if (typeof updateCartCount === 'function') updateCartCount();

  const container = $('#cardsContainer');
  allCards = container ? $$('.card', container) : [];
  filteredCards = [...allCards];

  // Uniquement sur la page catalogue (si le conteneur existe)
  if (container) {
    $('#search-btn')?.addEventListener('click', applyFilter);
    $('#dest-desktop')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyFilter();
      }
    });

    initMapCatalogue();
    renderCurrentPage();
  }
});

// ============================
//  PAGE DÉTAIL : Voir plus / moins
// ============================
document.addEventListener('DOMContentLoaded', () => {
  const btn = $('#toggleAmenities');
  const more = $('#moreAmenities');
  if (!btn || !more) return;

  btn.addEventListener('click', () => {
    more.classList.toggle('hidden__detail');
    btn.textContent = more.classList.contains('hidden__detail')
      ? 'Voir plus'
      : 'Voir moins';
  });
});

// ============================
//  CARTE PAGE DÉTAIL
// ============================
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
