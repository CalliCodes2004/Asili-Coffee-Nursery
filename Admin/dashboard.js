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

    import {
    collection,
    getDocs
} from
    "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


// Get Firebase app

const app =
    window.asiliFirebase;

    const db =
    window.asiliDB;


// Initialize Authentication

const auth =
    getAuth(app);


// Check authentication

onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href =
            "login.html";

        return;

    }

    loadDashboardInventory();

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

// ================================
// INVENTORY OVERVIEW
// ================================

async function loadDashboardInventory() {

    try {

        const inventorySnapshot =
            await getDocs(
                collection(db, "inventory")
            );


        let totalAvailable = 0;
        let totalReserved = 0;
        let totalSold = 0;
        let totalProduction = 0;


        inventorySnapshot.forEach((inventoryDocument) => {

            const inventory =
                inventoryDocument.data();


            totalAvailable +=
                Number(inventory.available || 0);

            totalReserved +=
                Number(inventory.reserved || 0);

            totalSold +=
                Number(inventory.sold || 0);

            totalProduction +=
                Number(inventory.production || 0);

        });


        document.querySelector(
            "#dashboardAvailable"
        ).textContent =
            totalAvailable.toLocaleString();


        document.querySelector(
            "#dashboardReserved"
        ).textContent =
            totalReserved.toLocaleString();


        document.querySelector(
            "#dashboardSold"
        ).textContent =
            totalSold.toLocaleString();


        document.querySelector(
            "#dashboardProduction"
        ).textContent =
            totalProduction.toLocaleString();


    } catch (error) {

        console.error(
            "Unable to load dashboard inventory:",
            error
        );

    }

}