// js/main.js
import { initializeAuth, setupLoginForm, setupLogoutButton, getCurrentUser } from './auth.js';
import { showView, setupNavigation, updateUserInfo } from './ui.js';
import { listenToPatients, setupPatientActions } from './patientStore.js';

// Função executada quando o usuário está logado
function onLogin(user) {
    console.log('Usuário logado:', user.email);
    // !! IMPORTANTE: Substitua pela lógica real para obter o ID da clínica !!
    const clinicId = "Cg071Ld6G4aU05E1kI3H"; 
    
    updateUserInfo(user);
    listenToPatients(clinicId);
    showView('dashboard');
}

// Função executada quando o usuário desloga
function onLogout() {
    console.log('Usuário deslogado.');
    showView('auth');
}

// --- PONTO DE PARTIDA DA APLICAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    // Configura os ouvintes de eventos
    setupLoginForm();
    setupLogoutButton();
    setupNavigation();
    setupPatientActions();

    // Inicia o processo de autenticação
    initializeAuth(onLogin, onLogout);
});