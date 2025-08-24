// ./script/blogs.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* ================= FIREBASE CONFIG ================= */
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

/* ================= DOM ELEMENTS ================= */
const blogsContainer = document.getElementById("blogsContainer");
const searchInput = document.getElementById("searchInput");
const imageModal = document.getElementById("imageModal");
const modalImg = document.getElementById("modalImage");
const modalClose = imageModal?.querySelector(".close") ?? null;

// guard
if (!blogsContainer) console.error("blogsContainer element not found. Make sure #blogsContainer exists in HTML.");

// store all blogs for searching
let blogsData = [];

// modal state
let galleryImages = [];
let galleryIndex = 0;

/* ================= helpers ================= */
function parseDate(doc) {
  const d = doc?.createdAt ?? doc?.timestamp ?? doc?.date;
  if (!d) return "";
  if (typeof d?.toDate === "function") return d.toDate().toLocaleString();
  if (typeof d === "string") {
    const dt = new Date(d);
    return isNaN(dt) ? d : dt.toLocaleString();
  }
  if (typeof d === "number") return new Date(d).toLocaleString();
  return "";
}

function getContentText(doc) {
  return (doc.content ?? doc.description ?? "").toString();
}

/* ================= MODAL / GALLERY ================= */
function openGallery(images, startIndex = 0) {
  if (!imageModal || !modalImg) return;
  galleryImages = images;
  galleryIndex = startIndex;

  modalImg.src = galleryImages[galleryIndex] || "";
  imageModal.style.display = "flex"; // flex for centering
  modalImg.style.maxHeight = "80vh";
  modalImg.style.maxWidth = "80vw";
  modalImg.style.borderRadius = "12px";
  modalImg.style.transition = "opacity 0.3s";

  // add counter
  let counter = imageModal.querySelector(".gallery-counter");
  if (!counter) {
    counter = document.createElement("div");
    counter.className = "gallery-counter";
    counter.style.position = "absolute";
    counter.style.bottom = "20px";
    counter.style.left = "50%";
    counter.style.transform = "translateX(-50%)";
    counter.style.color = "#fff";
    counter.style.fontSize = "1rem";
    counter.style.fontWeight = "bold";
    imageModal.appendChild(counter);
  }
  counter.textContent = `${galleryIndex + 1} / ${galleryImages.length}`;

  updateModalNav();
}

function closeGallery() {
  if (!imageModal || !modalImg) return;
  imageModal.style.display = "none";
  modalImg.src = "";
  galleryImages = [];
  galleryIndex = 0;
}

function ensureModalNav() {
  if (!imageModal) return;
  if (imageModal.querySelector(".gallery-prev") && imageModal.querySelector(".gallery-next")) return;

  const prev = document.createElement("button");
  prev.className = "gallery-prev gallery-btn";
  prev.innerText = "‹";
  prev.addEventListener("click", (e) => { e.stopPropagation(); showPrev(); });

  const next = document.createElement("button");
  next.className = "gallery-next gallery-btn";
  next.innerText = "›";
  next.addEventListener("click", (e) => { e.stopPropagation(); showNext(); });

  imageModal.appendChild(prev);
  imageModal.appendChild(next);
}

function updateModalNav() {
  if (!imageModal) return;
  const prev = imageModal.querySelector(".gallery-prev");
  const next = imageModal.querySelector(".gallery-next");
  if (prev) prev.style.display = (galleryIndex > 0) ? "block" : "none";
  if (next) next.style.display = (galleryIndex < galleryImages.length - 1) ? "block" : "none";

  const counter = imageModal.querySelector(".gallery-counter");
  if (counter) counter.textContent = `${galleryIndex + 1} / ${galleryImages.length}`;
}

function showPrev() {
  if (galleryIndex > 0) {
    galleryIndex--;
    modalImg.style.opacity = 0;
    setTimeout(() => {
      modalImg.src = galleryImages[galleryIndex];
      modalImg.style.opacity = 1;
      updateModalNav();
    }, 200);
  }
}
function showNext() {
  if (galleryIndex < galleryImages.length - 1) {
    galleryIndex++;
    modalImg.style.opacity = 0;
    setTimeout(() => {
      modalImg.src = galleryImages[galleryIndex];
      modalImg.style.opacity = 1;
      updateModalNav();
    }, 200);
  }
}

/* modal close events */
if (imageModal) imageModal.addEventListener("click", (e) => { if (e.target === imageModal) closeGallery(); });
if (modalClose) modalClose.addEventListener("click", closeGallery);
document.addEventListener("keydown", (e) => {
  if (!imageModal || imageModal.style.display !== "flex") return;
  if (e.key === "ArrowLeft") showPrev();
  if (e.key === "ArrowRight") showNext();
  if (e.key === "Escape") closeGallery();
});

/* ================= LOAD & DISPLAY BLOGS ================= */
async function loadBlogs() {
  if (!blogsContainer) return;
  blogsContainer.innerHTML = "<p>Loading blogs...</p>";

  let snapshot;
  try {
    snapshot = await getDocs(query(collection(db, "blogs"), orderBy("createdAt", "desc")));
  } catch (errOrder) {
    console.warn("orderBy(createdAt) failed, fetching unordered:", errOrder);
    snapshot = await getDocs(collection(db, "blogs"));
  }

  const docs = snapshot.docs || [];
  blogsData = docs.map(d => ({ id: d.id, ...d.data() }));
  displayBlogs(blogsData);
  ensureModalNav();
}

function displayBlogs(blogs) {
  if (!blogsContainer) return;
  blogsContainer.innerHTML = "";

  if (!blogs.length) {
    blogsContainer.innerHTML = "<p>No blogs yet.</p>";
    return;
  }

  const frag = document.createDocumentFragment();

  blogs.forEach(b => {
    const title = b.title ?? "Untitled";
    const content = getContentText(b);
    const images = Array.isArray(b.images) ? b.images : (b.imageUrl ? [b.imageUrl] : []);
    const dateStr = parseDate(b) || "";

    const card = document.createElement("article");
    card.className = "blog-card";

    // Image gallery preview
    if (images.length) {
      const gallery = document.createElement("div");
      gallery.className = "image-gallery";

      images.slice(0, 4).forEach((url, idx) => {
        const thumb = document.createElement("img");
        thumb.src = url;
        thumb.alt = `${title} image ${idx + 1}`;
        thumb.className = "gallery-thumb";
        thumb.addEventListener("click", (e) => { e.stopPropagation(); openGallery(images, idx); });
        gallery.appendChild(thumb);
      });

      if (images.length > 4) {
        const moreCount = images.length - 4;
        const last = gallery.lastElementChild;
        if (last) {
          const overlay = document.createElement("span");
          overlay.className = "gallery-more";
          overlay.innerText = `+${moreCount}`;
          last.style.position = "relative";
          overlay.style.position = "absolute";
          overlay.style.right = "8px";
          overlay.style.bottom = "8px";
          overlay.style.background = "rgba(0,0,0,0.6)";
          overlay.style.color = "#fff";
          overlay.style.padding = "4px 8px";
          overlay.style.borderRadius = "6px";
          overlay.style.fontSize = "0.9rem";
          last.parentElement.style.position = "relative";
          last.parentElement.appendChild(overlay);
        }
      }

      card.appendChild(gallery);
    }

    // title
    const h = document.createElement("h3");
    h.textContent = title;
    card.appendChild(h);

    // truncated content + see more
    const p = document.createElement("p");
    p.className = "blog-content";
    const truncLen = 220;
    if (content.length > truncLen) {
      p.textContent = content.slice(0, truncLen) + "...";
      const btn = document.createElement("button");
      btn.className = "see-more-btn";
      btn.textContent = "See More";
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (btn.textContent === "See More") {
          p.textContent = content;
          btn.textContent = "See Less";
        } else {
          p.textContent = content.slice(0, truncLen) + "...";
          btn.textContent = "See More";
        }
      });
      card.appendChild(p);
      card.appendChild(btn);
    } else card.appendChild(p);

    // meta with verified badge
    const meta = document.createElement("div");
    meta.className = "blog-meta";
    const verifiedBadge = `
      <svg xmlns="http://www.w3.org/2000/svg" 
           width="16" height="16" viewBox="0 0 24 24" fill="var(--accent)">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 
                 12-12S18.627 0 12 0zm-1.2 17.4l-4.8-4.8 1.68-1.68 
                 3.12 3.12 6.72-6.72 1.68 1.68-8.4 8.4z"/>
      </svg>
    `;
    meta.innerHTML = `<small class="blog-date">${dateStr}</small><span class="blog-author">${verifiedBadge}</span>`;
    card.appendChild(meta);

    // click card -> open gallery
    card.addEventListener("click", () => { if (images.length) openGallery(images, 0); });

    frag.appendChild(card);
  });

  blogsContainer.appendChild(frag);
}

/* ================= search ================= */
if (searchInput) {
  searchInput.addEventListener("keyup", (e) => {
    const term = (e.target.value || "").toLowerCase().trim();
    if (!term) return displayBlogs(blogsData);
    const filtered = blogsData.filter(b => {
      const title = (b.title ?? "").toLowerCase();
      const content = getContentText(b).toLowerCase();
      return title.includes(term) || content.includes(term);
    });
    displayBlogs(filtered);
  });
}

/* ================= start ================= */
loadBlogs().catch(err => {
  console.error("Failed to load blogs:", err);
  if (blogsContainer) blogsContainer.innerHTML = `<p style="color:red;">Error loading blogs. See console.</p>`;
});
