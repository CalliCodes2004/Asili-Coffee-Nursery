// ================================
// ASILI COFFEE NURSERY
// INVENTORY MANAGEMENT
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
    getDoc,
    updateDoc,
    increment
} from
    "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


const app = window.asiliFirebase;
const db = window.asiliDB;
const auth = getAuth(app);


const inventoryTableBody =
    document.querySelector("#inventoryTableBody");

const totalAvailable =
    document.querySelector("#totalAvailable");

const totalReserved =
    document.querySelector("#totalReserved");

const totalSold =
    document.querySelector("#totalSold");

const totalProduction =
    document.querySelector("#totalProduction");

const logoutButton =
    document.querySelector("#logoutButton");


const inventoryNames = {
    "batian": "Batian",
    "ruiru-11": "Ruiru 11",
    "sl34": "SL34",
    "sl28": "SL28",
    "k7": "K7"
};


onAuthStateChanged(auth, (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    loadInventory();

});


async function loadInventory() {

    try {

        const inventorySnapshot =
            await getDocs(
                collection(db, "inventory")
            );

        inventoryTableBody.innerHTML = "";

        let availableTotal = 0;
        let reservedTotal = 0;
        let soldTotal = 0;
        let productionTotal = 0;


        if (inventorySnapshot.empty) {

            inventoryTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-message">
                        No inventory records found.
                    </td>
                </tr>
            `;

            updateSummary(0, 0, 0, 0);

            return;
        }


        inventorySnapshot.forEach((inventoryDocument) => {

            const inventory =
                inventoryDocument.data();

            const available =
                Number(inventory.available || 0);

            const reserved =
                Number(inventory.reserved || 0);

            const sold =
                Number(inventory.sold || 0);

            const production =
                Number(inventory.production || 0);


            availableTotal += available;
            reservedTotal += reserved;
            soldTotal += sold;
            productionTotal += production;


            const variety =
                inventory.variety ||
                inventoryNames[inventoryDocument.id] ||
                inventoryDocument.id;


            const row =
                document.createElement("tr");


           row.innerHTML = `
    <td>
        <strong>${variety}</strong>
    </td>

    <td>
        ${available.toLocaleString()}
    </td>

    <td>
        ${reserved.toLocaleString()}
    </td>

    <td>
        ${sold.toLocaleString()}
    </td>

    <td>
        ${production.toLocaleString()}
    </td>

    <td>
        <button
            type="button"
            class="inventory-action-button"
            data-inventory-id="${inventoryDocument.id}"
            data-action="production"
        >
            Add Production
        </button>

        <button
            type="button"
            class="inventory-action-button secondary"
            data-inventory-id="${inventoryDocument.id}"
            data-action="adjust"
        >
            Adjust Stock
        </button>
    </td>
`;


            inventoryTableBody.appendChild(row);

        });


        updateSummary(
            availableTotal,
            reservedTotal,
            soldTotal,
            productionTotal
        );


    } catch (error) {

        console.error(
            "Unable to load inventory:",
            error
        );

        inventoryTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-message">
                    Unable to load inventory.
                </td>
            </tr>
        `;

    }

}


function updateSummary(
    available,
    reserved,
    sold,
    production
) {

    totalAvailable.textContent =
        available.toLocaleString();

    totalReserved.textContent =
        reserved.toLocaleString();

    totalSold.textContent =
        sold.toLocaleString();

    totalProduction.textContent =
        production.toLocaleString();

}


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
// INVENTORY MODAL
// ================================

const inventoryModal =
    document.querySelector("#inventoryModal");

const inventoryForm =
    document.querySelector("#inventoryForm");

const inventoryModalTitle =
    document.querySelector("#inventoryModalTitle");

const inventoryAmount =
    document.querySelector("#inventoryAmount");

const inventoryField =
    document.querySelector("#inventoryField");

const closeInventoryModal =
    document.querySelector("#closeInventoryModal");


let selectedInventoryId = null;
let selectedAction = null;


inventoryTableBody.addEventListener(
    "click",
    (event) => {

        const button =
            event.target.closest(
                ".inventory-action-button"
            );

        if (!button) {
            return;
        }

        selectedInventoryId =
            button.dataset.inventoryId;

        selectedAction =
            button.dataset.action;


        if (selectedAction === "production") {

    inventoryModalTitle.textContent =
        "Add Production Stock";

    inventoryField.value =
        "production";

    inventoryField.disabled = true;

} else {

    inventoryModalTitle.textContent =
        "Adjust Inventory";

    inventoryField.value =
        "available";

    inventoryField.disabled = false;

}


        inventoryAmount.value = "";

        inventoryModal.hidden = false;

        inventoryAmount.focus();

    }
);


closeInventoryModal.addEventListener(
    "click",
    () => {

        inventoryModal.hidden = true;

    }
);


inventoryForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const amount =
            Number(inventoryAmount.value);

        const field =
            inventoryField.value;


        if (!Number.isInteger(amount) || amount === 0) {

    alert(
        "Enter a valid whole number other than zero."
    );

    return;

}


if (
    selectedAction === "production" &&
    amount < 0
) {

    alert(
        "Production stock cannot be added as a negative quantity."
    );

    return;

}


        if (
            ![
                "available",
                "reserved",
                "sold",
                "production"
            ].includes(field)
        ) {

            alert(
                "Invalid inventory field."
            );

            return;

        }


        try {
            const inventoryReference =
    doc(
        db,
        "inventory",
        selectedInventoryId
    );

const inventorySnapshot =
    await getDoc(
        inventoryReference
    );

if (!inventorySnapshot.exists()) {

    alert(
        "Inventory record not found."
    );

    return;

}

const currentInventory =
    inventorySnapshot.data();

const currentValue =
    Number(
        currentInventory[field] || 0
    );

const newValue =
    currentValue + amount;


if (newValue < 0) {

    alert(
        `This adjustment would make ${field} stock negative.`
    );

    return;

}

            await updateDoc(
                doc(
                    db,
                    "inventory",
                    selectedInventoryId
                ),
                {
                    [field]: increment(amount)
                }
            );


            inventoryModal.hidden = true;

            await loadInventory();


        } catch (error) {

            console.error(
                "Unable to update inventory:",
                error
            );

            alert(
                "Unable to update inventory."
            );

        }

    }
);