// js/auth.js
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { auth } from './firebase.js';
import { showView, showLoading, hideLoading } from './ui.js';

let currentUser = null;

// Função que observa o estado do login
export function initializeAuth(onLogin, onLogout) {
    onAuthStateChanged(auth, user => {
        if (user) {
            currentUser = user;
            onLogin(user); // Chama a função para quando o usuário loga
        } else {
            currentUser = null;
            onLogout(); // Chama a função para quando o usuário desloga
        }
        hideLoading();
    });
}

// Função para lidar com o formulário de login
export function setupLoginForm() {
    const form = document.getElementById('login-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoading();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorEl = document.getElementById('login-error');
        
        try {
            await signInWithEmailAndPassword(auth, email, password);
            errorEl.textContent = '';
            // O onAuthStateChanged vai cuidar do resto
        } catch (error) {
            errorEl.textContent = 'E-mail ou senha inválidos.';
            hideLoading();
        }
    });
}

// Função para lidar com o botão de logout
export function setupLogoutButton() {
    const btn = document.getElementById('logout-btn');
    btn.addEventListener('click', async () => {
        await signOut(auth);
    });
}

// Função para pegar o usuário atual em outros arquivos
export function getCurrentUser() {
    return currentUser;
}