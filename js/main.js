// js/main.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, doc, onSnapshot, addDoc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- CONFIGURAÇÃO DO FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyB5DK7R3WGtKIUy_fMt8iNKBtz9wgdBxVs",
    authDomain: "fisioterapia-cee9d.firebaseapp.com",
    projectId: "fisioterapia-cee9d",
    storageBucket: "fisioterapia-cee9d.appspot.com",
    messagingSenderId: "551406348997",
    appId: "1:551406348997:web:7b21e0d90ebf4969955eac"
};

// --- INICIALIZAÇÃO DO APP E SERVIÇOS ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- ESTADO GLOBAL DA APLICAÇÃO ---
let state = {
    currentUser: null,
    clinicId: null,
    patients: [],
    unsubscribePatients: null,
};

// --- SELETORES DE ELEMENTOS DO DOM ---
const dom = {
    loading: document.getElementById('loading-overlay'),
    authView: document.getElementById('auth-view'),
    dashboardView: document.getElementById('dashboard-view'),
    pages: document.querySelectorAll('.page-content'),
    navLinks: document.querySelectorAll('#sidebar-nav .sidebar-link'),
    userEmail: document.getElementById('user-email-sidebar'),
    clinicName: document.getElementById('clinic-name-sidebar'),
    patientsList: document.getElementById('patients-list-container'),
    // Modais
    patientModal: {
        el: document.getElementById('patient-modal'),
        form: document.getElementById('patient-form'),
        title: document.getElementById('patient-modal-title'),
        idInput: document.getElementById('patient-id'),
        nameInput: document.getElementById('patient-name'),
        phoneInput: document.getElementById('patient-phone'),
    }
};

// ==============================================
// MÓDULO DE UI (INTERFACE DO USUÁRIO)
// ==============================================
const ui = {
    showLoading: () => dom.loading.classList.remove('hidden'),
    hideLoading: () => dom.loading.classList.add('hidden'),

    showView: (viewName) => {
        dom.authView.classList.add('hidden');
        dom.dashboardView.classList.add('hidden');
        if (viewName === 'auth') dom.authView.classList.remove('hidden');
        if (viewName === 'dashboard') dom.dashboardView.classList.remove('hidden');
    },

    showPage: (pageName) => {
        dom.pages.forEach(p => p.classList.add('hidden'));
        document.getElementById(`page-${pageName}`)?.classList.remove('hidden');
        dom.navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.view === pageName);
        });
    },

    updateUserInfo: (user, clinicData = {}) => {
        dom.userEmail.textContent = user.email;
        dom.clinicName.textContent = clinicData.name || 'FisioGestão';
    },

    renderPatientList: () => {
        dom.patientsList.innerHTML = '';
        if (state.patients.length === 0) {
            dom.patientsList.innerHTML = '<p class="p-8 text-center text-gray-500">Nenhum paciente cadastrado.</p>';
            return;
        }
        state.patients.forEach(patient => {
            const div = document.createElement('div');
            div.className = 'p-4 hover:bg-gray-50 flex justify-between items-center';
            div.innerHTML = `
                <div>
                    <h3 class="text-lg font-bold text-blue-700">${patient.name}</h3>
                    <p class="text-sm text-gray-600">${patient.phone || 'Sem telefone'}</p>
                </div>
                <div>
                    <button data-patient-id="${patient.id}" class="edit-patient-btn font-semibold text-blue-600">Editar</button>
                </div>`;
            dom.patientsList.appendChild(div);
        });
    },
};

// ==============================================
// MÓDULO DE PACIENTES
// ==============================================
const patientsModule = {
    openModal: (patient = null) => {
        dom.patientModal.form.reset();
        if (patient) {
            dom.patientModal.title.textContent = 'Editar Paciente';
            dom.patientModal.idInput.value = patient.id;
            dom.patientModal.nameInput.value = patient.name;
            dom.patientModal.phoneInput.value = patient.phone;
        } else {
            dom.patientModal.title.textContent = 'Adicionar Paciente';
            dom.patientModal.idInput.value = '';
        }
        dom.patientModal.el.classList.remove('hidden');
    },

    closeModal: () => {
        dom.patientModal.el.classList.add('hidden');
    },

    handleSave: async (event) => {
        event.preventDefault();
        ui.showLoading();
        const id = dom.patientModal.idInput.value;
        const data = {
            name: dom.patientModal.nameInput.value,
            phone: dom.patientModal.phoneInput.value,
        };

        try {
            if (id) {
                const patientRef = doc(db, 'clinics', state.clinicId, 'patients', id);
                await updateDoc(patientRef, data);
            } else {
                await addDoc(collection(db, 'clinics', state.clinicId, 'patients'), data);
            }
            patientsModule.closeModal();
        } catch (error) {
            console.error("Erro ao salvar paciente:", error);
            alert("Ocorreu um erro ao salvar o paciente.");
        } finally {
            ui.hideLoading();
        }
    },
    
    startListening: (clinicId) => {
        state.clinicId = clinicId;
        const patientsRef = collection(db, 'clinics', clinicId, 'patients');
        state.unsubscribePatients = onSnapshot(patientsRef, (snapshot) => {
            state.patients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            ui.renderPatientList();
        });
    },

    stopListening: () => {
        if (state.unsubscribePatients) state.unsubscribePatients();
        state.patients = [];
        ui.renderPatientList();
    }
};

// ==============================================
// LÓGICA PRINCIPAL E INICIALIZAÇÃO
// ==============================================

// Chamado quando o usuário faz login
async function onLogin(user) {
    ui.showLoading();
    
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists() && userDoc.data().clinicId) {
        const clinicId = userDoc.data().clinicId;
        const clinicDocRef = doc(db, 'clinics', clinicId);
        const clinicDoc = await getDoc(clinicDocRef);
        const clinicData = clinicDoc.exists() ? clinicDoc.data() : {};
        
        ui.updateUserInfo(user, clinicData);
        patientsModule.startListening(clinicId);
        ui.showView('dashboard');
    } else {
        alert("Sua conta não está associada a nenhuma clínica. Contate o suporte.");
        signOut(auth);
    }
    ui.hideLoading();
}

// Chamado quando o usuário faz logout
function onLogout() {
    patientsModule.stopListening();
    ui.showView('auth');
}

// Configura todos os ouvintes de eventos da aplicação
function setupEventListeners() {
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        ui.showLoading();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            document.getElementById('login-error').textContent = 'E-mail ou senha inválidos.';
            ui.hideLoading();
        }
    });

    document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));

    dom.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            ui.showPage(link.dataset.view);
        });
    });

    document.getElementById('add-patient-btn').addEventListener('click', () => patientsModule.openModal());
    dom.patientModal.el.querySelector('.cancel-modal-btn').addEventListener('click', () => patientsModule.closeModal());
    dom.patientModal.form.addEventListener('submit', patientsModule.handleSave);
    
    dom.patientsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-patient-btn')) {
            const id = e.target.dataset.patientId;
            const patient = state.patients.find(p => p.id === id);
            patientsModule.openModal(patient);
        }
    });
}

// --- PONTO DE ENTRADA ---
function main() {
    setupEventListeners();
    onAuthStateChanged(auth, user => {
        state.currentUser = user;
        if (user) {
            onLogin(user);
        } else {
            onLogout();
        }
    });
}

// Inicia a aplicação
main();