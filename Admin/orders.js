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
    getDocs,
    doc,
    updateDoc
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
    <td>${order.customerName || "-"}</td>
    <td>${order.phone || "-"}</td>
    <td>${order.variety || "-"}</td>
    <td>${quantity.toLocaleString()}</td>
    <td>KSh ${total.toLocaleString()}</td>
    <td>${order.location || "-"}</td>
    <td>${order.orderMethod || "-"}</td>

<td>
    ${
        order.createdAt
            ? order.createdAt.toDate().toLocaleString()
            : "-"
    }
</td>

<td>
    
        <select class="status-select" data-order-id="${orderDocument.id}">
            <option value="pending" ${status === "pending" ? "selected" : ""}>
                Pending
            </option>

            <option value="confirmed" ${status === "confirmed" ? "selected" : ""}>
                Confirmed
            </option>

            <option value="preparing" ${status === "preparing" ? "selected" : ""}>
                Preparing
            </option>

            <option value="ready" ${status === "ready" ? "selected" : ""}>
                Ready
            </option>

            <option value="completed" ${status === "completed" ? "selected" : ""}>
                Completed
            </option>

            <option value="cancelled" ${status === "cancelled" ? "selected" : ""}>
                Cancelled
            </option>
        </select>
    </td>

    <td>
    <button
    class="view-order-button"
    data-order-id="${orderDocument.id}"
    data-message="${(order.additionalMessage || "")
        .replace(/"/g, "&quot;")}"
>
    View
</button>
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

// ================================
// UPDATE ORDER STATUS
// ================================

ordersTableBody.addEventListener("change", async (event) => {

    if (!event.target.classList.contains("status-select")) {
        return;
    }

    const select = event.target;

    const orderId =
        select.dataset.orderId;

    const newStatus =
        select.value;

    try {

        await updateDoc(
            doc(db, "orders", orderId),
            {
                status: newStatus
            }
        );

        console.log(
            `Order ${orderId} updated to ${newStatus}`
        );

    } catch (error) {

        console.error(
            "Unable to update order status:",
            error
        );

        alert(
            "Unable to update the order status. Please try again."
        );

        // Reload orders so the dropdown returns
        // to the actual Firestore status.
        loadOrders();
    }

});

// ================================
// VIEW ORDER DETAILS
// ================================

const orderDetailsModal =
    document.querySelector("#orderDetailsModal");

const orderDetailsContent =
    document.querySelector("#orderDetailsContent");

const closeOrderDetails =
    document.querySelector("#closeOrderDetails");


ordersTableBody.addEventListener("click", (event) => {

    if (!event.target.classList.contains("view-order-button")) {
        return;
    }

    const orderId =
        event.target.dataset.orderId;

    showOrderDetails(orderId);

});


function showOrderDetails(orderId) {

    const viewButton =
        document.querySelector(
            `.view-order-button[data-order-id="${orderId}"]`
        );

    if (!viewButton) {
        return;
    }

    const orderRow =
        viewButton.closest("tr");

    const customerMessage =
        viewButton.dataset.message || "";

    const cells =
        orderRow.querySelectorAll("td");

    orderDetailsContent.innerHTML = `

        <div class="order-detail-grid">

            <div>
                <span>Customer</span>
                <strong>${cells[0].textContent}</strong>
            </div>

            <div>
                <span>Phone</span>
                <strong>${cells[1].textContent}</strong>
            </div>

            <div>
                <span>Variety</span>
                <strong>${cells[2].textContent}</strong>
            </div>

            <div>
                <span>Quantity</span>
                <strong>${cells[3].textContent}</strong>
            </div>

            <div>
                <span>Total</span>
                <strong>${cells[4].textContent}</strong>
            </div>

            <div>
                <span>Location</span>
                <strong>${cells[5].textContent}</strong>
            </div>

            <div>
                <span>Order Method</span>
                <strong>${cells[6].textContent}</strong>
            </div>

            <div>
                <span>Date</span>
                <strong>${cells[7].textContent}</strong>
            </div>

            <div>
                <span>Status</span>
                <strong>${cells[8].querySelector("select").value}</strong>
            </div>

            <div class="order-detail-message">
    <span>Customer Message</span>

    <strong>
        ${
            customerMessage
                ? customerMessage
                : "No additional message"
        }
    </strong>
</div>

        <div class="order-detail-actions">

    <button
        type="button"
        class="whatsapp-order-button"
        data-phone="${cells[1].textContent}"
        data-customer="${cells[0].textContent}"
        data-variety="${cells[2].textContent}"
    >
        WhatsApp Customer
    </button>

    <button
        type="button"
        class="call-order-button"
        data-phone="${cells[1].textContent}"
    >
        Call Customer
    </button>

</div>

    `;

    orderDetailsModal.hidden = false;

}


closeOrderDetails.addEventListener("click", () => {

    orderDetailsModal.hidden = true;

});

// ================================
// WHATSAPP CUSTOMER
// ================================

orderDetailsContent.addEventListener("click", (event) => {

    if (
        !event.target.classList.contains(
            "whatsapp-order-button"
        )
    ) {
        return;
    }

    const button = event.target;

    const customer =
        button.dataset.customer || "Customer";

    const variety =
        button.dataset.variety || "coffee seedlings";

    let phone =
        button.dataset.phone || "";

    // Remove spaces, brackets, dashes and other characters.
    phone = phone.replace(/\D/g, "");

    // Convert Kenyan local numbers to international format.
    if (phone.startsWith("0")) {
        phone = "254" + phone.substring(1);
    }

    if (!phone.startsWith("254")) {

        alert(
            "This customer does not have a valid Kenyan phone number."
        );

        return;
    }

    const message =
        `Hello ${customer}, this is Asili Coffee Nursery regarding your ${variety} seedling order.`;

    const whatsappURL =
        `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    window.open(
        whatsappURL,
        "_blank"
    );

});

// ================================
// CALL CUSTOMER
// ================================

orderDetailsContent.addEventListener("click", (event) => {

    if (
        !event.target.classList.contains(
            "call-order-button"
        )
    ) {
        return;
    }

    const button = event.target;

    let phone =
        button.dataset.phone || "";

    phone = phone.replace(/\D/g, "");

    if (phone.startsWith("0")) {
        phone = "254" + phone.substring(1);
    }

    if (!phone.startsWith("254")) {

        alert(
            "This customer does not have a valid Kenyan phone number."
        );

        return;
    }

    window.location.href =
        `tel:+${phone}`;

});