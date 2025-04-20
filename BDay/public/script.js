// Firebase configuration and initialization (make sure to replace with your own config)
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
     apiKey: "AIzaSyACCDqnlnjfaUHGgBNiUpldZUa72Nil7FM",
    authDomain: "birthadaygift-4e998.firebaseapp.com",
    projectId: "birthadaygift-4e998",
    storageBucket: "birthadaygift-4e998.firebasestorage.app",
    messagingSenderId: "186585309994",
    appId: "1:186585309994:web:cbad9981beb843a666b453",
    measurementId: "G-3E0HRMRGGH"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Main logic
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const nameParam = urlParams.get("name");
  const decodedName = nameParam ? decodeURIComponent(nameParam) : "Anonymous";

  // 1. Personalized greeting
  const title = document.getElementById("greetingTitle");
  if (title) {
    title.innerText = `🎁 Hello ${decodedName}! What's Your Dream Gift?`;
  }

  // 2. Handle form submission and sync to Firebase
  const form = document.getElementById("wishForm");
  const wishInput = document.getElementById("wishText");
  const giftInput = document.getElementById("giftText");
  const thanksMessage = document.getElementById("thanksMessage");

  if (form && wishInput && giftInput && thanksMessage) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const wish = wishInput.value.trim();
      const gift = giftInput.value.trim();

      if (!wish || !gift) {
        alert("🎈 Please fill in both your wish and gift!");
        return;
      }

      try {
        await addDoc(collection(db, "wishes"), {
          name: decodedName,
          wish: wish,
          gift: gift,
          timestamp: new Date().toISOString(),
        });

        form.style.display = "none";
        thanksMessage.style.display = "block";
        showConfetti();
      } catch (error) {
        console.error("❌ Error adding document: ", error);
        alert("Something went wrong. Please try again!");
      }
    });
  }
});

// 🎁 Gift Suggestion UI Logic
function showGiftSuggestions() {
  const modal = document.getElementById("giftSuggestions");
  if (modal) modal.style.display = "block";
}

function hideGiftSuggestions() {
  const modal = document.getElementById("giftSuggestions");
  if (modal) modal.style.display = "none";
}

function selectGift(giftName) {
  const giftInput = document.getElementById("giftText");
  if (giftInput) giftInput.value = giftName;
  hideGiftSuggestions();
}
