// ================================
// ASILI COFFEE NURSERY
// ADMIN DASHBOARD
// ================================

import {
    getAuth,
    onAuthStateChanged,
    signOut
} from
    "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


// Get Firebase app

const app =
    window.asiliFirebase;


// Initialize Authentication

const auth =
    getAuth(app);


// Check authentication

onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href =
            "login.html";

    }

});


// Logout

const logoutButton =
    document.querySelector("#logoutButton");


logoutButton.addEventListener("click", async () => {

    try {

        await signOut(auth);

        window.location.href =
            "login.html";

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        alert(
            "Unable to log out. Please try again."
        );

    }

});