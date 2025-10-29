// js/app.js
import { initializeAuth } from './auth.js';
import { initializeClinicStore } from './stores/clinicStore.js';
import { initializePatientsStore, patientActions } from './stores/patientStore.js';

// Este evento garante que nosso código só rode DEPOIS que o Alpine.js estiver pronto.
document.addEventListener('alpine:init', () => {
    // Registra um "dado global" chamado 'app'.
    // No HTML, nós chamamos isso com x-data="app".
    Alpine.data('app', () => ({
        // --- ESTADO GLOBAL ---
        isLoading: true,
        activeView: 'inicio', // 'pacientes', 'agenda', etc.

        // --- MÓDULOS DE ESTADO ---
        auth: {
            isLoggedIn: false,
            isRegisterView: false,
            user: null,
            form: { email: '', password: '' },
            errorMessage: '',
        },
        clinic: {
            id: null,
            data: {},
        },
        patients: {
            all: [],
        },
        
        // --- MODAIS ---
        modal: {
            isOpen: false,
            type: null,    // 'patient', 'appointment', etc.
            data: {},      // Dados para o modal (ex: paciente para editar)
        },
        
        // --- INICIALIZAÇÃO ---
        init() {
            console.log('FisioGestão App inicializado.');
            
            // Passa o contexto do app para os módulos de inicialização
            initializeAuth(this);
            initializeClinicStore(this);
            initializePatientsStore(this);

            // Ouvinte de evento para abrir modais de forma global
            this.$watch('modal.type', (type) => this.modal.isOpen = !!type);
            this.$root.addEventListener('open-modal', (event) => {
                this.openModal(event.detail.type, event.detail.data);
            });
            
            setTimeout(() => this.isLoading = false, 500);
        },
        
        // --- MÉTODOS GLOBAIS ---
        openModal(type, data = {}) {
            this.modal.type = type;
            this.modal.data = JSON.parse(JSON.stringify(data));
        },
        closeModal() {
            this.modal.type = null;
            this.modal.data = {};
        },

        // --- MÉTODOS ESPECÍFICOS (Ações) ---
        async savePatient() {
            this.isLoading = true;
            try {
                if (this.modal.data.id) {
                    await patientActions.update(this.clinic.id, this.modal.data.id, this.modal.data);
                } else {
                    await patientActions.add(this.clinic.id, this.modal.data);
                }
                this.closeModal();
            } catch (e) {
                console.error("Erro ao salvar paciente:", e);
            } finally {
                this.isLoading = false;
            }
        },
    }));

    // Registra um escopo de dados separado para a página de pacientes
    Alpine.data('patientsScope', function () {
        return {
            searchTerm: '',
            selectedPatientId: null,
            selectedPatient: null,
            
            get filteredPatients() {
                // Acessa o estado global do app através de $store.app
                if (!this.searchTerm.trim()) return this.$store.app.patients.all;
                return this.$store.app.patients.all.filter(p =>
                    p.name.toLowerCase().includes(this.searchTerm.toLowerCase())
                );
            },
            
            viewPatient(id) {
                this.selectedPatient = this.$store.app.patients.all.find(p => p.id === id) || null;
                this.selectedPatientId = id;
            },

            backToList() {
                this.selectedPatientId = null;
                this.selectedPatient = null;
            }
        }
    });
});