// js/main.js
import { firebase, db } from './firebase.js';
import { authModule } from './auth.js';
import { ui } from './ui.js';
import { patientsModule } from './patients.js';

// Função executada quando o usuário está logado
async function handleLogin(user) {
    ui.showLoading();
    console.log('Usuário logado:', user.email);

    // LÓGICA PARA BUSCAR O clinicId - ESSA PARTE É CRUCIAL
    // Vamos buscar o documento do usuário para encontrar o clinicId associado.
    const userDocRef = firebase.doc(db, 'users', user.uid);
    const userDoc = await firebase.getDoc(userDocRef);

    if (userDoc.exists() && userDoc.data().clinicId) {
        const clinicId = userDoc.data().clinicId;
        
        // Agora, buscamos os dados da clínica
        const clinicDocRef = firebase.doc(db, 'clinics', clinicId);
        const clinicDoc = await firebase.getDoc(clinicDocRef);
        const clinicData = clinicDoc.exists() ? clinicDoc.data() : { name: 'Clínica não encontrada' };
        
        // Inicia os módulos que dependem de dados
        patientsModule.startListening(clinicId);
        ui.updateUserInfo(user, clinicData);
        ui.showView('dashboard');
    } else {
        // Se o usuário não tem um clinicId, não deixamos ele entrar.
        console.error("Usuário não está associado a nenhuma clínica!");
        authModule.handleLogout(); // Desloga o usuário
        alert("Sua conta não está associada a nenhuma clínica. Contate o suporte.");
    }
    ui.hideLoading();
}

// Função executada quando o usuário desloga
function handleLogout() {
    console.log('Usuário deslogado.');
    patientsModule.stopListening(); // Para de ouvir os dados
    ui.showView('auth');
}

// --- PONTO DE PARTIDA DA APLICAÇÃO ---
function main() {
    // Inicia os módulos que não dependem de dados
    ui.setupNavigation();
    patientsModule.init();
    
    // Inicia a autenticação, passando as funções de callback
    authModule.init(handleLogin, handleLogout);
}

// Roda a função principal quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', main);