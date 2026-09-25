// ================================
// ASILI COFFEE NURSERY
// FIRESTORE ORDER SERVICE
// ================================

import {
    collection,
    addDoc,
    serverTimestamp
} from
    "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


// ================================
// SAVE ORDER
// ================================

export async function saveOrder(orderData) {

    const db =
        window.asiliDB;


    if (!db) {

        throw new Error(
            "Firebase Firestore is not initialized."
        );

    }


    const order = {

        customerName:
            orderData.customerName || "",

        phone:
            orderData.phone || "",

        variety:
            orderData.variety || "",

        quantity:
            Number(orderData.quantity || 0),

        price:
            Number(orderData.price || 0),

        total:
            Number(orderData.total || 0),

        location:
            orderData.location || "",

        orderMethod:
            orderData.orderMethod || "",

        additionalMessage:
            orderData.additionalMessage || "",

        status:
            "pending",

        createdAt:
            serverTimestamp()

    };


    const orderReference =
        await addDoc(
            collection(db, "orders"),
            order
        );


    return orderReference.id;

}