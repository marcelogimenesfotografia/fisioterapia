// js/auth.js
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { auth } from './firebase.js';

export function initializeAuth(appContext) {
    onAuthStateChanged(auth, user => {
        appContext.auth.isLoggedIn = !!user;
        appContext.auth.user = user;
        if (!user) {
            appContext.activeView = 'inicio'; // Reseta a view no logout
        }
        appContext.isLoading = false; // Finaliza o loading após a verificação de auth
    });

    appContext.auth.handleLogin = async () => {
        appContext.isLoading = true;
        appContext.auth.errorMessage = '';
        try {
            await signInWithEmailAndPassword(auth, appContext.auth.form.email, appContext.auth.form.password);
        } catch (error) {
            appContext.auth.errorMessage = 'E-mail ou senha inválidos.';
            console.error("Erro de login:", error.message);
        } finally {
            appContext.isLoading = false;
        }
    };
    appContext.auth.handleLogout = async () => signOut(auth);
}