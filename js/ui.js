// js/ui.js

// Mapeamento dos elementos principais da UI
const elements = {
    loadingOverlay: document.getElementById('loading-overlay'),
    authView: document.getElementById('auth-view'),
    dashboardView: document.getElementById('dashboard-view'),
    pages: document.querySelectorAll('.page-content'),
    navLinks: document.querySelectorAll('#sidebar-nav .sidebar-link'),
    userEmailSidebar: document.getElementById('user-email-sidebar'),
    clinicNameSidebar: document.getElementById('clinic-name-sidebar'),
};

export const ui = {
    showLoading: () => elements.loadingOverlay.classList.remove('hidden'),
    hideLoading: () => elements.loadingOverlay.classList.add('hidden'),

    // Mostra a view principal (auth ou dashboard)
    showView(viewName) {
        elements.authView.classList.add('hidden');
        elements.dashboardView.classList.add('hidden');
        if (elements[`${viewName}View`]) {
            elements[`${viewName}View`].classList.remove('hidden');
        }
    },

    // Mostra uma página específica dentro do dashboard
    showPage(pageName) {
        elements.pages.forEach(p => p.classList.add('hidden'));
        const pageToShow = document.getElementById(`page-${pageName}`);
        if (pageToShow) {
            pageToShow.classList.remove('hidden');
        }

        elements.navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.view === pageName);
        });
    },

    // Atualiza as informações do usuário e da clínica na sidebar
    updateUserInfo(user, clinicData) {
        elements.userEmailSidebar.textContent = user.email;
        elements.clinicNameSidebar.textContent = clinicData.name || 'FisioGestão';
    },

    // Configura os eventos de navegação
    setupNavigation() {
        elements.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPage(link.dataset.view);
            });
        });
    },
};