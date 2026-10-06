// ================================
// ASILI COFFEE NURSERY
// ADMIN SALES
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

const salesRevenue =
    document.querySelector("#salesRevenue");

const seedlingsSold =
    document.querySelector("#seedlingsSold");

const completedSalesOrders =
    document.querySelector("#completedSalesOrders");

const averageOrderValue =
    document.querySelector("#averageOrderValue");

const varietySalesGrid =
    document.querySelector("#varietySalesGrid");

const recentSalesTableBody =
    document.querySelector("#recentSalesTableBody");

const salesTrendCanvas =
    document.querySelector("#salesTrendChart");


let salesTrendChart = null;

const logoutButton =
    document.querySelector("#logoutButton");



let completedOrders = [];

let filteredSalesOrders = [];

let selectedSalesPeriod =
    "all";


const salesPeriodButtons =
    document.querySelectorAll(
        ".sales-period-button"
    );



// ================================
// AUTHENTICATION CHECK
// ================================

onAuthStateChanged(
    auth,
    (user) => {

        if (!user) {

            window.location.href =
                "login.html";

            return;
        }


        loadSales();

    }
);



// ================================
// LOAD SALES
// ================================

async function loadSales() {

    try {

        const ordersSnapshot =
            await getDocs(
                collection(db, "orders")
            );


        completedOrders = [];


        ordersSnapshot.forEach(
            (orderDocument) => {

                const order =
                    orderDocument.data();


                const status =
                    String(
                        order.status || "pending"
                    )
                        .trim()
                        .toLowerCase();


                /*
                    Only completed orders
                    count as realized sales.
                */

                if (status !== "completed") {
                    return;
                }


                completedOrders.push({

                    id:
                        orderDocument.id,

                    ...order

                });

            }
        );


        /*
            Newest completed sales first.
        */

        completedOrders.sort(
    (a, b) => {

        const aTimestamp =
            a.completedAt ||
            a.createdAt;


        const bTimestamp =
            b.completedAt ||
            b.createdAt;


        const aDate =
            aTimestamp
                ? aTimestamp.toMillis()
                : 0;


        const bDate =
            bTimestamp
                ? bTimestamp.toMillis()
                : 0;


        return bDate - aDate;

    }
);


       applySalesPeriodFilter();

    } catch (error) {

        console.error(
            "Unable to load sales:",
            error
        );


        recentSalesTableBody.innerHTML = `
            <tr>

                <td
                    colspan="8"
                    class="empty-state"
                >
                    Unable to load sales information.
                </td>

            </tr>
        `;

    }

}

// ================================
// SALES PERIOD FILTER
// ================================

function applySalesPeriodFilter() {

    const now =
        new Date();


    filteredSalesOrders =
        completedOrders.filter(
            (order) => {

                if (
                    selectedSalesPeriod ===
                    "all"
                ) {
                    return true;
                }


                const timestamp =
                    order.completedAt ||
                    order.createdAt;


                if (!timestamp) {
                    return false;
                }


                const saleDate =
                    timestamp.toDate();


                switch (
                    selectedSalesPeriod
                ) {

                    case "today":
                        return isSameDay(
                            saleDate,
                            now
                        );


                    case "week":
                        return isThisWeek(
                            saleDate,
                            now
                        );


                    case "month":
                        return (
                            saleDate.getFullYear() ===
                                now.getFullYear() &&
                            saleDate.getMonth() ===
                                now.getMonth()
                        );


                    case "year":
                        return (
                            saleDate.getFullYear() ===
                            now.getFullYear()
                        );


                    default:
                        return true;

                }

            }
        );


    updateSalesSummary();

    renderVarietySales();

    renderRecentSales();

    renderSalesTrend();

    renderSalesInsights();

}



// ================================
// SAME DAY
// ================================

function isSameDay(
    date,
    comparisonDate
) {

    return (
        date.getFullYear() ===
            comparisonDate.getFullYear() &&

        date.getMonth() ===
            comparisonDate.getMonth() &&

        date.getDate() ===
            comparisonDate.getDate()
    );

}



// ================================
// THIS WEEK
// Monday → Sunday
// ================================

function isThisWeek(
    date,
    comparisonDate
) {

    const startOfWeek =
        new Date(comparisonDate);


    const day =
        startOfWeek.getDay();


    const daysSinceMonday =
        day === 0
            ? 6
            : day - 1;


    startOfWeek.setDate(
        startOfWeek.getDate() -
        daysSinceMonday
    );


    startOfWeek.setHours(
        0,
        0,
        0,
        0
    );


    const endOfWeek =
        new Date(startOfWeek);


    endOfWeek.setDate(
        endOfWeek.getDate() + 7
    );


    return (
        date >= startOfWeek &&
        date < endOfWeek
    );

}

// ================================
// SALES TREND
// ================================

function renderSalesTrend() {

    if (!salesTrendCanvas) {
        return;
    }


    const groupedSales =
        new Map();


    filteredSalesOrders.forEach(
        (order) => {

            const timestamp =
                order.completedAt ||
                order.createdAt;


            if (!timestamp) {
                return;
            }


            const saleDate =
                timestamp.toDate();


            const group =
                getSalesTrendGroup(
                    saleDate
                );


            const currentRevenue =
                groupedSales.get(
                    group.key
                ) || 0;


            groupedSales.set(
                group.key,
                currentRevenue +
                Number(order.total || 0)
            );

        }
    );


    const trendData =
        Array.from(
            groupedSales.entries()
        )
            .map(
                ([key, revenue]) => {

                    return {
                        key,
                        revenue
                    };

                }
            )
            .sort(
                (a, b) =>
                    a.key.localeCompare(
                        b.key
                    )
            );


    const labels =
        trendData.map(
            (item) =>
                formatSalesTrendLabel(
                    item.key
                )
        );


    const revenueData =
        trendData.map(
            (item) =>
                item.revenue
        );


    if (salesTrendChart) {

        salesTrendChart.destroy();

    }


    salesTrendChart =
        new Chart(
            salesTrendCanvas,
            {

                type: "line",


                data: {

                    labels,

                    datasets: [

                        {

                            label:
                                "Revenue (KSh)",

                            data:
                                revenueData,

                            borderWidth:
                                3,

                            tension:
                                0.3,

                            fill:
                                false

                        }

                    ]

                },


                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,


                    interaction: {

                        intersect:
                            false,

                        mode:
                            "index"

                    },


                    plugins: {

                        legend: {

                            display:
                                true

                        },


                        tooltip: {

                            callbacks: {

                                label:
                                    function (
                                        context
                                    ) {

                                        return (
                                            "Revenue: KSh " +
                                            formatNumber(
                                                context.raw
                                            )
                                        );

                                    }

                            }

                        }

                    },


                    scales: {

                        y: {

                            beginAtZero:
                                true,

                            ticks: {

                                callback:
                                    function (
                                        value
                                    ) {

                                        return (
                                            "KSh " +
                                            formatNumber(
                                                value
                                            )
                                        );

                                    }

                            }

                        }

                    }

                }

            }
        );

}



// ================================
// SALES TREND GROUP
// ================================

function getSalesTrendGroup(
    date
) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    const hour =
        String(
            date.getHours()
        ).padStart(
            2,
            "0"
        );


    if (
        selectedSalesPeriod ===
        "today"
    ) {

        return {
            key:
                `${year}-${month}-${day}-${hour}`
        };

    }


    if (
        selectedSalesPeriod ===
        "week" ||

        selectedSalesPeriod ===
        "month"
    ) {

        return {
            key:
                `${year}-${month}-${day}`
        };

    }


    return {
        key:
            `${year}-${month}`
    };

}



// ================================
// SALES TREND LABEL
// ================================

function formatSalesTrendLabel(
    key
) {

    const parts =
        key.split("-");


    /*
        TODAY
        YYYY-MM-DD-HH
    */

    if (
        selectedSalesPeriod ===
        "today"
    ) {

        const hour =
            Number(parts[3]);


        const date =
            new Date(
                Number(parts[0]),
                Number(parts[1]) - 1,
                Number(parts[2]),
                hour
            );


        return date.toLocaleTimeString(
            [],
            {
                hour: "numeric"
            }
        );

    }


    /*
        WEEK / MONTH
        YYYY-MM-DD
    */

    if (
        selectedSalesPeriod ===
            "week" ||

        selectedSalesPeriod ===
            "month"
    ) {

        const date =
            new Date(
                Number(parts[0]),
                Number(parts[1]) - 1,
                Number(parts[2])
            );


        if (
            selectedSalesPeriod ===
            "week"
        ) {

            return date.toLocaleDateString(
                [],
                {
                    weekday:
                        "short"
                }
            );

        }


        return date.toLocaleDateString(
            [],
            {
                day:
                    "numeric",

                month:
                    "short"
            }
        );

    }


    /*
        YEAR / ALL TIME
        YYYY-MM
    */

    const date =
        new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            1
        );


    if (
        selectedSalesPeriod ===
        "year"
    ) {

        return date.toLocaleDateString(
            [],
            {
                month:
                    "short"
            }
        );

    }


    return date.toLocaleDateString(
        [],
        {
            month:
                "short",

            year:
                "numeric"
        }
    );

}

// ================================
// SALES PERFORMANCE INSIGHTS
// ================================

function renderSalesInsights() {

    if (filteredSalesOrders.length === 0) {

        topSellingVariety.textContent =
            "-";

        topSellingVarietyDetails.textContent =
            "No sales data";


        topRevenueVariety.textContent =
            "-";

        topRevenueVarietyDetails.textContent =
            "No sales data";


        largestSale.textContent =
            "KSh 0";

        largestSaleDetails.textContent =
            "No sales data";


        topSalesCustomer.textContent =
            "-";

        topSalesCustomerDetails.textContent =
            "No sales data";


        return;
    }


    const varietyPerformance =
        new Map();


    const customerPerformance =
        new Map();


    let largestOrder = null;



    filteredSalesOrders.forEach(
        (order) => {

            const quantity =
                Number(
                    order.quantity || 0
                );


            const revenue =
                Number(
                    order.total || 0
                );


            // ================================
            // VARIETY PERFORMANCE
            // ================================

            const varietyId =
                getVarietyId(
                    order.variety
                );


            if (varietyId) {

                if (
                    !varietyPerformance.has(
                        varietyId
                    )
                ) {

                    varietyPerformance.set(
                        varietyId,
                        {
                            name:
                                getVarietyName(
                                    varietyId
                                ),

                            quantity:
                                0,

                            revenue:
                                0
                        }
                    );

                }


                const variety =
                    varietyPerformance.get(
                        varietyId
                    );


                variety.quantity +=
                    quantity;


                variety.revenue +=
                    revenue;

            }



            // ================================
            // CUSTOMER PERFORMANCE
            // ================================

            const customerPhone =
                normalizeSalesPhone(
                    order.phone
                );


            if (customerPhone) {

                if (
                    !customerPerformance.has(
                        customerPhone
                    )
                ) {

                    customerPerformance.set(
                        customerPhone,
                        {
                            name:
                                order.customerName ||
                                "Customer",

                            revenue:
                                0,

                            orders:
                                0
                        }
                    );

                }


                const customer =
                    customerPerformance.get(
                        customerPhone
                    );


                customer.revenue +=
                    revenue;


                customer.orders +=
                    1;

            }



            // ================================
            // LARGEST SALE
            // ================================

            if (
                !largestOrder ||
                revenue >
                    Number(
                        largestOrder.total || 0
                    )
            ) {

                largestOrder =
                    order;

            }

        }
    );



    const varieties =
        Array.from(
            varietyPerformance.values()
        );


    const bestQuantityVariety =
        [...varieties].sort(
            (a, b) =>
                b.quantity -
                a.quantity
        )[0];


    const bestRevenueVariety =
        [...varieties].sort(
            (a, b) =>
                b.revenue -
                a.revenue
        )[0];



    if (bestQuantityVariety) {

        topSellingVariety.textContent =
            bestQuantityVariety.name;


        topSellingVarietyDetails.textContent =
            `${formatNumber(
                bestQuantityVariety.quantity
            )} seedlings sold`;

    }



    if (bestRevenueVariety) {

        topRevenueVariety.textContent =
            bestRevenueVariety.name;


        topRevenueVarietyDetails.textContent =
            `KSh ${formatNumber(
                bestRevenueVariety.revenue
            )} revenue`;

    }



    if (largestOrder) {

        largestSale.textContent =
            `KSh ${formatNumber(
                largestOrder.total
            )}`;


        largestSaleDetails.textContent =
            `${
                largestOrder.customerName ||
                "Customer"
            } — ${
                largestOrder.variety ||
                "-"
            }`;

    }



    const topCustomer =
        Array.from(
            customerPerformance.values()
        )
            .sort(
                (a, b) =>
                    b.revenue -
                    a.revenue
            )[0];


    if (topCustomer) {

        topSalesCustomer.textContent =
            topCustomer.name;


        topSalesCustomerDetails.textContent =
            `KSh ${formatNumber(
                topCustomer.revenue
            )} from ${
                topCustomer.orders
            } completed ${
                topCustomer.orders === 1
                    ? "order"
                    : "orders"
            }`;

    }

}



// ================================
// SALES SUMMARY
// ================================

function updateSalesSummary() {

    let totalRevenue = 0;

    let totalSeedlings = 0;


    filteredSalesOrders.forEach(
        (order) => {

            totalRevenue +=
                Number(
                    order.total || 0
                );


            totalSeedlings +=
                Number(
                    order.quantity || 0
                );

        }
    );


    const completedCount =
    filteredSalesOrders.length;


    const averageValue =
        completedCount > 0
            ? totalRevenue / completedCount
            : 0;


    salesRevenue.textContent =
        `KSh ${formatNumber(totalRevenue)}`;


    seedlingsSold.textContent =
        formatNumber(totalSeedlings);


    completedSalesOrders.textContent =
        completedCount.toLocaleString();


    averageOrderValue.textContent =
        `KSh ${formatNumber(
            Math.round(averageValue)
        )}`;

        const topSellingVariety =
    document.querySelector(
        "#topSellingVariety"
    );

const topSellingVarietyDetails =
    document.querySelector(
        "#topSellingVarietyDetails"
    );

const topRevenueVariety =
    document.querySelector(
        "#topRevenueVariety"
    );

const topRevenueVarietyDetails =
    document.querySelector(
        "#topRevenueVarietyDetails"
    );

const largestSale =
    document.querySelector(
        "#largestSale"
    );

const largestSaleDetails =
    document.querySelector(
        "#largestSaleDetails"
    );

const topSalesCustomer =
    document.querySelector(
        "#topSalesCustomer"
    );

const topSalesCustomerDetails =
    document.querySelector(
        "#topSalesCustomerDetails"
    );

}





// ================================
// SALES BY VARIETY
// ================================

function renderVarietySales() {

    const varieties = {

        "batian": {
            name: "Batian",
            quantity: 0,
            revenue: 0,
            orders: 0
        },

        "ruiru-11": {
            name: "Ruiru 11",
            quantity: 0,
            revenue: 0,
            orders: 0
        },

        "sl34": {
            name: "SL34",
            quantity: 0,
            revenue: 0,
            orders: 0
        },

        "sl28": {
            name: "SL28",
            quantity: 0,
            revenue: 0,
            orders: 0
        },

        "k7": {
            name: "K7",
            quantity: 0,
            revenue: 0,
            orders: 0
        }

    };


    filteredSalesOrders.forEach(
        (order) => {

            const varietyId =
                getVarietyId(
                    order.variety
                );

                function getVarietyName(
    varietyId
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
        names[varietyId] ||
        varietyId
    );

}


function normalizeSalesPhone(
    phone
) {

    let normalized =
        String(phone || "")
            .replace(/\D/g, "");


    if (
        normalized.startsWith("0")
    ) {

        normalized =
            "254" +
            normalized.substring(1);

    }


    if (
        normalized.length === 9 &&
        (
            normalized.startsWith("7") ||
            normalized.startsWith("1")
        )
    ) {

        normalized =
            "254" +
            normalized;

    }


    return normalized;

}


            if (
                !varietyId ||
                !varieties[varietyId]
            ) {
                return;
            }


            varieties[varietyId].quantity +=
                Number(
                    order.quantity || 0
                );


            varieties[varietyId].revenue +=
                Number(
                    order.total || 0
                );


            varieties[varietyId].orders += 1;

        }
    );


    varietySalesGrid.innerHTML =
        "";


    Object.values(varieties).forEach(
        (variety) => {

            const card =
                document.createElement("div");


            card.className =
                "variety-card";


            card.innerHTML = `

                <h4>
                    ${variety.name}
                </h4>

                <p>
                    Seedlings Sold:
                    <strong>
                        ${formatNumber(
                            variety.quantity
                        )}
                    </strong>
                </p>

                <p>
                    Revenue:
                    <strong>
                        KSh ${formatNumber(
                            variety.revenue
                        )}
                    </strong>
                </p>

                <p>
                    Completed Orders:
                    <strong>
                        ${variety.orders.toLocaleString()}
                    </strong>
                </p>

            `;


            varietySalesGrid.appendChild(
                card
            );

        }
    );

}



// ================================
// RECENT COMPLETED SALES
// ================================

function renderRecentSales() {

    recentSalesTableBody.innerHTML =
        "";


    if (filteredSalesOrders.length === 0) {

        recentSalesTableBody.innerHTML = `
            <tr>

                <td
                    colspan="8"
                    class="empty-state"
                >
                    No completed sales yet.
                </td>

            </tr>
        `;

        return;
    }


    filteredSalesOrders.forEach(
        (order) => {

            const quantity =
                Number(
                    order.quantity || 0
                );


            const total =
                Number(
                    order.total || 0
                );


            const saleTimestamp =
    order.completedAt ||
    order.createdAt;


const date =
    saleTimestamp
        ? saleTimestamp
            .toDate()
            .toLocaleString()
        : "-";

            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    ${escapeHTML(date)}
                </td>

                <td>
                    ${escapeHTML(
                        order.customerName || "-"
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        order.phone || "-"
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        order.variety || "-"
                    )}
                </td>

                <td>
                    ${formatNumber(quantity)}
                </td>

                <td>
                    KSh ${formatNumber(total)}
                </td>

                <td>
                    ${escapeHTML(
                        order.location || "-"
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        order.orderMethod || "-"
                    )}
                </td>

            `;


            recentSalesTableBody.appendChild(
                row
            );

        }
    );

}



// ================================
// VARIETY ID
// ================================

function getVarietyId(variety) {

    const normalized =
        String(variety || "")
            .trim()
            .toLowerCase();


    const varietyMap = {

        "batian":
            "batian",

        "ruiru 11":
            "ruiru-11",

        "ruiru-11":
            "ruiru-11",

        "sl34":
            "sl34",

        "sl 34":
            "sl34",

        "sl28":
            "sl28",

        "sl 28":
            "sl28",

        "k7":
            "k7",

        "k 7":
            "k7"

    };


    return (
        varietyMap[normalized] ||
        null
    );

}



// ================================
// FORMAT NUMBER
// ================================

function formatNumber(value) {

    return Number(value || 0)
        .toLocaleString();

}



// ================================
// ESCAPE HTML
// ================================

function escapeHTML(value) {

    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}

// ================================
// SALES PERIOD BUTTONS
// ================================

salesPeriodButtons.forEach(
    (button) => {

        button.addEventListener(
            "click",
            () => {

                selectedSalesPeriod =
                    button.dataset.salesPeriod;


                salesPeriodButtons.forEach(
                    (otherButton) => {

                        otherButton.classList.remove(
                            "active"
                        );

                    }
                );


                button.classList.add(
                    "active"
                );


                applySalesPeriodFilter();

            }
        );

    }
);



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