const navToggle = document.getElementById("nav-toggle");
    const menuClose = document.getElementById("menu-close");
    const mobileMenu = document.getElementById("mobile-menu");

    navToggle.addEventListener("click", () => {
      mobileMenu.style.display = "flex";
    });

    menuClose.addEventListener("click", () => {
      mobileMenu.style.display = "none";
    });
