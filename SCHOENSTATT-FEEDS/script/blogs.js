import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// 🔹 Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCGj0rFLg69J7gfbcXqZgi-KyhD9gh6uZM",
  authDomain: "schoenstatt-youth-blog.firebaseapp.com",
  projectId: "schoenstatt-youth-blog",
  storageBucket: "schoenstatt-youth-blog.appspot.com",
  messagingSenderId: "391232545358",
  appId: "1:391232545358:web:22f47fa41c9baf63c6191f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const blogsContainer = document.getElementById("blogsContainer");
const searchInput = document.getElementById("searchInput");

let allBlogs = []; // keep original data

// Fetch blogs
async function loadBlogs() {
  try {
    blogsContainer.innerHTML = "<p>Loading...</p>";

    let q;
    try {
      // Try ordering by timestamp
      q = query(collection(db, "blogs"), orderBy("timestamp", "desc"));
    } catch (err) {
      console.warn("⚠️ Falling back: some docs may not have 'timestamp'");
      q = query(collection(db, "blogs"));
    }

    const querySnapshot = await getDocs(q);

    allBlogs = [];
    querySnapshot.forEach(doc => {
      allBlogs.push({ id: doc.id, ...doc.data() });
    });

    renderBlogs(allBlogs);

    // Search functionality with debounce
    let debounceTimer;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const term = e.target.value.toLowerCase();
        const filtered = allBlogs.filter(b =>
          b.title?.toLowerCase().includes(term) ||
          b.content?.toLowerCase().includes(term)
        );
        renderBlogs(filtered);
      }, 300);
    });

  } catch (error) {
    console.error("❌ Error fetching blogs:", error);
    blogsContainer.innerHTML = `<p style="color:red;">Error loading blogs. Check console.</p>`;
  }
}

// Render blogs
function renderBlogs(blogs) {
  if (!blogs || blogs.length === 0) {
    blogsContainer.innerHTML = "<p>No posts found.</p>";
    return;
  }

  blogsContainer.innerHTML = blogs.map(blog => {
    const date = blog.timestamp?.seconds
      ? new Date(blog.timestamp.seconds * 1000).toLocaleString()
      : "Unknown date";

    return `
      <div class="blog-card">
        <div class="image-gallery">
          ${blog.images ? blog.images.map(img => `
            <img src="${img}" alt="blog image" class="gallery-img">
          `).join("") : ""}
        </div>
        <div class="content">
          <h3>${blog.title || "Untitled"}</h3>
          <small>${date}</small>
          <p>${blog.content || ""}</p>
        </div>
      </div>
    `;
  }).join("");

  setupImageModal();
}

// Image Modal
function setupImageModal() {
  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalImage");
  const closeBtn = document.querySelector(".close");

  document.querySelectorAll(".gallery-img").forEach(img => {
    img.onclick = () => {
      modal.style.display = "block";
      modalImg.src = img.src;
    };
  });

  closeBtn.onclick = () => modal.style.display = "none";
  modal.onclick = () => modal.style.display = "none";
}

loadBlogs();

// Mobile nav toggle
document.addEventListener("DOMContentLoaded", () => {
  const menu = document.querySelector("#menu-toggle");
  const navLinks = document.querySelector(".nav-links");
  if (menu && navLinks) {
    menu.addEventListener("click", () => navLinks.classList.toggle("show"));
  }
});
