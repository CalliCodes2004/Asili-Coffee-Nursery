import {
    saveOrder
} from "./order-service.js";
// ================================
// PRODUCT CARD EXPANSION
// ================================

const productCards = document.querySelectorAll(".product-card");

productCards.forEach((card) => {

    const button = card.querySelector(".expand-btn");

    if (!button) return;

    button.addEventListener("click", (event) => {

        event.stopPropagation();

        // Close other cards
        productCards.forEach((otherCard) => {

            if (otherCard !== card) {

                otherCard.classList.remove("active");

                const otherButton =
                    otherCard.querySelector(".expand-btn");

                if (otherButton) {
                    otherButton.textContent = "View Details";
                }

            }

        });

        // Toggle selected card
        card.classList.toggle("active");

        if (card.classList.contains("active")) {

            button.textContent = "Hide Details";

        } else {

            button.textContent = "View Details";

        }

    });

});


// ================================
// WHATSAPP PRODUCT ORDERS
// ================================

const orderButtons =
    document.querySelectorAll(".order-btn");

orderButtons.forEach((button) => {

    button.addEventListener("click", () => {

        const variety =
            button.dataset.variety;

        const price =
            Number(button.dataset.price);

        const details =
            button.closest(".product-details");

        const quantityInput =
            details.querySelector(".quantity-input");

        const quantity =
            Number(quantityInput.value);


        // Validate quantity
        if (!quantity || quantity < 1) {

            alert(
                "Please enter the number of seedlings you would like to order."
            );

            quantityInput.focus();

            return;
        }


        // Calculate total
        const total =
            price * quantity;


        // WhatsApp order message
        const message =
            `Hello Asili Coffee Nursery,\n\n` +
            `I would like to place a seedling order.\n\n` +
            `Variety: ${variety}\n` +
            `Quantity: ${quantity.toLocaleString()} seedlings\n` +
            `Price: KSh ${price.toLocaleString()} per seedling\n` +
            `Estimated Value: KSh ${total.toLocaleString()}\n\n` +
            `Please confirm availability and delivery/pickup arrangements.\n\n` +
            `Thank you.`;


        const whatsappNumber =
            "254745208905";


        // Encode message safely
        const whatsappURL =
            `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;


        // Open WhatsApp
        window.open(whatsappURL, "_blank");

    });

});


// ================================
// LIVE ORDER CALCULATOR
// ================================

const quantityInputs =
    document.querySelectorAll(".quantity-input");

quantityInputs.forEach((input) => {

    input.addEventListener("input", () => {

        const details =
            input.closest(".product-details");

        const orderButton =
            details.querySelector(".order-btn");

        const totalDisplay =
            details.querySelector(".order-total");

        const price =
            Number(orderButton.dataset.price);

        const quantity =
            Number(input.value);

        const total =
            price * quantity;


        if (quantity > 0) {

            totalDisplay.textContent =
                `KSh ${total.toLocaleString()}`;

        } else {

            totalDisplay.textContent =
                "KSh 0";

        }

    });

});


// ================================
// MOBILE NAVIGATION
// ================================

const menuToggle =
    document.querySelector(".menu-toggle");

const navLinks =
    document.querySelector(".nav-links");


if (menuToggle && navLinks) {

    menuToggle.addEventListener("click", () => {

        navLinks.classList.toggle("active");


        if (navLinks.classList.contains("active")) {

            menuToggle.textContent = "✕";

            menuToggle.setAttribute(
                "aria-label",
                "Close navigation menu"
            );

        } else {

            menuToggle.textContent = "☰";

            menuToggle.setAttribute(
                "aria-label",
                "Open navigation menu"
            );

        }

    });


    // Close menu after clicking a navigation link

    navLinks.querySelectorAll("a").forEach((link) => {

        link.addEventListener("click", () => {

            navLinks.classList.remove("active");

            menuToggle.textContent = "☰";

            menuToggle.setAttribute(
                "aria-label",
                "Open navigation menu"
            );

        });

    });

}


// ================================
// ORDER / ENQUIRY FORM
// ================================

const orderForm =
    document.querySelector("#orderForm");


if (orderForm) {

    orderForm.addEventListener("submit", async (event) => {

        event.preventDefault();


        // Get form values
        const name =
            document
                .querySelector("#customerName")
                .value
                .trim();

        const phone =
            document
                .querySelector("#customerPhone")
                .value
                .trim();

        const variety =
            document
                .querySelector("#customerVariety")
                .value;

        const quantity =
            Number(
                document
                    .querySelector("#customerQuantity")
                    .value
            );

        const location =
            document
                .querySelector("#customerLocation")
                .value
                .trim();

        const orderMethod =
            document
                .querySelector("#orderMethod")
                .value;

        const additionalMessage =
            document
                .querySelector("#customerMessage")
                .value
                .trim();


        // Validate required fields
        if (
            !name ||
            !phone ||
            !variety ||
            !quantity ||
            !location ||
            !orderMethod
        ) {

            alert(
                "Please complete all required fields before sending your enquiry."
            );

            return;
        }


        // Seedling prices
        const prices = {

            "Batian": 60,

            "Ruiru 11": 80,

            "SL34": 55,

            "SL28": 55,

            "K7": 50

        };


        const price =
            prices[variety];

        const total =
            price * quantity;


        // WhatsApp enquiry message
        const message =
            `Hello Asili Coffee Nursery,\n\n` +
            `I would like to make a seedling enquiry.\n\n` +

            `Name: ${name}\n` +
            `Phone: ${phone}\n` +
            `Variety: ${variety}\n` +
            `Quantity: ${quantity.toLocaleString()} seedlings\n` +
            `Price: KSh ${price.toLocaleString()} per seedling\n` +
            `Estimated Value: KSh ${total.toLocaleString()}\n` +
            `Location: ${location}\n` +
            `Order Method: ${orderMethod}\n\n` +

            `Additional Requirements:\n` +
            `${additionalMessage || "None"}\n\n` +

            `Please confirm availability and the next steps.\n\n` +

            `Thank you.`;


        const whatsappNumber =
            "254745208905";


        // Save order to Firestore

try {

    await saveOrder({

        customerName: name,

        phone: phone,

        variety: variety,

        quantity: quantity,

        price: price,

        total: total,

        location: location,

        orderMethod: orderMethod,

        additionalMessage: additionalMessage

    });

} catch (error) {

    console.error(
        "Unable to save order to Firestore:",
        error
    );

    alert(
        "Your WhatsApp enquiry will still open, but the order could not be saved to our system."
    );

}

            // Encode message safely
        const whatsappURL =
            `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;


        // Open WhatsApp
        window.open(whatsappURL, "_blank");

    });

}