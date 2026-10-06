// ================================
// ASILI COFFEE NURSERY
// ADMIN CUSTOMERS
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

const customersTableBody =
    document.querySelector("#customersTableBody");

const totalCustomers =
    document.querySelector("#totalCustomers");

const repeatCustomers =
    document.querySelector("#repeatCustomers");

const customerTotalOrders =
    document.querySelector("#customerTotalOrders");

const customerTotalValue =
    document.querySelector("#customerTotalValue");

const customerSearch =
    document.querySelector("#customerSearch");

const customerTypeFilter =
    document.querySelector("#customerTypeFilter");

const customerSort =
    document.querySelector("#customerSort");

const logoutButton =
    document.querySelector("#logoutButton");



let loadedCustomers = [];



// ================================
// AUTHENTICATION CHECK
// ================================

onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href =
            "login.html";

        return;
    }


    loadCustomers();

});



// ================================
// LOAD CUSTOMERS FROM ORDERS
// ================================

async function loadCustomers() {

    try {

        const ordersSnapshot =
            await getDocs(
                collection(db, "orders")
            );


        const customersMap =
            new Map();


        ordersSnapshot.forEach((orderDocument) => {

            const order =
                orderDocument.data();


            const phone =
                normalizePhone(
                    order.phone
                );


            /*
                Phone number is the primary
                customer identifier.

                Orders without a usable phone
                are ignored because they cannot
                safely be linked to a customer.
            */

            if (!phone) {
                return;
            }


            if (!customersMap.has(phone)) {

                customersMap.set(
                    phone,
                    {
                        phone: phone,

                        name:
                            order.customerName ||
                            "Unknown Customer",

                        location:
                            order.location ||
                            "-",

                        orders: [],

                        validOrderCount: 0,

                        seedlings: 0,

                        orderValue: 0,

                        lastOrderDate: null
                    }
                );

            }


            const customer =
                customersMap.get(phone);


            /*
                Keep the latest available
                customer information.
            */

            if (order.customerName) {

                customer.name =
                    order.customerName;

            }


            if (order.location) {

                customer.location =
                    order.location;

            }


            customer.orders.push({

                id:
                    orderDocument.id,

                ...order

            });



            // ================================
            // LAST ORDER DATE
            // ================================

            if (order.createdAt) {

                const orderDate =
                    order.createdAt.toDate();


                if (
                    !customer.lastOrderDate ||
                    orderDate >
                        customer.lastOrderDate
                ) {

                    customer.lastOrderDate =
                        orderDate;

                }

            }



            // ================================
            // EXCLUDE CANCELLED ORDERS
            // FROM PURCHASE TOTALS
            // ================================

            const status =
                String(
                    order.status || "pending"
                )
                    .trim()
                    .toLowerCase();


            if (status !== "cancelled") {

                customer.validOrderCount += 1;


                customer.seedlings +=
                    Number(
                        order.quantity || 0
                    );


                customer.orderValue +=
                    Number(
                        order.total || 0
                    );

            }

        });



        loadedCustomers =
            Array.from(
                customersMap.values()
            );


        /*
            Newest customer activity first.
        */

        loadedCustomers.sort(
            (a, b) => {

                const aDate =
                    a.lastOrderDate
                        ? a.lastOrderDate.getTime()
                        : 0;


                const bDate =
                    b.lastOrderDate
                        ? b.lastOrderDate.getTime()
                        : 0;


                return bDate - aDate;

            }
        );


        renderCustomers();
        updateCustomerSummary();


    } catch (error) {

        console.error(
            "Unable to load customers:",
            error
        );


        customersTableBody.innerHTML = `
            <tr>

                <td
                    colspan="8"
                    class="empty-state"
                >
                    Unable to load customer information.
                </td>

            </tr>
        `;

    }

}



// ================================
// RENDER CUSTOMERS
// ================================

function renderCustomers() {

    const searchTerm =
        customerSearch.value
            .trim()
            .toLowerCase();


    const selectedType =
        customerTypeFilter.value;


    const selectedSort =
        customerSort.value;



    // ================================
    // FILTER CUSTOMERS
    // ================================

    const filteredCustomers =
        loadedCustomers.filter(
            (customer) => {

                const searchableText = [

                    customer.name,
                    customer.phone,
                    customer.location

                ]
                    .map(
                        (value) =>
                            String(value || "")
                                .toLowerCase()
                    )
                    .join(" ");


                const matchesSearch =
                    searchableText.includes(
                        searchTerm
                    );


                const isRepeat =
                    customer.validOrderCount >= 2;


                let matchesType =
                    true;


                if (selectedType === "new") {

                    matchesType =
                        !isRepeat;

                }


                if (selectedType === "repeat") {

                    matchesType =
                        isRepeat;

                }


                return (
                    matchesSearch &&
                    matchesType
                );

            }
        );



    // ================================
    // SORT CUSTOMERS
    // ================================

    filteredCustomers.sort(
        (a, b) => {

            switch (selectedSort) {


                case "highest-value":

                    return (
                        b.orderValue -
                        a.orderValue
                    );


                case "most-orders":

                    return (
                        b.orders.length -
                        a.orders.length
                    );


                case "most-seedlings":

                    return (
                        b.seedlings -
                        a.seedlings
                    );


                case "name":

                    return String(a.name || "")
                        .localeCompare(
                            String(b.name || "")
                        );


                case "newest":
                default:

                    const aDate =
                        a.lastOrderDate
                            ? a.lastOrderDate.getTime()
                            : 0;


                    const bDate =
                        b.lastOrderDate
                            ? b.lastOrderDate.getTime()
                            : 0;


                    return (
                        bDate -
                        aDate
                    );

            }

        }
    );



    // ================================
    // DISPLAY CUSTOMERS
    // ================================

    customersTableBody.innerHTML =
        "";


    if (filteredCustomers.length === 0) {

        customersTableBody.innerHTML = `
            <tr>

                <td
                    colspan="8"
                    class="empty-state"
                >
                    No matching customers found.
                </td>

            </tr>
        `;

        return;
    }


    filteredCustomers.forEach(
        (customer) => {

            const row =
                document.createElement("tr");


            const lastOrder =
                customer.lastOrderDate
                    ? customer.lastOrderDate
                        .toLocaleString()
                    : "-";


            row.innerHTML = `

                <td>
                    ${escapeHTML(customer.name)}
                </td>

                <td>
                    ${escapeHTML(customer.phone)}
                </td>

                <td>
                    ${escapeHTML(customer.location)}
                </td>

                <td>
                    ${customer.orders.length.toLocaleString()}
                </td>

                <td>
                    ${customer.seedlings.toLocaleString()}
                </td>

                <td>
                    KSh ${customer.orderValue.toLocaleString()}
                </td>

                <td>
                    ${lastOrder}
                </td>

                <td>

                    <button
                        type="button"
                        class="view-customer-button"
                        data-phone="${escapeHTML(customer.phone)}"
                    >
                        View
                    </button>

                </td>

            `;


            customersTableBody.appendChild(
                row
            );

        }
    );

}



// ================================
// CUSTOMER SUMMARY
// ================================

function updateCustomerSummary() {

    const totalCustomerCount =
        loadedCustomers.length;


    const repeatCustomerCount =
        loadedCustomers.filter(
            (customer) =>
                customer.validOrderCount >= 2
        ).length;


    const totalOrderCount =
        loadedCustomers.reduce(
            (total, customer) =>
                total +
                customer.orders.length,
            0
        );


    const totalValue =
        loadedCustomers.reduce(
            (total, customer) =>
                total +
                customer.orderValue,
            0
        );


    totalCustomers.textContent =
        totalCustomerCount
            .toLocaleString();


    repeatCustomers.textContent =
        repeatCustomerCount
            .toLocaleString();


    customerTotalOrders.textContent =
        totalOrderCount
            .toLocaleString();


    customerTotalValue.textContent =
        `KSh ${totalValue.toLocaleString()}`;

}



// ================================
// NORMALIZE PHONE NUMBER
// ================================

function normalizePhone(phone) {

    let normalized =
        String(phone || "")
            .replace(/\D/g, "");


    if (!normalized) {
        return "";
    }


    /*
        Kenyan local number:
        0745... → 254745...
    */

    if (normalized.startsWith("0")) {

        normalized =
            "254" +
            normalized.substring(1);

    }


    /*
        Handle numbers entered as:
        745208905 → 254745208905
    */

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
// SEARCH
// ================================

customerSearch.addEventListener(
    "input",
    renderCustomers
);

// ================================
// CUSTOMER TYPE FILTER
// ================================

customerTypeFilter.addEventListener(
    "change",
    renderCustomers
);



// ================================
// CUSTOMER SORT
// ================================

customerSort.addEventListener(
    "change",
    renderCustomers
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

// ================================
// CUSTOMER DETAILS MODAL
// ================================

const customerDetailsModal =
    document.querySelector("#customerDetailsModal");

const customerDetailsContent =
    document.querySelector("#customerDetailsContent");

const closeCustomerDetails =
    document.querySelector("#closeCustomerDetails");



// ================================
// OPEN CUSTOMER DETAILS
// ================================

customersTableBody.addEventListener(
    "click",
    (event) => {

        if (
            !event.target.classList.contains(
                "view-customer-button"
            )
        ) {
            return;
        }


        const phone =
            event.target.dataset.phone;


        const customer =
            loadedCustomers.find(
                (item) =>
                    item.phone === phone
            );


        if (!customer) {

            alert(
                "Unable to find this customer."
            );

            return;
        }


        showCustomerDetails(
            customer
        );

    }
);



// ================================
// SHOW CUSTOMER DETAILS
// ================================

function showCustomerDetails(customer) {

    const customerType =
        customer.validOrderCount >= 2
            ? "Repeat Customer"
            : "New Customer";


    const sortedOrders =
        [...customer.orders].sort(
            (a, b) => {

                const aDate =
                    a.createdAt
                        ? a.createdAt.toMillis()
                        : 0;


                const bDate =
                    b.createdAt
                        ? b.createdAt.toMillis()
                        : 0;


                return bDate - aDate;

            }
        );


    const orderRows =
        sortedOrders.map(
            (order) => {

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
                    );


                const date =
                    order.createdAt
                        ? order.createdAt
                            .toDate()
                            .toLocaleString()
                        : "-";


                return `

                    <tr>

                        <td>
                            ${escapeHTML(date)}
                        </td>

                        <td>
                            ${escapeHTML(order.variety || "-")}
                        </td>

                        <td>
                            ${quantity.toLocaleString()}
                        </td>

                        <td>
                            KSh ${total.toLocaleString()}
                        </td>

                        <td>
                            ${escapeHTML(order.orderMethod || "-")}
                        </td>

                        <td>
                            ${escapeHTML(status)}
                        </td>

                    </tr>

                `;

            }
        )
        .join("");


    customerDetailsContent.innerHTML = `

        <div class="customer-profile-grid">

            <div class="customer-detail">

                <span>
                    Customer
                </span>

                <strong>
                    ${escapeHTML(customer.name)}
                </strong>

            </div>


            <div class="customer-detail">

                <span>
                    Phone
                </span>

                <strong>
                    ${escapeHTML(customer.phone)}
                </strong>

            </div>


            <div class="customer-detail">

                <span>
                    Location
                </span>

                <strong>
                    ${escapeHTML(customer.location)}
                </strong>

            </div>


            <div class="customer-detail">

                <span>
                    Customer Type
                </span>

                <strong>
                    ${customerType}
                </strong>

            </div>


            <div class="customer-detail">

                <span>
                    Total Orders
                </span>

                <strong>
                    ${customer.orders.length.toLocaleString()}
                </strong>

            </div>


            <div class="customer-detail">

                <span>
                    Seedlings Ordered
                </span>

                <strong>
                    ${customer.seedlings.toLocaleString()}
                </strong>

            </div>


            <div class="customer-detail">

                <span>
                    Order Value
                </span>

                <strong>
                    KSh ${customer.orderValue.toLocaleString()}
                </strong>

            </div>


            <div class="customer-detail">

                <span>
                    Last Order
                </span>

                <strong>
                    ${
                        customer.lastOrderDate
                            ? customer.lastOrderDate
                                .toLocaleString()
                            : "-"
                    }
                </strong>

            </div>

        </div>


        <h3 class="customer-history-title">
            Order History
        </h3>


        <div class="customer-history-container">

            <table class="customer-history-table">

                <thead>

                    <tr>

                        <th>
                            Date
                        </th>

                        <th>
                            Variety
                        </th>

                        <th>
                            Quantity
                        </th>

                        <th>
                            Value
                        </th>

                        <th>
                            Method
                        </th>

                        <th>
                            Status
                        </th>

                    </tr>

                </thead>


                <tbody>

                    ${orderRows}

                </tbody>

            </table>

        </div>


        <div class="customer-contact-actions">

            <button
                type="button"
                class="
                    customer-contact-button
                    whatsapp-customer-button
                "
                data-phone="${escapeHTML(customer.phone)}"
                data-customer="${escapeHTML(customer.name)}"
            >
                WhatsApp Customer
            </button>


            <button
                type="button"
                class="
                    customer-contact-button
                    call-customer-button
                "
                data-phone="${escapeHTML(customer.phone)}"
            >
                Call Customer
            </button>

        </div>

    `;


    customerDetailsModal.hidden =
        false;

}



// ================================
// CLOSE CUSTOMER DETAILS
// ================================

closeCustomerDetails.addEventListener(
    "click",
    () => {

        customerDetailsModal.hidden =
            true;

    }
);



// Close when clicking outside modal card

customerDetailsModal.addEventListener(
    "click",
    (event) => {

        if (
            event.target ===
            customerDetailsModal
        ) {

            customerDetailsModal.hidden =
                true;

        }

    }
);



// ================================
// WHATSAPP CUSTOMER
// ================================

customerDetailsContent.addEventListener(
    "click",
    (event) => {

        if (
            !event.target.classList.contains(
                "whatsapp-customer-button"
            )
        ) {
            return;
        }


        const button =
            event.target;


        const customer =
            button.dataset.customer ||
            "Customer";


        const phone =
            normalizePhone(
                button.dataset.phone
            );


        if (
            !phone ||
            !phone.startsWith("254")
        ) {

            alert(
                "This customer does not have a valid Kenyan phone number."
            );

            return;
        }


        const message =
            `Hello ${customer}, this is Asili Coffee Nursery.`;


        const whatsappURL =
            `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;


        window.open(
            whatsappURL,
            "_blank"
        );

    }
);



// ================================
// CALL CUSTOMER
// ================================

customerDetailsContent.addEventListener(
    "click",
    (event) => {

        if (
            !event.target.classList.contains(
                "call-customer-button"
            )
        ) {
            return;
        }


        const phone =
            normalizePhone(
                event.target.dataset.phone
            );


        if (
            !phone ||
            !phone.startsWith("254")
        ) {

            alert(
                "This customer does not have a valid Kenyan phone number."
            );

            return;
        }


        window.location.href =
            `tel:+${phone}`;

    }
);