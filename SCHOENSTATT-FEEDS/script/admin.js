// admin.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

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
newsForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = newsForm.querySelector("input[type='text']").value;
  const description = newsForm.querySelector("textarea").value;
  const file = uploadFile.files[0];

  let imageUrl = "";

  if (file) {
    // Upload image to ImgBB
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("https://api.imgbb.com/1/upload?key=5ef7cd278c7926f46592ee2d4bcb78fa", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      imageUrl = data.data.url;
    } catch (err) {
      alert("Image upload failed ❌");
      return;
    }
  }

  try {
    await addDoc(collection(db, "blogs"), {
      title,
      description,
      image: imageUrl,
      createdAt: serverTimestamp(),
    });
    alert("Blog published ✅");
    newsForm.reset();
  } catch (err) {
    alert("Error publishing blog ❌ " + err.message);
  }
});


const links = document.querySelectorAll(".leftMenu li")
const sections = document.querySelectorAll(".content-section");

links.forEach(link => {
    link.addEventListener("click", ()=> {
        const target = link.getAttribute("data-section");

        sections.forEach(section => {
            section.classList.remove("active");
        });

        document.getElementById(target).classList.add("active")
    });
});