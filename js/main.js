// js/main.js

import { authStore } from './stores/authStore.js';
import { clinicStore } from './stores/clinicStore.js';
import { patientStore } from './stores/patientStore.js';

document.addEventListener('alpine:init', () => {
    Alpine.data('main', () => ({
        // Estado global da UI
        isLoading: true,
        activeView: 'inicio',
        
        // Cada "store" é uma parte do nosso estado global
        auth: authStore(),
        clinic: clinicStore(),
        patients: patientStore(),

        // Agrupa os modais
        modals: {
            patient: {
                isOpen: false,
                isEditing: false,
                form: {}, // O formulário do modal é gerenciado pelo patientStore
            },
        },

        // Função de inicialização
        init() {
            // Conecta os stores para que possam se comunicar
            // O this aqui é o objeto 'main'
            this.auth.init(this);
            this.clinic.init(this);
            this.patients.init(this);

            this.isLoading = false;
        }
    }));
});