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

    // ================================
// INVENTORY ALERT THRESHOLDS
// ================================

const inventoryAlertThresholds = {

    "batian": 10000,

    "ruiru-11": 10000,

    "sl34": 5000,

    "sl28": 5000,

    "k7": 5000

};


// Check authentication

onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href =
            "login.html";

        return;

    }

    loadDashboardInventory();

    loadDashboardSales();

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


        const inventoryAlerts = [];


        inventorySnapshot.forEach((inventoryDocument) => {

            const inventory =
                inventoryDocument.data();

            const inventoryId =
    inventoryDocument.id;


const available =
    Number(
        inventory.available || 0
    );


const threshold =
    inventoryAlertThresholds[
        inventoryId
    ];


if (
    threshold !== undefined
) {

    if (available === 0) {

        inventoryAlerts.push({

            type: "out",

            variety:
                getDashboardVarietyName(
                    inventoryId
                ),

            available,

            threshold

        });

    } else if (
        available < threshold
    ) {

        inventoryAlerts.push({

            type: "low",

            variety:
                getDashboardVarietyName(
                    inventoryId
                ),

            available,

            threshold

        });

    }

}    


            totalAvailable +=
                Number(inventory.available || 0);

            totalReserved +=
                Number(inventory.reserved || 0);

            totalSold +=
                Number(inventory.sold || 0);

            totalProduction +=
                Number(inventory.production || 0);

            renderInventoryAlerts(
    inventoryAlerts
);

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

// ================================
// SALES OVERVIEW
// ================================

async function loadDashboardSales() {

    try {

        const ordersSnapshot =
            await getDocs(
                collection(db, "orders")
            );


        let totalRevenue = 0;
        let completedOrders = 0;
        let totalSeedlingsSold = 0;
        let pendingOrders = 0;
        let confirmedOrders = 0;
        let preparingOrders = 0;
        let readyOrders = 0;
        const recentOrders = [];
        const varietyPerformance = {};

let largestCompletedSale = 0;
let largestCompletedSaleCustomer = "";


        ordersSnapshot.forEach(
            (orderDocument) => {

                const order =
                    orderDocument.data();
                    
                    recentOrders.push({
    id: orderDocument.id,
    ...order
});


                const status =
                    String(
                        order.status || "pending"
                    )
                        .trim()
                        .toLowerCase();

                        switch (status) {

    case "pending":

        pendingOrders += 1;

        break;


    case "confirmed":

        confirmedOrders += 1;

        break;


    case "preparing":

        preparingOrders += 1;

        break;


    case "ready":

        readyOrders += 1;

        break;

}


                /*
                    Only completed orders
                    count as realized sales.
                */

                if (
                    status !== "completed"
                ) {
                    return;
                }

                const varietyId =
    String(
        order.variety || ""
    )
        .trim()
        .toLowerCase();

const quantity =
    Number(
        order.quantity || 0
    );

const orderTotal =
    Number(
        order.total || 0
    );


if (!varietyPerformance[varietyId]) {

    varietyPerformance[varietyId] = {
        quantity: 0,
        revenue: 0
    };

}


varietyPerformance[varietyId].quantity +=
    quantity;

varietyPerformance[varietyId].revenue +=
    orderTotal;


if (
    orderTotal >
    largestCompletedSale
) {

    largestCompletedSale =
        orderTotal;

    largestCompletedSaleCustomer =
        order.customerName || "";

}


                totalRevenue +=
                    Number(
                        order.total || 0
                    );



                totalSeedlingsSold +=
                    Number(
                        order.quantity || 0
                    );


                completedOrders += 1;

            }
        );


        document.querySelector(
            "#dashboardSalesRevenue"
        ).textContent =
            `KSh ${totalRevenue.toLocaleString()}`;


        document.querySelector(
            "#dashboardCompletedOrders"
        ).textContent =
            completedOrders.toLocaleString();


        document.querySelector(
            "#dashboardSalesSeedlings"
        ).textContent =
            totalSeedlingsSold.toLocaleString();

        document.querySelector(
    "#dashboardPendingOrders"
).textContent =
    pendingOrders.toLocaleString();


document.querySelector(
    "#dashboardConfirmedOrders"
).textContent =
    confirmedOrders.toLocaleString();


document.querySelector(
    "#dashboardPreparingOrders"
).textContent =
    preparingOrders.toLocaleString();


document.querySelector(
    "#dashboardReadyOrders"
).textContent =
    readyOrders.toLocaleString();   
    
    renderRecentOrders(recentOrders);

    renderBusinessPerformance({
    varietyPerformance,
    totalRevenue,
    completedOrders,
    largestCompletedSale,
    largestCompletedSaleCustomer
});


    } catch (error) {

        console.error(
            "Unable to load dashboard sales:",
            error
        );

    }

}

// ================================
// RENDER INVENTORY ALERTS
// ================================

function renderInventoryAlerts(
    alerts
) {

    const alertsContainer =
        document.querySelector(
            "#inventoryAlerts"
        );


    if (!alertsContainer) {
        return;
    }


    if (alerts.length === 0) {

        alertsContainer.innerHTML = `

            <div class="inventory-alert healthy">

                All stock levels are healthy.

            </div>

        `;

        return;
    }


    alerts.sort(
        (a, b) => {

            if (
                a.type === "out" &&
                b.type !== "out"
            ) {
                return -1;
            }


            if (
                b.type === "out" &&
                a.type !== "out"
            ) {
                return 1;
            }


            return (
                a.available -
                b.available
            );

        }
    );


    alertsContainer.innerHTML =
        alerts.map(
            (alert) => {

                if (
                    alert.type === "out"
                ) {

                    return `

                        <div class="inventory-alert out">

                            <strong>
                                ${alert.variety} — Out of Stock
                            </strong>

                            <p>
                                0 seedlings currently available.
                            </p>

                            <a
    href="inventory.html"
    class="inventory-alert-action"
>
    Manage Inventory
</a>

                        </div>

                    `;

                }


                return `

                    <div class="inventory-alert low">

                        <strong>
                            ${alert.variety} — Low Stock
                        </strong>

                        <p>
                            ${alert.available.toLocaleString()}
                            available.
                            Recommended minimum:
                            ${alert.threshold.toLocaleString()}.
                        </p>

                        <a
    href="inventory.html"
    class="inventory-alert-action"
>
    Manage Inventory
</a>

                    </div>

                `;

            }
        )
        .join("");

}



// ================================
// DASHBOARD VARIETY NAME
// ================================

function getDashboardVarietyName(
    inventoryId
) {

    const names = {

        "batian":
            "Batian",

        "ruiru-11":
            "Ruiru 11",

        "sl34":
            "SL34",

        "sl28":
            "SL28",

        "k7":
            "K7"

    };


    return (
        names[inventoryId] ||
        inventoryId
    );

}

// ================================
// RECENT ORDERS
// ================================

function renderRecentOrders(
    orders
) {

    const recentOrdersContainer =
        document.querySelector(
            "#dashboardRecentOrders"
        );

    if (!recentOrdersContainer) {
        return;
    }


    const sortedOrders = [
        ...orders
    ].sort(
        (a, b) => {

            const aTime =
                getDashboardOrderTime(a);

            const bTime =
                getDashboardOrderTime(b);

            return bTime - aTime;
        }
    );


    const latestOrders =
        sortedOrders.slice(0, 5);


    if (latestOrders.length === 0) {

        recentOrdersContainer.innerHTML = `
            <tr class="recent-orders-loading">
                <td colspan="6">
                    No orders yet.
                </td>
            </tr>
        `;

        return;
    }


    recentOrdersContainer.innerHTML =
        latestOrders.map(
            (order) => {

                const customer =
                    order.customerName ||
                    "-";

                const variety =
                    getDashboardVarietyName(
                        order.variety || ""
                    );

                const quantity =
                    Number(
                        order.quantity || 0
                    );

                const total =
                    Number(
                        order.total || 0
                    );

                const status =
                    String(
                        order.status || "pending"
                    )
                        .trim()
                        .toLowerCase();

                const date =
                    formatDashboardOrderDate(
                        order
                    );


                return `
                    <tr>

                        <td>
                            <strong>
                                ${escapeDashboardText(customer)}
                            </strong>
                        </td>

                        <td>
                            ${escapeDashboardText(variety)}
                        </td>

                        <td>
                            ${quantity.toLocaleString()}
                        </td>

                        <td>
                            KSh ${total.toLocaleString()}
                        </td>

                        <td>
                            <span
                                class="recent-status ${status}"
                            >
                                ${escapeDashboardText(status)}
                            </span>
                        </td>

                        <td>
                            ${escapeDashboardText(date)}
                        </td>

                    </tr>
                `;

            }
        )
            .join("");

}



// ================================
// RECENT ORDER DATE
// ================================

function getDashboardOrderTime(
    order
) {

    const timestamp =
        order.createdAt;

    if (
        timestamp &&
        typeof timestamp.toDate === "function"
    ) {

        return timestamp
            .toDate()
            .getTime();

    }

    return 0;

}


function formatDashboardOrderDate(
    order
) {

    const timestamp =
        order.createdAt;

    if (
        !timestamp ||
        typeof timestamp.toDate !== "function"
    ) {

        return "-";

    }


    return timestamp
        .toDate()
        .toLocaleString(
            undefined,
            {
                dateStyle: "medium",
                timeStyle: "short"
            }
        );

}



// ================================
// SAFE DASHBOARD TEXT
// ================================

function escapeDashboardText(
    value
) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}

// ================================
// BUSINESS PERFORMANCE
// ================================

function renderBusinessPerformance(
    performance
) {

    const {
        varietyPerformance,
        totalRevenue,
        completedOrders,
        largestCompletedSale,
        largestCompletedSaleCustomer
    } = performance;


    let topSellingVariety = "";
    let topSellingQuantity = 0;

    let topRevenueVariety = "";
    let topVarietyRevenue = 0;


    Object.entries(
        varietyPerformance
    ).forEach(
        ([varietyId, data]) => {

            if (
                data.quantity >
                topSellingQuantity
            ) {

                topSellingQuantity =
                    data.quantity;

                topSellingVariety =
                    varietyId;

            }


            if (
                data.revenue >
                topVarietyRevenue
            ) {

                topVarietyRevenue =
                    data.revenue;

                topRevenueVariety =
                    varietyId;

            }

        }
    );


    const averageOrderValue =
        completedOrders > 0
            ? totalRevenue /
                completedOrders
            : 0;


    const topVarietyElement =
        document.querySelector(
            "#dashboardTopVariety"
        );

    const topVarietyDetailElement =
        document.querySelector(
            "#dashboardTopVarietyDetail"
        );

    const topRevenueElement =
        document.querySelector(
            "#dashboardTopRevenueVariety"
        );

    const topRevenueDetailElement =
        document.querySelector(
            "#dashboardTopRevenueDetail"
        );

    const averageOrderElement =
        document.querySelector(
            "#dashboardAverageOrderValue"
        );

    const largestSaleElement =
        document.querySelector(
            "#dashboardLargestSale"
        );

    const largestSaleDetailElement =
        document.querySelector(
            "#dashboardLargestSaleDetail"
        );


    if (
        topVarietyElement &&
        topVarietyDetailElement
    ) {

        if (topSellingVariety) {

            topVarietyElement.textContent =
                getDashboardVarietyName(
                    topSellingVariety
                );

            topVarietyDetailElement.textContent =
                `${topSellingQuantity.toLocaleString()} seedlings sold`;

        } else {

            topVarietyElement.textContent =
                "—";

            topVarietyDetailElement.textContent =
                "No completed sales yet";

        }

    }


    if (
        topRevenueElement &&
        topRevenueDetailElement
    ) {

        if (topRevenueVariety) {

            topRevenueElement.textContent =
                getDashboardVarietyName(
                    topRevenueVariety
                );

            topRevenueDetailElement.textContent =
                `KSh ${topVarietyRevenue.toLocaleString()} revenue`;

        } else {

            topRevenueElement.textContent =
                "—";

            topRevenueDetailElement.textContent =
                "No completed sales yet";

        }

    }


    if (averageOrderElement) {

        averageOrderElement.textContent =
            `KSh ${Math.round(
                averageOrderValue
            ).toLocaleString()}`;

    }


    if (largestSaleElement) {

        largestSaleElement.textContent =
            `KSh ${largestCompletedSale.toLocaleString()}`;

    }


    if (largestSaleDetailElement) {

        largestSaleDetailElement.textContent =
            largestCompletedSale > 0
                ? (
                    largestCompletedSaleCustomer
                        ? `Customer: ${largestCompletedSaleCustomer}`
                        : "Completed order"
                )
                : "No completed sales yet";

    }

}