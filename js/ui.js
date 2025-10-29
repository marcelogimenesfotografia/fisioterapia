// js/ui.js

// Estado da UI
const views = {
    auth: document.getElementById('auth-view'),
    dashboard: document.getElementById('dashboard-view'),
};
const pages = document.querySelectorAll('.page-content');
const navLinks = document.querySelectorAll('.sidebar-link');

// Funções para controlar a visibilidade
export function showLoading() { document.getElementById('loading-overlay').classList.remove('hidden'); }
export function hideLoading() { document.getElementById('loading-overlay').classList.add('hidden'); }

export function showView(viewName) {
    Object.values(views).forEach(v => v.classList.add('hidden'));
    if (views[viewName]) {
        views[viewName].classList.remove('hidden');
    }
}

function showPage(pageName) {
    pages.forEach(p => p.classList.add('hidden'));
    document.getElementById(`page-${pageName}`).classList.remove('hidden');

    navLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.view === pageName);
    });
}

// Configura a navegação da sidebar
export function setupNavigation() {
    const nav = document.getElementById('sidebar-nav');
    nav.addEventListener('click', (e) => {
        e.preventDefault();
        const link = e.target.closest('a');
        if (link && link.dataset.view) {
            showPage(link.dataset.view);
        }
    });
}

// Preenche os dados do usuário na interface
export function updateUserInfo(user) {
    document.getElementById('user-email-sidebar').textContent = user.email;
}```

---

#### 5. Arquivo: `js/patientStore.js` (Lógica de Pacientes)

Este arquivo só se preocupa com os pacientes.

```javascript
// js/patientStore.js
import { collection, onSnapshot, addDoc, updateDoc, doc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db } from './firebase.js';

let clinicId = null; // Vamos definir isso no login
let allPatients = [];

const modal = document.getElementById('patient-modal');
const modalTitle = document.getElementById('patient-modal-title');
const form = document.getElementById('patient-form');
const patientIdInput = document.getElementById('patient-id');
const patientNameInput = document.getElementById('patient-name');
const patientPhoneInput = document.getElementById('patient-phone');

// Função para escutar as mudanças nos pacientes
export function listenToPatients(currentClinicId) {
    clinicId = currentClinicId;
    const patientsRef = collection(db, 'clinics', clinicId, 'patients');
    
    onSnapshot(patientsRef, (snapshot) => {
        allPatients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderPatientList(allPatients);
    });
}

// Renderiza a lista de pacientes no HTML
function renderPatientList(patients) {
    const container = document.getElementById('patients-list-container');
    container.innerHTML = '';
    if (patients.length === 0) {
        container.innerHTML = '<p class="p-8 text-center text-gray-500">Nenhum paciente cadastrado.</p>';
        return;
    }

    patients.forEach(patient => {
        const div = document.createElement('div');
        div.className = 'p-4 hover:bg-gray-50 flex justify-between items-center';
        div.innerHTML = `
            <div>
                <h3 class="text-lg font-bold text-blue-700">${patient.name}</h3>
                <p class="text-sm text-gray-600">${patient.phone || 'Sem telefone'}</p>
            </div>
            <div>
                <button data-patient-id="${patient.id}" class="edit-patient-btn font-semibold text-blue-600">Editar</button>
            </div>
        `;
        container.appendChild(div);
    });
}

// Abre o modal
function openPatientModal(patient = null) {
    form.reset();
    if (patient) {
        modalTitle.textContent = 'Editar Paciente';
        patientIdInput.value = patient.id;
        patientNameInput.value = patient.name;
        patientPhoneInput.value = patient.phone;
    } else {
        modalTitle.textContent = 'Adicionar Paciente';
        patientIdInput.value = '';
    }
    modal.classList.remove('hidden');
}

// Fecha o modal
function closePatientModal() {
    modal.classList.add('hidden');
}

// Configura todos os eventos relacionados a pacientes
export function setupPatientActions() {
    document.getElementById('add-patient-btn').addEventListener('click', () => openPatientModal());
    document.getElementById('cancel-patient-modal-btn').addEventListener('click', closePatientModal);
    
    document.getElementById('patients-list-container').addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-patient-btn')) {
            const patientId = e.target.dataset.patientId;
            const patient = allPatients.find(p => p.id === patientId);
            openPatientModal(patient);
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = patientIdInput.value;
        const patientData = {
            name: patientNameInput.value,
            phone: patientPhoneInput.value,
        };

        if (id) { // Editando
            const patientRef = doc(db, 'clinics', clinicId, 'patients', id);
            await updateDoc(patientRef, patientData);
        } else { // Criando
            await addDoc(collection(db, 'clinics', clinicId, 'patients'), patientData);
        }
        closePatientModal();
    });
}