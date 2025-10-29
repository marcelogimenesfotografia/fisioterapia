// js/stores/patientStore.js
import { collection, onSnapshot, addDoc, updateDoc, doc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db } from '../firebase.js';

const BLANK_FORM = { id: null, name: '', phone: '' };

export const patientStore = () => ({
    all: [],
    selectedId: null,
    selected: null,
    _app: null,
    _unsubscribe: null,

    init(appContext) {
        this._app = appContext;
        // Observa mudanças no ID da clínica
        this._app.$watch('clinic.id', (clinicId) => {
            if (this._unsubscribe) this._unsubscribe();

            if (clinicId) {
                const patientsRef = collection(db, 'clinics', clinicId, 'patients');
                this._unsubscribe = onSnapshot(patientsRef, (snapshot) => {
                    this.all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                });
            } else {
                this.all = [];
            }
        });
    },

    // Ações
    openPatientModal(patient = null) {
        if (patient) {
            this._app.modals.patient.isEditing = true;
            // Clona o objeto para o formulário
            this._app.modals.patient.form = { ...patient };
        } else {
            this._app.modals.patient.isEditing = false;
            this._app.modals.patient.form = { ...BLANK_FORM };
        }
        this._app.modals.patient.isOpen = true;
    },

    async savePatient() {
        this._app.isLoading = true;
        const clinicId = this._app.clinic.id;
        const formData = this._app.modals.patient.form;
        
        try {
            if (this._app.modals.patient.isEditing) {
                const patientRef = doc(db, 'clinics', clinicId, 'patients', formData.id);
                const { id, ...dataToSave } = formData;
                await updateDoc(patientRef, dataToSave);
            } else {
                const { id, ...dataToSave } = formData;
                await addDoc(collection(db, 'clinics', clinicId, 'patients'), dataToSave);
            }
            this._app.modals.patient.isOpen = false;
        } catch (e) {
            console.error(e);
        } finally {
            this._app.isLoading = false;
        }
    },

    viewPatient(id) {
        this.selectedId = id;
        this.selected = this.all.find(p => p.id === id) || null;
    },
    
    backToList() {
        this.selectedId = null;
        this.selected = null;
    }
});