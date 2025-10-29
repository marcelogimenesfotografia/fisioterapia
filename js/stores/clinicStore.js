// js/stores/clinicStore.js
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db } from '../firebase.js';

export const clinicStore = () => ({
    id: null,
    data: {},
    _app: null,
    _unsubscribe: null,

    init(appContext) {
        this._app = appContext;
        // Observa mudanças no estado de autenticação
        this._app.$watch('auth.user', (user) => {
            if (this._unsubscribe) this._unsubscribe(); // Cancela o listener antigo

            if (user) {
                // LÓGICA PARA ENCONTRAR O ID DA CLÍNICA - PRECISA SER AJUSTADA
                // Por agora, vamos usar um ID fixo para teste.
                const MOCK_CLINIC_ID = "Cg071Ld6G4aU05E1kI3H"; 
                this.id = MOCK_CLINIC_ID;
                
                const clinicRef = doc(db, 'clinics', this.id);
                this._unsubscribe = onSnapshot(clinicRef, (docSnap) => {
                    this.data = docSnap.exists() ? docSnap.data() : {};
                });
            } else {
                this.id = null;
                this.data = {};
            }
        });
    }
});