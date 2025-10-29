// js/stores/patientStore.js
import { collection, onSnapshot, addDoc, updateDoc, doc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db } from '../firebase.js';

let unsubscribeFromPatients;

export function initializePatientsStore(appContext) {
    appContext.$watch('clinic.id', (clinicId) => {
        if (unsubscribeFromPatients) unsubscribeFromPatients(); // Cancela listener anterior

        if (clinicId) {
            const patientsRef = collection(db, 'clinics', clinicId, 'patients');
            unsubscribeFromPatients = onSnapshot(patientsRef, (snapshot) => {
                const patientList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                appContext.patients.all = patientList.sort((a,b) => a.name.localeCompare(b.name));
            });
        } else {
            appContext.patients.all = [];
        }
    });
}

// Funções de Ação (Create, Update)
export const patientActions = {
    add: (clinicId, patientData) => {
        const patientsRef = collection(db, 'clinics', clinicId, 'patients');
        return addDoc(patientsRef, patientData);
    },
    update: (clinicId, patientId, patientData) => {
        const patientRef = doc(db, 'clinics', clinicId, 'patients', patientId);
        // Remove 'id' do objeto antes de salvar para não duplicar
        const { id, ...dataToSave } = patientData; 
        return updateDoc(patientRef, dataToSave);
    }
};