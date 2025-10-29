// js/auth.js
import { auth, firebase } from './firebase.js';
import { ui } from './ui.js';

let currentUser = null;
let onLoginCallback = () => {};
let onLogoutCallback = () => {};

export const authModule = {
    // Inicializa o módulo de autenticação e o observador de estado
    init(onLogin, onLogout) {
        onLoginCallback = onLogin;
        onLogoutCallback = onLogout;
        
        firebase.onAuthStateChanged(auth, user => {
            currentUser = user;
            if (user) {
                onLoginCallback(user);
            } else {
                onLogoutCallback();
            }
            ui.hideLoading();
        });

        this.setupLoginForm();
        this.setupLogoutButton();
    },

    // Configura o formulário de login
    setupLoginForm() {
        const form = document.getElementById('login-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            ui.showLoading();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const errorEl = document.getElementById('login-error');
            
            try {
                await firebase.signInWithEmailAndPassword(auth, email, password);
                errorEl.textContent = '';
                // O onAuthStateChanged vai cuidar da mudança de tela
            } catch (error) {
                errorEl.textContent = 'E-mail ou senha inválidos.';
                ui.hideLoading();
            }
        });
    },

    // Configura o botão de logout
    setupLogoutButton() {
        document.getElementById('logout-btn').addEventListener('click', () => {
            firebase.signOut(auth);
        });
    },

    // Permite que outros módulos acessem o usuário atual
    getCurrentUser: () => currentUser,
};