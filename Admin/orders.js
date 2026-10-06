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
    updateDoc,
    getDoc,
    runTransaction,
    serverTimestamp
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

const confirmedOrders =
    document.querySelector("#confirmedOrders");

const preparingOrders =
    document.querySelector("#preparingOrders");

const readyOrders =
    document.querySelector("#readyOrders");

const completedOrders =
    document.querySelector("#completedOrders");

const cancelledOrders =
    document.querySelector("#cancelledOrders");

const orderValue =
    document.querySelector("#orderValue");

const logoutButton =
    document.querySelector("#logoutButton");

const orderSearch =
    document.querySelector("#orderSearch");

const orderStatusFilter =
    document.querySelector("#orderStatusFilter");

const orderSort =
    document.querySelector("#orderSort");

const summaryFilterCards =
    document.querySelectorAll(".summary-filter-card");

let loadedOrders = [];


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

        loadedOrders = [];

        ordersSnapshot.forEach((orderDocument) => {

            loadedOrders.push({
                id: orderDocument.id,
                ...orderDocument.data()
            });

        });

        renderOrders();

    } catch (error) {

        console.error(
            "Error loading orders:",
            error
        );

        ordersTableBody.innerHTML = `
            <tr>
                <td
                    colspan="10"
                    class="empty-message"
                >
                    Unable to load orders.
                </td>
            </tr>
        `;

    }

}


// ================================
// RENDER ORDERS
// ================================

function renderOrders() {

    const searchTerm =
        orderSearch.value
            .trim()
            .toLowerCase();

    const selectedStatus =
        orderStatusFilter.value;


    const filteredOrders =
        loadedOrders.filter((order) => {

            const status =
                String(order.status || "pending")
                    .toLowerCase();


            const matchesStatus =
                selectedStatus === "all" ||
                status === selectedStatus;


            const searchableText = [
                order.customerName,
                order.phone,
                order.variety,
                order.location
            ]
                .map((value) =>
                    String(value || "").toLowerCase()
                )
                .join(" ");


            const matchesSearch =
                searchableText.includes(searchTerm);


            return (
                matchesStatus &&
                matchesSearch
            );

        });


    const sortOption =
        orderSort.value;


    filteredOrders.sort((a, b) => {

        const aTotal =
            Number(a.total || 0);

        const bTotal =
            Number(b.total || 0);

        const aQuantity =
            Number(a.quantity || 0);

        const bQuantity =
            Number(b.quantity || 0);

        const aDate =
            a.createdAt
                ? a.createdAt.toMillis()
                : 0;

        const bDate =
            b.createdAt
                ? b.createdAt.toMillis()
                : 0;


        switch (sortOption) {

            case "oldest":
                return aDate - bDate;

            case "highest-value":
                return bTotal - aTotal;

            case "lowest-value":
                return aTotal - bTotal;

            case "largest-quantity":
                return bQuantity - aQuantity;

            case "smallest-quantity":
                return aQuantity - bQuantity;

            case "newest":
            default:
                return bDate - aDate;

        }

    });


    ordersTableBody.innerHTML = "";


    if (filteredOrders.length === 0) {

        ordersTableBody.innerHTML = `
            <tr>
                <td
                    colspan="10"
                    class="empty-message"
                >
                    No matching orders found.
                </td>
            </tr>
        `;

        updateSummary();
        updateActiveSummaryCard();

        return;

    }


    filteredOrders.forEach((order) => {

        const quantity =
            Number(order.quantity || 0);

        const total =
            Number(order.total || 0);

        const status =
            String(order.status || "pending")
                .toLowerCase();


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

                <select
    class="status-select"
    data-order-id="${order.id}"
    ${status === "completed" || status === "cancelled" ? "disabled" : ""}
>

    <option
        value="${status}"
        selected
    >
        ${
            status === "pending"
                ? "Pending"
                : status === "confirmed"
                ? "Confirmed"
                : status === "preparing"
                ? "Preparing"
                : status === "ready"
                ? "Ready"
                : status === "completed"
                ? "Completed"
                : status === "cancelled"
                ? "Cancelled"
                : status
        }
    </option>

    ${
        status === "pending"
            ? `
                <option value="confirmed">
                    Confirmed
                </option>

                <option value="cancelled">
                    Cancelled
                </option>
            `
            : ""
    }

    ${
        status === "confirmed"
            ? `
                <option value="preparing">
                    Preparing
                </option>

                <option value="cancelled">
                    Cancelled
                </option>
            `
            : ""
    }

    ${
        status === "preparing"
            ? `
                <option value="ready">
                    Ready
                </option>

                <option value="cancelled">
                    Cancelled
                </option>
            `
            : ""
    }

    ${
        status === "ready"
            ? `
                <option value="completed">
                    Completed
                </option>

                <option value="cancelled">
                    Cancelled
                </option>
            `
            : ""
    }

</select>
            </td>

            <td>

                <button
                    class="view-order-button"
                    data-order-id="${order.id}"
                    data-message="${String(order.additionalMessage || "")
                        .replace(/"/g, "&quot;")}"
                >
                    View
                </button>

            </td>
        `;


        ordersTableBody.appendChild(row);

    });


    updateSummary();
    updateActiveSummaryCard();

}


// ================================
// UPDATE SUMMARY
// ================================

function updateSummary() {

    const counts = {

        pending: 0,
        confirmed: 0,
        preparing: 0,
        ready: 0,
        completed: 0,
        cancelled: 0

    };


    let totalOrderValue = 0;


    loadedOrders.forEach((order) => {

        const status =
            String(order.status || "pending")
                .toLowerCase();


        if (
            Object.prototype.hasOwnProperty.call(
                counts,
                status
            )
        ) {

            counts[status] += 1;

        }


        totalOrderValue +=
            Number(order.total || 0);

    });


    totalOrders.textContent =
        loadedOrders.length.toLocaleString();

    pendingOrders.textContent =
        counts.pending.toLocaleString();

    confirmedOrders.textContent =
        counts.confirmed.toLocaleString();

    preparingOrders.textContent =
        counts.preparing.toLocaleString();

    readyOrders.textContent =
        counts.ready.toLocaleString();

    completedOrders.textContent =
        counts.completed.toLocaleString();

    cancelledOrders.textContent =
        counts.cancelled.toLocaleString();

    orderValue.textContent =
        `KSh ${totalOrderValue.toLocaleString()}`;

}


// ================================
// ACTIVE SUMMARY CARD
// ================================

function updateActiveSummaryCard() {

    const selectedStatus =
        orderStatusFilter.value;


    summaryFilterCards.forEach((card) => {

        card.classList.toggle(
            "active",
            card.dataset.statusFilter ===
                selectedStatus
        );

    });

}


// ================================
// SEARCH
// ================================

orderSearch.addEventListener(
    "input",
    renderOrders
);


// ================================
// STATUS FILTER
// ================================

orderStatusFilter.addEventListener(
    "change",
    renderOrders
);


// ================================
// SORT
// ================================

orderSort.addEventListener(
    "change",
    renderOrders
);


// ================================
// SUMMARY CARD FILTERS
// ================================

summaryFilterCards.forEach((card) => {

    card.addEventListener(
        "click",
        () => {

            const status =
                card.dataset.statusFilter;


            orderStatusFilter.value =
                status;


            renderOrders();

        }
    );

});


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

        await updateInventoryForOrder(
            orderId,
            newStatus
        );

        await loadOrders();

        console.log(
            `Order ${orderId} updated to ${newStatus}`
        );

    } catch (error) {

        console.error(
            "Unable to update order status:",
            error
        );

        alert(
    error.message ||
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


// ================================
// UPDATE INVENTORY FOR ORDER
// ================================

async function updateInventoryForOrder(
    orderId,
    newStatus
) {

    newStatus =
        String(newStatus)
            .trim()
            .toLowerCase();

    const orderReference =
        doc(db, "orders", orderId);


    await runTransaction(
        db,
        async (transaction) => {

            const orderSnapshot =
                await transaction.get(
                    orderReference
                );


            if (!orderSnapshot.exists()) {

                throw new Error(
                    "Order does not exist."
                );

            }


            const order =
                orderSnapshot.data();


            const quantity =
                Number(order.quantity || 0);


            if (quantity <= 0) {

                throw new Error(
                    "Invalid order quantity."
                );

            }


            const inventoryId =
                getInventoryId(
                    order.variety
                );


            if (!inventoryId) {

                throw new Error(
                    `No inventory record found for ${order.variety}.`
                );

            }


            const inventoryReference =
                doc(
                    db,
                    "inventory",
                    inventoryId
                );


            const inventorySnapshot =
                await transaction.get(
                    inventoryReference
                );


            if (!inventorySnapshot.exists()) {

                throw new Error(
                    "Inventory record does not exist."
                );

            }


            const inventory =
                inventorySnapshot.data();


            const available =
                Number(inventory.available || 0);

            const reserved =
                Number(inventory.reserved || 0);

            const sold =
                Number(inventory.sold || 0);


            const currentStatus =
                String(order.status || "pending")
                    .trim()
                    .toLowerCase();


            // ================================
            // VALIDATE STATUS TRANSITION
            // ================================

            const allowedTransitions = {

                pending: [
                    "confirmed",
                    "cancelled"
                ],

                confirmed: [
                    "preparing",
                    "cancelled"
                ],

                preparing: [
                    "ready",
                    "cancelled"
                ],

                ready: [
                    "completed",
                    "cancelled"
                ],

                completed: [],

                cancelled: []

            };


            if (newStatus === currentStatus) {
                return;
            }


            const allowedNextStatuses =
                allowedTransitions[currentStatus] || [];


            if (!allowedNextStatuses.includes(newStatus)) {

                throw new Error(
                    `Invalid order status change: ${currentStatus} → ${newStatus}.`
                );

            }


            // ================================
            // CONFIRMED
            // ================================

            if (
                newStatus === "confirmed" &&
                currentStatus === "pending"
            ) {

                if (available < quantity) {

                    throw new Error(
                        `Not enough ${order.variety} stock available.`
                    );

                }


                transaction.update(
                    inventoryReference,
                    {
                        available:
                            available - quantity,

                        reserved:
                            reserved + quantity
                    }
                );

            }


            // ================================
            // COMPLETED
            // ================================

            if (
                newStatus === "completed" &&
                currentStatus === "ready"
            ) {

                if (reserved < quantity) {

                    throw new Error(
                        "Reserved inventory is insufficient."
                    );

                }


                transaction.update(
                    inventoryReference,
                    {
                        reserved:
                            reserved - quantity,

                        sold:
                            sold + quantity
                    }
                );

            }


            // ================================
            // CANCELLED
            // ================================

            if (
                newStatus === "cancelled" &&
                (
                    currentStatus === "confirmed" ||
                    currentStatus === "preparing" ||
                    currentStatus === "ready"
                )
            ) {

                if (reserved < quantity) {

                    throw new Error(
                        "Reserved inventory is insufficient."
                    );

                }


                transaction.update(
                    inventoryReference,
                    {
                        reserved:
                            reserved - quantity,

                        available:
                            available + quantity
                    }
                );

            }


            const orderUpdate = {
    status: newStatus
};


if (
    newStatus === "completed" &&
    currentStatus === "ready"
) {

    orderUpdate.completedAt =
        serverTimestamp();

}


transaction.update(
    orderReference,
    orderUpdate
);
        }
    );

}


function getInventoryId(variety) {

    const normalized =
        String(variety || "")
            .trim()
            .toLowerCase();


    const inventoryMap = {

        "batian":
            "batian",

        "ruiru 11":
            "ruiru-11",

        "ruiru-11":
            "ruiru-11",

        "sl34":
            "sl34",

        "sl28":
            "sl28",

        "k7":
            "k7"

    };


    return inventoryMap[normalized] || null;

}