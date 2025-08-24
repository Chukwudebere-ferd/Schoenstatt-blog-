import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// ====================== FIREBASE CONFIG ======================
const firebaseConfig = {
  apiKey: "AIzaSyCGj0rFLg69J7gfbcXqZgi-KyhD9gh6uZM",
  authDomain: "schoenstatt-youth-blog.firebaseapp.com",
  projectId: "schoenstatt-youth-blog",
  storageBucket: "schoenstatt-youth-blog.firebasestorage.app",
  messagingSenderId: "391232545358",
  appId: "1:391232545358:web:22f47fa41c9baf63c6191f"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ====================== NAV TOGGLE & SCROLL ======================
document.addEventListener("DOMContentLoaded", () => {
  const menu = document.querySelector("#menu-toggle");
  const navLinks = document.querySelector(".nav-links");

  menu.addEventListener("click", () => {
    navLinks.classList.toggle("show");
  });

  // Scroll reveal
  const aboutSection = document.querySelector(".about-text");
  const revealOnScroll = () => {
    const rect = aboutSection.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.8) {
      aboutSection.classList.add("reveal");
      window.removeEventListener("scroll", revealOnScroll);
    }
  };
  window.addEventListener("scroll", revealOnScroll);

  // Load recent blogs
  loadRecentBlogs();
});

// ====================== LANGUAGE SWITCH ======================
document.getElementById("language").addEventListener("change", function () {
  var language = this.value;
  if (language) {
    var select = document.querySelector("select.goog-te-combo");
    if (select) {
      select.value = language;
      select.dispatchEvent(new Event("change"));
    }
  }
});

// ====================== LOAD RECENT BLOGS ======================
async function loadRecentBlogs() {
  const container = document.getElementById("recentBlogsContainer");
  if (!container) return;

  container.innerHTML = "<p>Loading blogs...</p>";

  try {
    const q = query(collection(db, "blogs"), orderBy("createdAt", "desc"), limit(4));
    const snapshot = await getDocs(q);

    container.innerHTML = "";
    if (snapshot.empty) {
      container.innerHTML = "<p>No blogs yet.</p>";
      return;
    }

    snapshot.forEach(doc => {
      const blog = doc.data();
      const date = blog.createdAt?.toDate().toLocaleDateString() || "Unknown date";
      const firstImage = blog.images?.[0] || "./assests/schoenstatt logo.jpg";

      const card = document.createElement("div");
      card.className = "blog-card";
      card.innerHTML = `
        <img src="${firstImage}" alt="Blog image">
        <div class="content">
          <h3>${blog.title}</h3>
          <p>${blog.description.substring(0, 80)}...</p>
          <p class="date">${date}</p>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Failed to load blogs.</p>";
  }
}
