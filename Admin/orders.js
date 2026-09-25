// ================================
// ASILI COFFEE NURSERY
// ADMIN ORDERS
// ================================

import {
    getAuth,
    onAuthStateChanged,
    signOut
} from
    "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    getFirestore,
    collection,
    getDocs
} from
    "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


// ================================
// FIREBASE
// ================================

const app =
    window.asiliFirebase;

const db =
    window.asiliDB;

const auth =
    getAuth(app);


// ================================
// ELEMENTS
// ================================

const ordersTableBody =
    document.querySelector("#ordersTableBody");

const totalOrders =
    document.querySelector("#totalOrders");

const pendingOrders =
    document.querySelector("#pendingOrders");

const orderValue =
    document.querySelector("#orderValue");

const logoutButton =
    document.querySelector("#logoutButton");


// ================================
// AUTHENTICATION CHECK
// ================================

onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href =
            "login.html";

        return;
    }

    loadOrders();

});


// ================================
// LOAD ORDERS
// ================================

async function loadOrders() {

    try {

        const ordersSnapshot =
            await getDocs(
                collection(db, "orders")
            );


        let totalOrderCount = 0;

        let pendingOrderCount = 0;

        let totalOrderValue = 0;


        ordersTableBody.innerHTML = "";


        if (ordersSnapshot.empty) {

            ordersTableBody.innerHTML = `

                <tr>

                    <td
                        colspan="8"
                        class="empty-message"
                    >
                        No orders found.

                    </td>

                </tr>

            `;

            updateSummary(
                0,
                0,
                0
            );

            return;
        }


        ordersSnapshot.forEach((orderDocument) => {

            const order =
                orderDocument.data();


            totalOrderCount++;


            const quantity =
                Number(order.quantity || 0);

            const total =
                Number(order.total || 0);


            totalOrderValue += total;


            const status =
                order.status || "pending";


            if (
                status.toLowerCase() ===
                "pending"
            ) {

                pendingOrderCount++;

            }


            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    ${order.customerName || "-"}
                </td>

                <td>
                    ${order.phone || "-"}
                </td>

                <td>
                    ${order.variety || "-"}
                </td>

                <td>
                    ${quantity.toLocaleString()}
                </td>

                <td>
                    KSh ${total.toLocaleString()}
                </td>

                <td>
                    ${order.location || "-"}
                </td>

                <td>
                    ${order.orderMethod || "-"}
                </td>

                <td>

                    <span class="status">

                        ${status}

                    </span>

                </td>

            `;


            ordersTableBody.appendChild(row);

        });


        updateSummary(
            totalOrderCount,
            pendingOrderCount,
            totalOrderValue
        );


    } catch (error) {

        console.error(
            "Error loading orders:",
            error
        );


        ordersTableBody.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="empty-message"
                >
                    Unable to load orders.

                </td>

            </tr>

        `;

    }

}


// ================================
// UPDATE SUMMARY
// ================================

function updateSummary(
    total,
    pending,
    value
) {

    totalOrders.textContent =
        total.toLocaleString();

    pendingOrders.textContent =
        pending.toLocaleString();

    orderValue.textContent =
        `KSh ${value.toLocaleString()}`;

}


// ================================
// LOGOUT
// ================================

logoutButton.addEventListener(
    "click",
    async () => {

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

    }
);