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
let selectedImages = [];

function initCreateBlog() {
  const uploadFile = document.getElementById("uploadFile");
  const imagePreview = document.querySelector(".imagePreview");
  const newsForm = document.getElementById("newsForm");

  // Loader
  const loader = document.createElement("div");
  loader.innerText = "Uploading...";
  loader.style.display = "none";
  loader.style.textAlign = "center";
  loader.style.marginTop = "10px";
  newsForm.appendChild(loader);

  // Handle file selection
  uploadFile.addEventListener("change", () => {
    const files = Array.from(uploadFile.files);

    // Add new files to selectedImages but max 5
    files.forEach(file => {
      if (selectedImages.length < 5) {
        selectedImages.push(file);
      }
    });

    renderPreview();
    uploadFile.value = ""; // reset input so same file can be re-added if removed
  });

  // Handle form submit
  newsForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = newsForm.querySelector("input[type='text']").value.trim();
    const description = newsForm.querySelector("textarea").value.trim();

    if (!title || !description) {
      alert("Please fill in title and description");
      return;
    }

    loader.style.display = "block"; // show loader

    try {
      // Upload images to Imgur
      const imageLinks = [];
      for (let file of selectedImages) {
        const formData = new FormData();
        formData.append("image", file);

        const res = await fetch("https://api.imgur.com/3/image", {
          method: "POST",
          headers: {
            Authorization: "Client-ID 5ef7cd278c7926f46592ee2d4bcb78fa"
          },
          body: formData
        });

        const data = await res.json();
        if (data.success) {
          imageLinks.push(data.data.link);
        } else {
          console.error("Imgur upload failed:", data);
        }
      }

      // Save blog to Firestore
      await addDoc(collection(db, "blogs"), {
        title,
        description,
        images: imageLinks,
        createdAt: serverTimestamp(),
        author: auth.currentUser?.email || "admin"
      });

      alert("Blog published successfully ✅");
      newsForm.reset();
      selectedImages = [];
      renderPreview();
    } catch (err) {
      console.error(err);
      alert("Error publishing blog ❌");
    } finally {
      loader.style.display = "none"; // hide loader
    }
  });

  // Function to re-render previews
  function renderPreview() {
    imagePreview.innerHTML = "";
    selectedImages.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = e => {
        const wrapper = document.createElement("div");
        wrapper.style.position = "relative";
        wrapper.style.display = "inline-block";
        wrapper.style.margin = "5px";

        // image
        const img = document.createElement("img");
        img.src = e.target.result;
        img.style.width = "50px";
        img.style.height = "50px";
        img.style.objectFit = "cover";
        img.style.border = "1px solid #ccc";
        img.style.borderRadius = "5px";

        // remove button
        const removeBtn = document.createElement("span");
        removeBtn.innerHTML = "❌";
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
          selectedImages.splice(index, 1); // remove from array
          renderPreview(); // re-render
        });

        wrapper.appendChild(img);
        wrapper.appendChild(removeBtn);
        imagePreview.appendChild(wrapper);
      };
      reader.readAsDataURL(file);
    });
  }
}

// Initialize function when page loads
document.addEventListener("DOMContentLoaded", initCreateBlog);

// ====================== MANAGE BLOG ======================
async function loadBlogs() {
  blogsList.innerHTML = "<p>Loading blogs...</p>";

  try {
    const querySnapshot = await getDocs(collection(db, "blogs"));
    blogsList.innerHTML = ""; // clear loading text

    if (querySnapshot.empty) {
      blogsList.innerHTML = "<p>No blogs found.</p>";
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const blog = docSnap.data();
      const blogId = docSnap.id;

      // Create blog card
      const blogCard = document.createElement("div");
      blogCard.classList.add("blog-card");

      blogCard.innerHTML = `
        <h3>${blog.title}</h3>
        <p>${blog.description}</p>
        <div class="blog-images">
          ${blog.images && blog.images.length > 0 
            ? blog.images.map(img => `<img src="${img}" alt="blog image"/>`).join("") 
            : "<p>No images</p>"}
        </div>
        <div class="blog-actions">
          <button class="editBtn" data-id="${blogId}">Edit</button>
          <button class="deleteBtn" data-id="${blogId}">Delete</button>
        </div>
      `;

      blogsList.appendChild(blogCard);
    });

    // Attach delete handlers
    document.querySelectorAll(".deleteBtn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.getAttribute("data-id");
        if (confirm("Delete this blog?")) {
          await deleteDoc(doc(db, "blogs", id));
          alert("Blog deleted!");
          loadBlogs(); // refresh list
        }
      });
    });

    // Attach edit handlers
    document.querySelectorAll(".editBtn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.getAttribute("data-id");

        // Find blog card
        const card = e.target.closest(".blog-card");
        const currentTitle = card.querySelector("h3").innerText;
        const currentDesc = card.querySelector("p").innerText;

        // Replace content with editable form
        card.innerHTML = `
          <input type="text" id="editTitle-${id}" value="${currentTitle}" />
          <textarea id="editDesc-${id}">${currentDesc}</textarea>
          <button class="saveEditBtn" data-id="${id}">Save</button>
          <button class="cancelEditBtn" data-id="${id}">Cancel</button>
        `;

        // Save handler
        card.querySelector(".saveEditBtn").addEventListener("click", async () => {
          const newTitle = card.querySelector(`#editTitle-${id}`).value.trim();
          const newDesc = card.querySelector(`#editDesc-${id}`).value.trim();

          if (!newTitle || !newDesc) {
            alert("Fields cannot be empty");
            return;
          }

          try {
            await updateDoc(doc(db, "blogs", id), {
              title: newTitle,
              description: newDesc
            });
            alert("Blog updated ✅");
            loadBlogs(); // reload updated list
          } catch (err) {
            console.error("Error updating blog:", err);
            alert("Update failed ❌");
          }
        });

        // Cancel handler
        card.querySelector(".cancelEditBtn").addEventListener("click", () => {
          loadBlogs(); // just reload list
        });
      });
    });

  } catch (err) {
    console.error("Error loading blogs: ", err);
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
