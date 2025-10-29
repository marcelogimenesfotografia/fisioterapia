// js/stores/clinicStore.js
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db } from '../firebase.js';

// Assume-se que o user.uid é o ID do documento da clínica para simplificar.
// Em um sistema real, você buscaria o clinicId a partir de um documento de 'users'.
export function initializeClinicStore(appContext) {
    appContext.$watch('auth.user', (user) => {
        if (user && user.uid) {
            // No seu sistema, você precisará de uma forma de linkar o user.uid ao clinicId.
            // Para este exemplo, vamos assumir que o ID do usuário é o mesmo da clínica.
            // Em um sistema real, seria algo como: getDoc(doc(db, 'users', user.uid)) -> then(userDoc => userDoc.data().clinicId)
            const MOCK_CLINIC_ID = "Cg071Ld6G4aU05E1kI3H"; // SUBSTITUIR PELA LÓGICA REAL
            appContext.clinic.id = MOCK_CLINIC_ID;

            onSnapshot(doc(db, 'clinics', MOCK_CLINIC_ID), (docSnap) => {
                if (docSnap.exists()) {
                    appContext.clinic.data = docSnap.data();
                } else {
                    console.error("Clínica não encontrada!");
                }
            });
        } else {
            appContext.clinic.id = null;
            appContext.clinic.data = {};
        }
    });
}