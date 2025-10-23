// ============================================================
//  🌐 UTILITAIRES GÉNÉRAUX
// ============================================================

// === Sélecteurs globaux (une seule fois pour tout le site) ===
// Définition de deux fonctions pour sélectionner des éléments du DOM
// $ pour un seul élément et $$ pour plusieurs éléments.
window.$ = (s, scope = document) => scope.querySelector(s);
window.$$ = (s, scope = document) => Array.from(scope.querySelectorAll(s));

// ============================================================
//  🧭 MENU MOBILE
// ============================================================

// Sélection des éléments nécessaires pour le menu mobile
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
  // Sélection des éléments pour le popup mobile
  const openBtn = $("#search-btn");
  const popup = $("#mobile-popup");
  const closeBtn = $("#popup-close");
  const clearBtn = $("#popup-clear");

  if (openBtn && popup && closeBtn) {
    // Ouvrir le popup sur mobile
    openBtn.addEventListener("click", (e) => {
      if (window.innerWidth <= 768) {
        e.preventDefault(); // Empêche le comportement par défaut du bouton
        popup.classList.add("active");
        popup.setAttribute("aria-hidden", "false");
        document.body.classList.add("popup-open");
      }
    });

    // Fermer le popup
    closeBtn.addEventListener("click", () => {
      popup.classList.remove("active");
      popup.setAttribute("aria-hidden", "true");
      document.body.classList.remove("popup-open");
    });

    // Effacer les champs du popup
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
  // Sélection du bouton "voir plus" et des éléments cachés
  const toggleBtn = $(".features-toggle");
  const hiddenFeatures = $$(".feature__accueil2.feature-hidden");

  if (!toggleBtn) return;

  // Gestion du clic sur le bouton "voir plus"
  toggleBtn.addEventListener("click", () => {
    const isOpen = toggleBtn.classList.toggle("open");
    const icon = toggleBtn.querySelector("i");
    icon.classList.toggle("fa-chevron-down", !isOpen);
    icon.classList.toggle("fa-chevron-up", isOpen);
    toggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    hiddenFeatures.forEach((f) => (f.style.display = isOpen ? "flex" : "none"));
  });
});