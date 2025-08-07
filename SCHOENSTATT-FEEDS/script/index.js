document.addEventListener("DOMContentLoaded", () => {
  const menu = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");

  menu.addEventListener("click", () => {
    navLinks.classList.toggle("show");
  });

  // Optional: scroll reveal
  const aboutSection = document.querySelector(".about-text");
  const revealOnScroll = () => {
    const rect = aboutSection.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.8) {
      aboutSection.classList.add("reveal");
      window.removeEventListener("scroll", revealOnScroll);
    }
  };
  window.addEventListener("scroll", revealOnScroll);
});

// Function to handle language selection
document.getElementById('language').addEventListener('change', function() {
  var language = this.value;
  if (language) {
    var select = document.querySelector('select.goog-te-combo');
    if (select) {
      select.value = language;
      select.dispatchEvent(new Event('change'));
    }
  }
});
