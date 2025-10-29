// js/patients.js
import { firebase, db } from './firebase.js';
import { ui } from './ui.js';

let clinicId = null;
let allPatients = [];
let unsubscribe = null; // Para parar de ouvir as mudanças quando deslogar

const modal = document.getElementById('patient-modal');
const form = document.getElementById('patient-form');
const elements = {
    listContainer: document.getElementById('patients-list-container'),
    modalTitle: document.getElementById('patient-modal-title'),
    patientIdInput: document.getElementById('patient-id'),
    patientNameInput: document.getElementById('patient-name'),
    patientPhoneInput: document.getElementById('patient-phone'),
};

export const patientsModule = {
    // Inicia o módulo e os listeners de eventos
    init() {
        this.setupEventListeners();
    },

    // Começa a ouvir por atualizações de pacientes no Firestore
    startListening(currentClinicId) {
        clinicId = currentClinicId;
        const patientsRef = firebase.collection(db, 'clinics', clinicId, 'patients');
        
        unsubscribe = firebase.onSnapshot(patientsRef, (snapshot) => {
            allPatients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            this.renderList();
        });
    },

    // Para de ouvir as atualizações (usado no logout)
    stopListening() {
        if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
        }
        allPatients = [];
        this.renderList();
    },

    // Renderiza a lista de pacientes no HTML
    renderList() {
        elements.listContainer.innerHTML = '';
        if (allPatients.length === 0) {
            elements.listContainer.innerHTML = '<p class="p-8 text-center text-gray-500">Nenhum paciente cadastrado.</p>';
            return;
        }

        allPatients.forEach(patient => {
            const div = document.createElement('div');
            div.className = 'p-4 hover:bg-gray-50 flex justify-between items-center';
            div.innerHTML = `
                <div>
                    <h3 class="text-lg font-bold text-blue-700">${patient.name}</h3>
                    <p class="text-sm text-gray-600">${patient.phone || 'Sem telefone'}</p>
                </div>
                <div>
                    <button data-patient-id="${patient.id}" class="edit-btn font-semibold text-blue-600">Editar</button>
                </div>
            `;
            elements.listContainer.appendChild(div);
        });
    },
    
    // Configura todos os botões e formulários
    setupEventListeners() {
        document.getElementById('add-patient-btn').addEventListener('click', () => this.openModal());
        
        modal.querySelector('.cancel-modal-btn').addEventListener('click', () => this.closeModal());
        
        elements.listContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-btn')) {
                const id = e.target.dataset.patientId;
                const patient = allPatients.find(p => p.id === id);
                this.openModal(patient);
            }
        });

        form.addEventListener('submit', (e) => this.handleSave(e));
    },

    openModal(patient = null) {
        form.reset();
        if (patient) {
            elements.modalTitle.textContent = 'Editar Paciente';
            elements.patientIdInput.value = patient.id;
            elements.patientNameInput.value = patient.name;
            elements.patientPhoneInput.value = patient.phone;
        } else {
            elements.modalTitle.textContent = 'Adicionar Paciente';
            elements.patientIdInput.value = '';
        }
        modal.classList.remove('hidden');
    },

    closeModal() {
        modal.classList.add('hidden');
    },

    async handleSave(event) {
        event.preventDefault();
        ui.showLoading();
        const id = elements.patientIdInput.value;
        const data = {
            name: elements.patientNameInput.value,
            phone: elements.patientPhoneInput.value,
        };

        try {
            if (id) {
                const patientRef = firebase.doc(db, 'clinics', clinicId, 'patients', id);
                await firebase.updateDoc(patientRef, data);
            } else {
                await firebase.addDoc(firebase.collection(db, 'clinics', clinicId, 'patients'), data);
            }
            this.closeModal();
        } catch (error) {
            console.error("Erro ao salvar paciente:", error);
            // Adicionar mensagem de erro para o usuário
        } finally {
            ui.hideLoading();
        }
    },
};