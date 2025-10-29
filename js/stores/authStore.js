// js/stores/authStore.js
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { auth } from '../firebase.js';

export const authStore = () => ({
    isLoggedIn: false,
    isRegisterView: false,
    user: null,
    form: { email: '', password: '' },
    errorMessage: '',
    _app: null, // Referência ao contexto principal

    init(appContext) {
        this._app = appContext;
        onAuthStateChanged(auth, (user) => {
            this.isLoggedIn = !!user;
            this.user = user;
            this._app.isLoading = false;
        });
    },

    async handleLogin() {
        this._app.isLoading = true;
        this.errorMessage = '';
        try {
            await signInWithEmailAndPassword(auth, this.form.email, this.form.password);
        } catch (error) {
            this.errorMessage = 'E-mail ou senha inválidos.';
        } finally {
            this._app.isLoading = false;
        }
    },

    async handleLogout() {
        await signOut(auth);
    }
});