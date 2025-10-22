// ============================================================
//  🌐 UTILITAIRES GÉNÉRAUX
// ============================================================

// Fonction utilitaire pour sélectionner un élément
const $ = (sel, scope = document) => scope.querySelector(sel);
// Fonction utilitaire pour sélectionner plusieurs éléments
const $$ = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));

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
let map;  // Variable globale pour la carte du catalogue
let markerLayer;

// --- Initialisation de la carte Leaflet
function initMapCatalogue() {
  const mapEl = $('#map');

  // Vérification si la carte a déjà été initialisée
  if (map) {
    console.warn("La carte du catalogue a déjà été initialisée.");
    return;  // Éviter de réinitialiser la carte si elle existe déjà
  }

  // Vérification que l'élément de la carte existe
  if (!mapEl || typeof L === 'undefined') return;

  // Initialisation de la carte Leaflet
  map = L.map('map', { zoomControl: true }).setView([46.5, 2], 6);

  // Ajouter la couche de tuiles
  L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | <a href="https://carto.com/">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 20,
  }).addTo(map);

  // Initialiser le groupe de marqueurs
  markerLayer = L.layerGroup().addTo(map);
  setTimeout(() => map.invalidateSize(), 300); // Ajuste la taille de la carte après l'initialisation
}

// --- Met à jour la carte selon les logements visibles (page courante)
function updateMapFromVisibleCards() {
  if (!map || !markerLayer) return;
  markerLayer.clearLayers();  // Vider les marqueurs existants

  const visible = filteredCards.filter(c => c.style.display !== 'none');
  const bounds = [];

  // Ajouter un marqueur pour chaque logement visible
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

  // Ajuster la vue de la carte pour englober uniquement les logements visibles
  if (bounds.length > 0) {
    map.fitBounds(bounds, { padding: [50, 50] });
  } else {
    map.setView([46.5, 2], 6);  // Réinitialiser la vue par défaut si aucun logement visible
  }
}

// --- Pagination
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

// --- Rendu de la page actuelle
function renderCurrentPage() {
  const start = (currentPage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;

  filteredCards.forEach((card, idx) => {
    card.style.display = idx >= start && idx < end ? '' : 'none';
  });

  buildPagination(filteredCards.length);
  updateMapFromVisibleCards();
}

// --- Filtrage par ville ou titre
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

// --- Chargement des logements depuis le JSON Server
document.addEventListener('DOMContentLoaded', () => {
  const container = $('#cardsContainer');
  if (!container) return;

  fetch("http://127.0.0.1:3001/logements")
    .then(res => {
      if (!res.ok) throw new Error("Erreur serveur");
      return res.json();
    })
    .then(data => {
      // Création des cartes logements
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

      // Sauvegarde des cartes dans le DOM
      allCards = $$('.card', container);
      filteredCards = [...allCards];

      // Recherche (ville/titre)
      $('#search-btn')?.addEventListener('click', applyFilter);
      $('#dest-desktop')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          applyFilter();
        }
      });

      // Initialisation carte + affichage 1re page
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
document.addEventListener("DOMContentLoaded", () => {
  const cartList = document.querySelector("#cart-list");
  if (!cartList) return; // Pas la page panier

  // ---------- Éléments du résumé
  const sumTitle = document.querySelector("#sum-title");
  const sumImgBox = document.querySelector(".panier-summary .img");
  const sumTotal = document.querySelector("#sum-total");
  const sumDates = document.querySelector("#sum-dates");
  const sumGuests = document.querySelector("#sum-guests");

  // ---------- Helpers
  const getName = (it) => it?.titre ?? it?.title ?? "Sans titre";
  const getVille = (it) => it?.ville ?? it?.location ?? "—";
  const getPrix = (it) => Number(it?.prix ?? it?.price ?? 0);
  const getCap = (it) => Number(it?.capacite ?? it?.capacity ?? 1);
  const getImg = (it) => {
    if (Array.isArray(it?.images) && it.images.length > 0) return it.images[0];
    if (it?.image) return it.image;
    return "../assets/images/placeholder.jpg";
  };

  const ensureId = (it, idx) => (it.id != null ? String(it.id) :
    (getName(it) + "|" + getPrix(it) + "|" + idx).toLowerCase().replace(/\s+/g, "-"));

  // ---------- Chargement du panier depuis localStorage
  let raw = JSON.parse(localStorage.getItem("cart") || "[]");
  let cart = raw.map((it, idx) => ({
    id: ensureId(it, idx),
    titre: getName(it),
    prix: getPrix(it),
    image: getImg(it),
    ville: getVille(it),
    capacite: getCap(it),
    nights: Number(it?.nights ?? 1),
    arrivee: it?.arrivee ?? "",
    depart: it?.depart ?? "",
    guests: Number(it?.guests ?? 1),
  }));
  localStorage.setItem("cart", JSON.stringify(cart));

  // ---------- Rendu panier vide
  const renderEmpty = () => {
    cartList.innerHTML = `<p style="text-align:center;">Votre panier est vide 🛒</p>`;
    sumTitle.textContent = "Aucun logement sélectionné";
    sumImgBox.innerHTML = '';
    sumTotal.textContent = "0 €";
    sumDates.textContent = "—";
    sumGuests.textContent = "—";
  };

  if (cart.length === 0) return renderEmpty();

  // ---------- Rendu des cartes du panier
  const renderList = () => {
    cartList.innerHTML = cart.map((item, idx) => `
      <article class="panier-card" data-idx="${idx}">
        <div class="img"><img src="${item.image}" alt="${item.titre}"></div>
        <div class="panier-card__body">
          <h3>${item.titre}</h3>
          <div class="features">
            <span><i class="fa-solid fa-location-dot"></i> ${item.ville}</span>
            <span><i class="fa-solid fa-user-group"></i> ${item.capacite} pers.</span>
          </div>
          <div class="panier-card__footer">
            <p><strong>${item.prix} €</strong> / nuit</p>
            <button class="panier-card__remove" data-idx="${idx}" title="Supprimer du panier">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      </article>
    `).join("");
  };

  // ---------- Rendu du résumé
  const updateSummary = (item) => {
    if (!item) return;
    sumTitle.textContent = item.titre;
    sumTotal.textContent = `${item.prix} € / nuit`;
    sumImgBox.innerHTML = item.image ? `<img src="${item.image}" alt="${item.titre}">` : "";
    sumDates.textContent = (item.arrivee && item.depart)
      ? `${item.arrivee} → ${item.depart} (${item.nights} nuit${item.nights > 1 ? "s" : ""})`
      : "Non renseignées";
    sumGuests.textContent = `${item.guests || 1} voyageur${(item.guests || 1) > 1 ? "s" : ""}`;
  };

  // ---------- Sélection visuelle
  const highlight = (idx) => {
    document.querySelectorAll(".panier-card").forEach(c => {
      c.classList.remove("active");
      c.style.outline = "none";
    });
    const card = document.querySelector(`.panier-card[data-idx="${idx}"]`);
    if (card) {
      card.classList.add("active");
      card.style.outline = "3px solid #2E5E4E";
    }
  };

  // Premier affichage
  renderList();
  let selectedIdx = 0;
  updateSummary(cart[selectedIdx]);
  highlight(selectedIdx);

  // ---------- Écoute des clics (sélection & suppression)
  cartList.addEventListener("click", (e) => {
    const removeBtn = e.target.closest(".panier-card__remove");
    const card = e.target.closest(".panier-card");

    // SUPPRESSION
    if (removeBtn) {
      e.stopPropagation();
      const idx = Number(removeBtn.dataset.idx);
      const el = removeBtn.closest(".panier-card");
      el.style.transition = "opacity .25s ease, transform .25s ease";
      el.style.opacity = "0";
      el.style.transform = "translateX(-20px)";
      setTimeout(() => {
        cart.splice(idx, 1);
        localStorage.setItem("cart", JSON.stringify(cart));
        if (cart.length === 0) return renderEmpty();
        renderList();
        if (selectedIdx === idx) selectedIdx = 0;
        else if (selectedIdx > idx) selectedIdx -= 1;
        updateSummary(cart[selectedIdx]);
        highlight(selectedIdx);
      }, 250);
      return;
    }

    // SÉLECTION
    if (card) {
      const idx = Number(card.dataset.idx);
      selectedIdx = idx;
      updateSummary(cart[idx]);
      highlight(idx);
    }
  });

  // ---------- Modales (dates)
  const modalDates = document.querySelector("#modal-edit-dates");
  const editDatesBtn = document.querySelector("#edit-dates-btn");
  const cancelDates = document.querySelector("#cancel-dates");
  const saveDates = document.querySelector("#save-dates");

  editDatesBtn?.addEventListener("click", () => modalDates.classList.add("active"));
  cancelDates?.addEventListener("click", () => modalDates.classList.remove("active"));
  saveDates?.addEventListener("click", () => {
    const arrivee = document.querySelector("#input-arrivee").value;
    const depart = document.querySelector("#input-depart").value;
    const nights = Number(document.querySelector("#input-nights").value || 1);
    cart[selectedIdx].arrivee = arrivee;
    cart[selectedIdx].depart = depart;
    cart[selectedIdx].nights = nights;
    localStorage.setItem("cart", JSON.stringify(cart));
    updateSummary(cart[selectedIdx]);
    modalDates.classList.remove("active");
  });

  // ---------- Modales (voyageurs)
  const modalGuests = document.querySelector("#modal-edit-guests");
  const editGuestsBtn = document.querySelector("#edit-guests-btn");
  const cancelGuests = document.querySelector("#cancel-guests");
  const saveGuests = document.querySelector("#save-guests");

  editGuestsBtn?.addEventListener("click", () => modalGuests.classList.add("active"));
  cancelGuests?.addEventListener("click", () => modalGuests.classList.remove("active"));
  saveGuests?.addEventListener("click", () => {
    const guests = Number(document.querySelector("#input-guests").value || 1);
    cart[selectedIdx].guests = guests;
    localStorage.setItem("cart", JSON.stringify(cart));
    updateSummary(cart[selectedIdx]);
    modalGuests.classList.remove("active");
  });
});
