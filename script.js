const productCards = document.querySelectorAll(".product-card");

productCards.forEach((card) => {

    const button = card.querySelector(".expand-btn");

    button.addEventListener("click", (event) => {

        event.stopPropagation();

        // Close other cards
        productCards.forEach((otherCard) => {
            if (otherCard !== card) {
                otherCard.classList.remove("active");

                const otherButton =
                    otherCard.querySelector(".expand-btn");

                otherButton.textContent = "View Details";
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
const orderButtons = document.querySelectorAll(".order-btn");

orderButtons.forEach((button) => {
    button.addEventListener("click", () => {

        const variety = button.dataset.variety;
        const price = Number(button.dataset.price);

        const details = button.closest(".product-details");
        const quantityInput = details.querySelector(".quantity-input");

        const quantity = Number(quantityInput.value);

        if (!quantity || quantity < 1) {
            alert(
                "Please enter the number of seedlings you would like to order."
            );

            quantityInput.focus();
            return;
        }

        const total = price * quantity;

        const message =
            `Hello Asili Coffee Nursery,%0A%0A` +
            `I would like to place a seedling order.%0A%0A` +
            `🌱 Variety: ${variety}%0A` +
            `📦 Quantity: ${quantity.toLocaleString()} seedlings%0A` +
            `💰 Price: KSh ${price.toLocaleString()} per seedling%0A` +
            `🧾 Estimated Value: KSh ${total.toLocaleString()}%0A%0A` +
            `Please confirm availability and delivery/pickup arrangements.%0A%0A` +
            `Thank you.`;

        const whatsappNumber = "254745208905";

        const whatsappURL =
            `https://wa.me/${whatsappNumber}?text=${message}`;

        window.open(whatsappURL, "_blank");
    });
});
// LIVE ORDER CALCULATOR

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