// ================================
// ASILI COFFEE NURSERY
// ADMIN LOGIN
// ================================

import {
    getAuth,
    signInWithEmailAndPassword
} from
    "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


// Get Firebase app

const app =
    window.asiliFirebase;


// Initialize Authentication

const auth =
    getAuth(app);


// Login form

const loginForm =
    document.querySelector("#loginForm");

const loginButton =
    document.querySelector("#loginButton");

const errorMessage =
    document.querySelector("#errorMessage");


// Handle login

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();


    const email =
        document
            .querySelector("#email")
            .value
            .trim();

    const password =
        document
            .querySelector("#password")
            .value;


    // Clear previous error

    errorMessage.textContent = "";
    errorMessage.style.display = "none";


    // Disable button

    loginButton.disabled = true;

    loginButton.textContent = "Logging in...";


    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );


        // Successful login

        window.location.href =
            "dashboard.html";


    } catch (error) {

        console.error(error);


        errorMessage.textContent =
            "Invalid email or password. Please try again.";

        errorMessage.style.display =
            "block";


        loginButton.disabled = false;

        loginButton.textContent =
            "Login";

    }

});