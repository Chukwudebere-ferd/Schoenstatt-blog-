// admin.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

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
const auth = getAuth(app);
const db = getFirestore(app);

// ====================== DOM ELEMENTS ======================
const loginForm = document.getElementById("login");
const adminPanel = document.getElementById("adminPanel");
const newsForm = document.getElementById("newsForm");
const uploadFile = document.getElementById("uploadFile");
const blogsList = document.getElementById("blogsList");

// Hide admin panel by default
adminPanel.style.display = "none";

// ====================== LOGIN ======================
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = loginForm.querySelector("input[type='email']").value;
  const password = loginForm.querySelector("input[type='password']").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Login successful ✅");
  } catch (error) {
    alert("Login failed ❌ " + error.message);
  }
});

// ====================== AUTH STATE ======================
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginForm.style.display = "none";
    adminPanel.style.display = "block";
  } else {
    loginForm.style.display = "block";
    adminPanel.style.display = "none";
  }
});

// ====================== LOGOUT ======================
window.logOUT = async () => {
  await signOut(auth);
  alert("Logged out ✅");
};

// ====================== CREATE BLOG ======================


// ====================== CREATE BLOG ======================
let selectedImages = []; // keep global

function initCreateBlog() {
  const uploadFile = document.getElementById("uploadFile");
  const imagePreview = document.querySelector(".imagePreview");
  const newsForm = document.getElementById("newsForm");

  const loader = document.createElement("div");
  loader.innerText = "Uploading...";
  loader.style.display = "none";
  loader.style.textAlign = "center";
  loader.style.marginTop = "10px";
  newsForm.appendChild(loader);

  // Handle file selection
  uploadFile.addEventListener("change", (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (selectedImages.length < 5 && !selectedImages.includes(file)) {
        selectedImages.push(file);
      }
    });
    renderPreview();
    uploadFile.value = ""; // reset input so same file can be reselected
  });

  // Submit form
  newsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = newsForm.querySelector("input[type='text']").value.trim();
    const description = newsForm.querySelector("textarea").value.trim();

    if (!title || !description) return alert("Fill all fields");

    if (selectedImages.length === 0 && !confirm("No images selected. Continue?")) return;

    loader.style.display = "block";

    try {
      const API_KEY = "5ef7cd278c7926f46592ee2d4bcb78fa";

      // Upload all selected images to ImgBB
      const uploadPromises = selectedImages.map(file => {
        const formData = new FormData();
        formData.append("image", file);

        return fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
          method: "POST",
          body: formData
        })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data.url) return data.data.url;
          else throw new Error("Upload failed");
        });
      });

      const imageLinks = await Promise.all(uploadPromises);

      // Save blog with images array
      await addDoc(collection(db, "blogs"), {
        title,
        description,
        images: imageLinks,  // ✅ multiple images stored
        createdAt: serverTimestamp(),
        author: auth.currentUser?.email || "admin"
      });

      alert("Blog published ✅");
      selectedImages = []; // reset
      newsForm.reset();
      renderPreview();
      loadBlogs();

    } catch (err) {
      console.error(err);
      alert("Error publishing blog ❌ " + err.message);
    } finally {
      loader.style.display = "none";
    }
  });

  // Render selected images preview
  function renderPreview() {
    imagePreview.innerHTML = "";
    selectedImages.forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        const wrapper = document.createElement("div");
        wrapper.style.position = "relative";
        wrapper.style.display = "inline-block";
        wrapper.style.margin = "5px";

        const img = document.createElement("img");
        img.src = e.target.result;
        img.style.width = "60px";
        img.style.height = "60px";
        img.style.objectFit = "cover";
        img.style.border = "1px solid #ccc";
        img.style.borderRadius = "5px";

        const removeBtn = document.createElement("span");
        removeBtn.innerText = "❌";
        removeBtn.style.position = "absolute";
        removeBtn.style.top = "2px";
        removeBtn.style.right = "2px";
        removeBtn.style.cursor = "pointer";
        removeBtn.style.background = "rgba(0,0,0,0.5)";
        removeBtn.style.color = "#fff";
        removeBtn.style.fontSize = "12px";
        removeBtn.style.padding = "2px 4px";
        removeBtn.style.borderRadius = "3px";

        removeBtn.addEventListener("click", () => {
          selectedImages = selectedImages.filter(f => f !== file);
          renderPreview();
        });

        wrapper.appendChild(img);
        wrapper.appendChild(removeBtn);
        imagePreview.appendChild(wrapper);
      };
      reader.readAsDataURL(file);
    });
  }
}

document.addEventListener("DOMContentLoaded", initCreateBlog);




// Initialize function when page loads
document.addEventListener("DOMContentLoaded", initCreateBlog);

// ====================== MANAGE BLOG ======================
async function loadBlogs() {
  blogsList.innerHTML = "<p>Loading blogs...</p>";

  try {
    const querySnapshot = await getDocs(collection(db, "blogs"));
    blogsList.innerHTML = "";

    if (querySnapshot.empty) {
      blogsList.innerHTML = "<p>No blogs found.</p>";
      return;
    }

    querySnapshot.forEach(docSnap => {
      const blog = docSnap.data();
      const blogId = docSnap.id;

      const blogCard = document.createElement("div");
      blogCard.classList.add("blog-card");

      // Images
      let imagesHTML = "";
      if (blog.images && blog.images.length > 0) {
        imagesHTML = blog.images.map(url => `<img src="${url}" style="width:70px;height:70px;object-fit:cover;margin:2px;border:1px solid var(--accent);border-radius:5px;">`).join("");
      } else {
        imagesHTML = "<p>No images</p>";
      }

      blogCard.innerHTML = `
        <h3>${blog.title}</h3>
        <p>${blog.description}</p>
        <div class="blog-images">${imagesHTML}</div>
        <div class="blog-actions">
          <button class="editBtn" data-id="${blogId}">Edit</button>
          <button class="deleteBtn" data-id="${blogId}">Delete</button>
        </div>
      `;

      blogsList.appendChild(blogCard);
    });

    // ✅ Attach event listeners after rendering
    const deleteButtons = blogsList.querySelectorAll(".deleteBtn");
    deleteButtons.forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        if (confirm("Are you sure you want to delete this blog?")) {
          await deleteDoc(doc(db, "blogs", id));
          alert("Blog deleted ✅");
          loadBlogs(); // reload blogs
        }
      });
    });

    const editButtons = blogsList.querySelectorAll(".editBtn");
    editButtons.forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const title = prompt("Enter new title:");
        const description = prompt("Enter new description:");
        if (title && description) {
          await updateDoc(doc(db, "blogs", id), {
            title,
            description
          });
          alert("Blog updated ✅");
          loadBlogs(); // reload blogs
        }
      });
    });

  } catch (err) {
    console.error(err);
    blogsList.innerHTML = "<p>Failed to load blogs.</p>";
  }
}



// Show Manage Blogs when menu is clicked
// Show Manage Blogs when menu is clicked
document.querySelector('[data-section="manageBlog"]').addEventListener("click", () => {
  // switch section
  sections.forEach(section => section.classList.remove("active"));
  document.getElementById("manageBlog").classList.add("active");

  // load blogs
  loadBlogs();
});


// ====================== NAVIGATION ======================
const links = document.querySelectorAll(".leftMenu li");
const sections = document.querySelectorAll(".content-section");

links.forEach(link => {
  link.addEventListener("click", ()=> {
    const target = link.getAttribute("data-section");

    // hide all sections
    sections.forEach(section => {
      section.classList.remove("active");
    });

    // show the selected section
    const activeSection = document.getElementById(target);
    activeSection.classList.add("active");

    // if the section is manageBlog, load blogs
    if (target === "manageBlog") {
      loadBlogs();
    }
  });
});
