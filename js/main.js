// js/main.js

// --- 1. IMPORTAÇÕES E CONFIGURAÇÃO DO FIREBASE ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, reauthenticateWithCredential, EmailAuthProvider, updatePassword, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, collection, addDoc, getDoc, setDoc, deleteDoc, onSnapshot, query, where, updateDoc, serverTimestamp, deleteField, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyB5DK7R3WGtKIUy_fMt8iNKBtz9wgdBxVs",
    authDomain: "fisioterapia-cee9d.firebaseapp.com",
    projectId: "fisioterapia-cee9d",
    storageBucket: "fisioterapia-cee9d.appspot.com",
    messagingSenderId: "551406348997",
    appId: "1:551406348997:web:7b21e0d90ebf4969955eac"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- 2. ESTADO GLOBAL DA APLICAÇÃO ---
const state = {
    currentUser: null,
    clinicId: null,
    userRole: null,
    allPatients: [],
    listeners: {} // Armazena os 'unsubscribes' do Firestore
};

// --- 3. SELETORES DE ELEMENTOS DO DOM ---
const dom = {
    loadingOverlay: document.getElementById('loading-overlay'),
    authView: document.getElementById('auth-view'),
    dashboardView: document.getElementById('dashboard-view'),
    loginContainer: document.getElementById('login-container'),
    registerContainer: document.getElementById('register-container'),
    // Adicione outros seletores principais conforme necessário...
};

// ==============================================
// MÓDULO DE UI - Funções que manipulam a tela
// ==============================================
const uiModule = {
    showLoading: () => dom.loadingOverlay.classList.remove('hidden'),
    hideLoading: () => dom.loadingOverlay.classList.add('hidden'),

    showView: (viewName) => {
        dom.authView.classList.add('hidden');
        dom.dashboardView.classList.add('hidden');
        if (viewName === 'auth') dom.authView.classList.remove('hidden');
        if (viewName === 'dashboard') dom.dashboardView.classList.remove('hidden');
    },

    showPage: (pageName) => {
        document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
        document.getElementById(`page-${pageName}`)?.classList.add('active');
        document.querySelectorAll('#sidebar-nav .sidebar-link').forEach(link => {
            link.classList.toggle('active', link.dataset.view === pageName);
        });
    },

    openModal: (modalId) => document.getElementById(modalId)?.classList.replace('hidden', 'flex'),
    closeModal: (modalId) => document.getElementById(modalId)?.classList.replace('flex', 'hidden'),

    showMessage: (title, text, isError = false) => {
        const modal = document.getElementById('js-message-modal');
        if (!modal) { alert(text); return; }
        modal.querySelector('#js-message-title').textContent = title;
        modal.querySelector('#js-message-text').textContent = text;
        modal.querySelector('#js-message-title').classList.toggle('text-red-600', isError);
        modal.querySelector('#js-message-title').classList.toggle('text-blue-600', !isError);
        uiModule.openModal('js-message-modal');
    },

    showConfirmation: (title, text, onConfirm) => {
        const modal = document.getElementById('confirm-modal');
        if (!modal) { if (confirm(text)) onConfirm(); return; }
        modal.querySelector('#confirm-modal-title').textContent = title;
        modal.querySelector('#confirm-modal-text').textContent = text;
        
        const confirmBtn = modal.querySelector('#confirm-modal-confirm');
        const cancelBtn = modal.querySelector('#confirm-modal-cancel');
        
        const newConfirmBtn = confirmBtn.cloneNode(true); // Evita múltiplos listeners
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

        const confirmHandler = () => {
            onConfirm();
            uiModule.closeModal('confirm-modal');
        };

        newConfirmBtn.addEventListener('click', confirmHandler, { once: true });
        cancelBtn.addEventListener('click', () => uiModule.closeModal('confirm-modal'), { once: true });

        uiModule.openModal('confirm-modal');
    },

    renderPatientList: (patients) => {
        const container = document.getElementById('patients-container');
        const msgLoading = document.getElementById('loading-patients-msg');
        const msgNoPatients = document.getElementById('no-patients-message');
        
        if (!container || !msgLoading || !msgNoPatients) return;

        msgLoading.style.display = 'none';
        container.innerHTML = '';

        if (patients.length === 0) {
            msgNoPatients.style.display = 'block';
            container.style.display = 'none';
            return;
        }

        msgNoPatients.style.display = 'none';
        container.style.display = 'block';

        patients.sort((a, b) => a.name.localeCompare(b.name));

        patients.forEach(patient => {
            const card = document.createElement('div');
            card.className = 'p-4 hover:bg-gray-50 flex flex-col sm:flex-row justify-between sm:items-center';
            card.innerHTML = `
                <div class="flex-1 min-w-0">
                    <h3 class="text-lg font-bold text-blue-700 truncate">${patient.name}</h3>
                    <p class="text-sm text-gray-600">${patient.phone || 'Sem telefone'}</p>
                </div>
                <div class="mt-4 sm:mt-0 flex-shrink-0 flex space-x-2">
                    <button data-id="${patient.id}" class="view-patient-btn bg-green-100 text-green-800 p-2 rounded-lg" title="Ver Prontuário">Ver</button>
                    <button data-id="${patient.id}" class="edit-patient-btn bg-yellow-100 text-yellow-800 p-2 rounded-lg" title="Editar Cadastro">Editar</button>
                    <button data-id="${patient.id}" class="delete-patient-btn bg-red-100 text-red-800 p-2 rounded-lg" title="Excluir Paciente">Excluir</button>
                </div>`;
            container.appendChild(card);
        });
    },

    // AQUI ENTRARIAM TODAS AS OUTRAS FUNÇÕES DE RENDERIZAÇÃO:
    // renderPatientDetails, renderAssessmentList, renderAgendaView, etc.
};

// ==============================================
// MÓDULO DE PACIENTES
// ==============================================
const patientsModule = {
    init() {
        // Listeners dos botões principais
        document.getElementById('add-patient-btn').addEventListener('click', () => this.openModal());
        document.getElementById('quick-add-patient-btn')?.addEventListener('click', () => this.openModal());
        
        // Listeners do modal de paciente
        const patientModal = document.getElementById('patient-modal');
        patientModal.querySelectorAll('.close-modal-btn, #cancel-patient-modal').forEach(btn => {
            btn.addEventListener('click', () => uiModule.closeModal('patient-modal'));
        });
        document.getElementById('patient-form').addEventListener('submit', (e) => this.handleSave(e));
        
        // Listeners para a lista de pacientes (delegação de eventos)
        document.getElementById('patients-container').addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button?.dataset.id) return;

            const patientId = button.dataset.id;
            const patient = state.allPatients.find(p => p.id === patientId);

            if (button.classList.contains('edit-patient-btn')) this.openModal(patient);
            if (button.classList.contains('delete-patient-btn')) this.handleDelete(patient);
            if (button.classList.contains('view-patient-btn')) this.showDetailView(patient);
        });
        
        // Botão de voltar da tela de detalhes
        document.getElementById('back-to-list-btn').addEventListener('click', () => {
            document.getElementById('patient-list-view').style.display = 'block';
            document.getElementById('patient-detail-view').style.display = 'none';
        });
    },

    openModal(patient = null) {
        const form = document.getElementById('patient-form');
        const title = document.getElementById('patient-modal-title');
        form.reset();
        
        if (patient) {
            title.textContent = 'Editar Paciente';
            Object.keys(patient).forEach(key => {
                const input = form.querySelector(`#patient-${key}`);
                if (input) input.value = patient[key];
            });
            document.getElementById('patient-id').value = patient.id;
        } else {
            title.textContent = 'Adicionar Novo Paciente';
            document.getElementById('patient-id').value = '';
        }
        uiModule.openModal('patient-modal');
    },

    async handleSave(event) {
        event.preventDefault();
        uiModule.showLoading();
        
        const form = event.target;
        const id = form.querySelector('#patient-id').value;
        const data = {
            name: form.querySelector('#patient-name').value,
            cpf: form.querySelector('#patient-cpf').value,
            birthDate: form.querySelector('#patient-birthDate').value,
            gender: form.querySelector('#patient-gender').value,
            phone: form.querySelector('#patient-phone').value,
            caregiver: form.querySelector('#patient-caregiver')?.value,
            cep: form.querySelector('#patient-cep')?.value,
            street: form.querySelector('#patient-street')?.value,
            number: form.querySelector('#patient-number')?.value,
            neighborhood: form.querySelector('#patient-neighborhood')?.value,
            city: form.querySelector('#patient-city')?.value,
            state: form.querySelector('#patient-state')?.value,
            observations: form.querySelector('#patient-observations').value,
        };

        try {
            if (id) {
                await updateDoc(doc(db, 'clinics', state.clinicId, 'patients', id), data);
            } else {
                await addDoc(collection(db, 'clinics', state.clinicId, 'patients'), data);
            }
            uiModule.closeModal('patient-modal');
        } catch (error) {
            console.error("Erro ao salvar paciente:", error);
            uiModule.showMessage("Erro", "Ocorreu um erro ao salvar o paciente.", true);
        } finally {
            uiModule.hideLoading();
        }
    },

    async handleDelete(patient) {
        uiModule.showConfirmation(
            'Excluir Paciente', 
            `Tem certeza que deseja excluir ${patient.name}? Esta ação não pode ser desfeita.`, 
            async () => {
                uiModule.showLoading();
                try {
                    await deleteDoc(doc(db, 'clinics', state.clinicId, 'patients', patient.id));
                    uiModule.showMessage("Sucesso", "Paciente excluído.");
                } catch (error) {
                    console.error("Erro ao excluir paciente:", error);
                    uiModule.showMessage("Erro", "Ocorreu um erro ao excluir.", true);
                } finally {
                    uiModule.hideLoading();
                }
            }
        );
    },

    showDetailView(patient) {
        document.getElementById('patient-list-view').style.display = 'none';
        document.getElementById('patient-detail-view').style.display = 'block';
        // Aqui você chamaria uma função de renderização para os detalhes
        // Ex: uiModule.renderPatientDetails(patient);
        document.getElementById('patient-info-container').innerHTML = `<h2 class="text-2xl">${patient.name}</h2><p>${patient.cpf}</p>`;
    },
    
    startListening(clinicId) {
        if (state.listeners.patients) state.listeners.patients();
        const patientsRef = collection(db, 'clinics', clinicId, 'patients');
        state.listeners.patients = onSnapshot(patientsRef, (snapshot) => {
            state.allPatients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            uiModule.renderPatientList(state.allPatients);
        });
    },

    stopListening() {
        if (state.listeners.patients) state.listeners.patients();
    }
};

// ==============================================
// MÓDULO DE AUTENTICAÇÃO
// ==============================================
const authModule = {
    async onLogin(user) {
        uiModule.showLoading();
        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists() && userDoc.data().clinicId) {
                const userData = userDoc.data();
                state.clinicId = userData.clinicId;
                state.userRole = userData.role;

                state.listeners.clinic = onSnapshot(doc(db, 'clinics', state.clinicId), (clinicDoc) => {
                    const clinicData = clinicDoc.exists() ? clinicDoc.data() : {};
                    document.getElementById('clinic-name-sidebar').textContent = clinicData.name || 'FisioGestão';
                    document.getElementById('user-email').textContent = user.email;
                });

                patientsModule.startListening(state.clinicId);
                uiModule.showView('dashboard');
                uiModule.showPage('inicio');
            } else {
                alert("Sua conta não está associada a nenhuma clínica.");
                signOut(auth);
            }
        } catch(error) {
            console.error("Erro no login:", error);
            alert("Ocorreu um erro ao carregar seus dados.");
            signOut(auth);
        } finally {
            uiModule.hideLoading();
        }
    },

    onLogout() {
        Object.values(state.listeners).forEach(unsubscribe => unsubscribe && unsubscribe());
        Object.assign(state, { currentUser: null, clinicId: null, userRole: null, allPatients: [] });
        uiModule.showView('auth');
        uiModule.hideLoading();
    },

    init() {
        onAuthStateChanged(auth, (user) => {
            state.currentUser = user;
            user ? this.onLogin(user) : this.onLogout();
        });
    }
};

// ==============================================
// FUNÇÕES UTILITÁRIAS E GLOBAIS
// ==============================================
async function fetchAddressFromCEP(cep, prefix) {
    const cepClean = cep.replace(/\D/g, '');
    if (cepClean.length !== 8) return;
    uiModule.showLoading();
    try {
        const response = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`);
        const data = await response.json();
        if (!data.erro) {
            document.getElementById(`${prefix}-street`).value = data.logradouro || '';
            document.getElementById(`${prefix}-neighborhood`).value = data.bairro || '';
            document.getElementById(`${prefix}-city`).value = data.localidade || '';
            document.getElementById(`${prefix}-state`).value = data.uf || '';
            document.getElementById(`${prefix}-number`).focus();
        }
    } catch (error) {
        console.error("Erro ao buscar CEP:", error);
    } finally {
        uiModule.hideLoading();
    }
}

// ==============================================
// PONTO DE ENTRADA E EVENT LISTENERS
// ==============================================
function main() {
    console.log("Aplicação FisioGestão iniciada.");
    uiModule.showLoading();
    
    // Configura listeners de eventos estáticos
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        uiModule.showLoading();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            document.getElementById('login-error').textContent = 'E-mail ou senha inválidos.';
            uiModule.hideLoading();
        }
    });

    document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));

    document.getElementById('sidebar-nav').addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link?.dataset.view) uiModule.showPage(link.dataset.view);
    });

    document.getElementById('show-register-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        dom.loginContainer.classList.add('hidden');
        dom.registerContainer.classList.remove('hidden');
    });

    document.getElementById('show-login-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        dom.registerContainer.classList.add('hidden');
        dom.loginContainer.classList.remove('hidden');
    });

    document.body.addEventListener('blur', (e) => {
        const target = e.target;
        if (target.matches('input[id$="-cep"]')) {
            const prefix = target.id.replace('-cep', '');
            fetchAddressFromCEP(target.value, prefix);
        }
    }, true);

    document.getElementById('js-message-close')?.addEventListener('click', () => uiModule.closeModal('js-message-modal'));
    
    // Inicializa os módulos
    patientsModule.init();
    // Inicialize outros módulos aqui (agenda, financeiro, etc)

    // Inicia a autenticação, que comanda o fluxo da aplicação
    authModule.init();
}

// Roda a função principal
main();