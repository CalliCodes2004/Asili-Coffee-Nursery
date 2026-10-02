// ================================
// ASILI COFFEE NURSERY
// PRODUCTS MANAGEMENT
// ================================

import {
    getAuth,
    onAuthStateChanged,
    signOut
} from
    "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


import {
    collection,
    getDocs,
    doc,
    getDoc,
    updateDoc
} from
    "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


// Firebase

const app =
    window.asiliFirebase;

const db =
    window.asiliDB;

const auth =
    getAuth(app);


// ================================
// PAGE ELEMENTS
// ================================

const productsTableBody =
    document.querySelector("#productsTableBody");

const logoutButton =
    document.querySelector("#logoutButton");

    const productModal =
    document.querySelector("#productModal");

const closeProductModal =
    document.querySelector("#closeProductModal");

const productForm =
    document.querySelector("#productForm");

const productId =
    document.querySelector("#productId");

const productVariety =
    document.querySelector("#productVariety");

const productPrice =
    document.querySelector("#productPrice");

const productStatus =
    document.querySelector("#productStatus");


// ================================
// AUTHENTICATION
// ================================

onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href =
            "login.html";

        return;

    }

    loadProducts();

});


// ================================
// LOAD PRODUCTS
// ================================

async function loadProducts() {

    try {

        const productsSnapshot =
            await getDocs(
                collection(db, "products")
            );


        productsTableBody.innerHTML = "";


        if (productsSnapshot.empty) {

            productsTableBody.innerHTML = `
                <tr>
                    <td colspan="4">
                        No products found.
                    </td>
                </tr>
            `;

            return;

        }


        productsSnapshot.forEach(
            (productDocument) => {

                const product =
                    productDocument.data();


                const variety =
                    product.variety ||
                    product.name ||
                    productDocument.id;


                const price =
                    Number(product.price || 0);


                const isActive =
                    product.active !== false;


                const statusText =
                    isActive
                        ? "Active"
                        : "Inactive";


                const statusClass =
                    isActive
                        ? "status-active"
                        : "status-inactive";


                const row =
                    document.createElement("tr");


                row.innerHTML = `

                    <td>
                        <strong>
                            ${variety}
                        </strong>
                    </td>

                    <td>
                        KSh ${price.toLocaleString()}
                    </td>

                    <td
                        class="${statusClass}"
                    >
                        ${statusText}
                    </td>

                    <td>

                        <button
                            type="button"
                            class="edit-button"
                            data-product-id="${productDocument.id}"
                        >
                            Edit
                        </button>

                    </td>

                `;


                productsTableBody.appendChild(
                    row
                );

            }
        );


    } catch (error) {

        console.error(
            "Unable to load products:",
            error
        );


        productsTableBody.innerHTML = `
            <tr>
                <td colspan="4">
                    Unable to load products.
                </td>
            </tr>
        `;

    }

}

// ================================
// OPEN PRODUCT EDITOR
// ================================

productsTableBody.addEventListener(
    "click",
    async (event) => {

        const editButton =
            event.target.closest(".edit-button");


        if (!editButton) {
            return;
        }


        const selectedProductId =
            editButton.dataset.productId;


        try {

            const productReference =
                doc(
                    db,
                    "products",
                    selectedProductId
                );


            const productSnapshot =
                await getDoc(productReference);


            if (!productSnapshot.exists()) {

                alert(
                    "Product not found."
                );

                return;
            }


            const product =
                productSnapshot.data();


            productId.value =
                selectedProductId;


            productVariety.value =
                product.variety ||
                product.name ||
                selectedProductId;


            productPrice.value =
                Number(product.price || 0);


            productStatus.value =
                product.active === false
                    ? "inactive"
                    : "active";


            productModal.hidden =
                false;


        } catch (error) {

            console.error(
                "Unable to open product:",
                error
            );

            alert(
                "Unable to load the product."
            );

        }

    }
);

// ================================
// CLOSE PRODUCT EDITOR
// ================================

closeProductModal.addEventListener(
    "click",
    () => {

        productModal.hidden =
            true;

    }
);

// ================================
// SAVE PRODUCT CHANGES
// ================================

productForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const selectedProductId =
            productId.value;


        const newPrice =
            Number(productPrice.value);


        const isActive =
            productStatus.value === "active";


        if (!selectedProductId) {

            alert(
                "No product selected."
            );

            return;

        }


        if (
            !Number.isFinite(newPrice) ||
            newPrice <= 0
        ) {

            alert(
                "Enter a valid product price."
            );

            return;

        }


        try {

            const productReference =
                doc(
                    db,
                    "products",
                    selectedProductId
                );


            await updateDoc(
                productReference,
                {
                    price: newPrice,
                    active: isActive
                }
            );


            productModal.hidden =
                true;


            await loadProducts();


            alert(
                "Product updated successfully."
            );


        } catch (error) {

            console.error(
                "Unable to update product:",
                error
            );


            alert(
                "Unable to update the product. Please try again."
            );

        }

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