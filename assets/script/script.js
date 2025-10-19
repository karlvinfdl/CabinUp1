// ============================================================
// GESTION DU MENU MOBILE (OUVERTURE / FERMETURE)
// ============================================================

// Récupération des éléments du DOM nécessaires au menu mobile
const navToggle = document.getElementById("nav-toggle");   // Bouton pour ouvrir le menu mobile
const menuClose = document.getElementById("menu-close");   // Bouton pour fermer le menu mobile
const mobileMenu = document.getElementById("mobile-menu"); // Conteneur du menu mobile

// Lorsque l’utilisateur clique sur le bouton d’ouverture du menu
navToggle.addEventListener("click", () => {
  // On affiche le menu mobile en mode flex
  mobileMenu.style.display = "flex";
});

// Lorsque l’utilisateur clique sur le bouton de fermeture du menu
menuClose.addEventListener("click", () => {
  // On masque le menu mobile
  mobileMenu.style.display = "none";
});


// ============================================================
// POPUP MOBILE (OUVERTURE / FERMETURE)
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  // Sélection des éléments nécessaires pour le popup
  const openBtn = document.getElementById("search-btn");   // Bouton d’ouverture du popup
  const popup = document.getElementById("mobile-popup");   // Conteneur du popup
  const closeBtn = document.getElementById("popup-close"); // Bouton de fermeture du popup

  // On vérifie que tous les éléments existent avant d’attacher les événements
  if (openBtn && popup && closeBtn) {

    // Événement : ouverture du popup sur mobile uniquement
    openBtn.addEventListener("click", () => {
      // Condition : uniquement si la largeur de l’écran est inférieure ou égale à 768px
      if (window.innerWidth <= 768) {
        popup.classList.add("active");                   // Ajoute la classe active pour afficher le popup
        popup.setAttribute("aria-hidden", "false");       // Met à jour l’accessibilité
        document.body.classList.add("popup-open");        // Empêche le scroll du fond
      }
    });

    // Événement : fermeture du popup
    closeBtn.addEventListener("click", () => {
      popup.classList.remove("active");                  // Retire la classe active pour le masquer
      popup.setAttribute("aria-hidden", "true");          // Met à jour l’accessibilité
      document.body.classList.remove("popup-open");       // Réactive le scroll du fond
    });
  }
});


// ============================================================
// DROPDOWN DES FEATURES (SECTION ACCUEIL) 
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

  // Sélection du bouton de bascule et des features cachées
  const toggleBtn = document.querySelector(".features-toggle");
  const hiddenFeatures = document.querySelectorAll(".feature__accueil2.feature-hidden");

  // Si le bouton n'existe pas, on sort
  if (!toggleBtn) return;

  toggleBtn.addEventListener("click", () => {
    // On bascule l'état ouvert/fermé
    const isOpen = toggleBtn.classList.toggle("open");

    // On met à jour l'icône (chevron haut/bas)
    const icon = toggleBtn.querySelector("i");
    icon.classList.toggle("fa-chevron-down", !isOpen);
    icon.classList.toggle("fa-chevron-up", isOpen);

    // Mise à jour ARIA pour l'accessibilité
    toggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");

    // On affiche ou masque directement les features
    hiddenFeatures.forEach((feature) => {
      feature.style.display = isOpen ? "flex" : "none";
    });
  });
});
