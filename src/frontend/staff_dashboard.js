(function () {
    const jobs = [
        {
            id: 1,
            code: 'AB 123 CD',
            client: 'Auto Care Plus',
            staff: ['Gentian Hoxha', 'Elda Krasniqi'],
            endDate: '22/12/2025'
        },
        {
            id: 2,
            code: 'AB 123 CD',
            client: 'Auto Care Plus',
            staff: ['Gentian Hoxha', 'Elda Krasniqi'],
            endDate: '22/12/2025'
        },
        {
            id: 3,
            code: 'ZX 456 YT',
            client: 'Speedy Motors',
            staff: ['Arben Lika', 'Mira Shehu'],
            endDate: '08/01/2026'
        },
        {
            id: 4,
            code: 'ZX 456 YT',
            client: 'Speedy Motors',
            staff: ['Arben Lika', 'Mira Shehu'],
            endDate: '08/01/2026'
        }
    ];

    const fullActiveJobs = [
        { id: 1, code: 'XY 987 ZT', client: 'John Doe', staff: ['Marku Petrit', 'Elira Dervishi'], endDate: '15/07/2025' },
        { id: 2, code: 'CD 456 EF', client: 'Anna Smith', staff: ['Arben Leka', 'Sandra Qerimi'], endDate: '22/08/2025' },
        { id: 3, code: 'GH 789 IJ', client: 'Luan Kola', staff: ['Dritan Hoxha', 'Valbona Resuli'], endDate: '01/06/2025' },
        { id: 4, code: 'AB 123 XY', client: 'Besim Hoxha', staff: ['Elda Krasniqi', 'Luan Zogaj'], endDate: '15/11/2023' },
        { id: 5, code: 'CD 789 ZX', client: 'Arjeta Memishi', staff: ['Alban Shala', 'Blerim Dauti'], endDate: '20/12/2023' },
        { id: 6, code: 'EF 654 RT', client: 'Ilir Krasniqi', staff: ['Arta Leka', 'Valon Berisha'], endDate: '05/01/2024' },
        { id: 7, code: 'KL 345 MN', client: 'Nora Gashi', staff: ['Gentian Hoxha', 'Mira Shehu'], endDate: '12/03/2026' },
        { id: 8, code: 'PQ 221 LK', client: 'Auto Care Plus', staff: ['Arben Lika', 'Elda Krasniqi'], endDate: '29/04/2026' }
    ];

    const fullClients = [
        { id: 1, name: 'Elsa Demiri', code: 'AE29F', phone: '068457812' },
        { id: 2, name: 'Arben Gashi', code: 'BG76T', phone: '069900987' },
        { id: 3, name: 'Dea Rexhepi', code: 'DH09K', phone: '068678954' },
        { id: 4, name: 'Blerim Krasniqi', code: 'ER92L', phone: '069123476' },
        { id: 5, name: 'Fiolla Ismaili', code: 'FT67J', phone: '068555112' },
        { id: 6, name: 'Gent Zeqiri', code: 'GK23O', phone: '069876543' },
        { id: 7, name: 'Hana Kuqi', code: 'HL81P', phone: '068222999' },
        { id: 8, name: 'Igor Shkreli', code: 'IZ45U', phone: '069543210' }
    ];

    const clients = fullClients.slice(0, 4);

    const completedJobs = [
        { id: 1, code: 'XY 987 ZT', client: 'John Doe', staff: ['Marku Petrit', 'Elira Dervishi'], endDate: '15/07/2025' },
        { id: 2, code: 'CD 456 EF', client: 'Anna Smith', staff: ['Arben Leka', 'Sandra Qerimi'], endDate: '22/08/2025' },
        { id: 3, code: 'GH 789 IJ', client: 'Luan Kola', staff: ['Dritan Hoxha', 'Valbona Resuli'], endDate: '01/06/2025' },
        { id: 4, code: 'AB 123 XY', client: 'Besim Hoxha', staff: ['Elda Krasniqi', 'Luan Zogaj'], endDate: '15/11/2023' },
        { id: 5, code: 'CD 789 ZX', client: 'Arjeta Memishi', staff: ['Alban Shala', 'Blerim Dauti'], endDate: '20/12/2023' },
        { id: 6, code: 'EF 654 RT', client: 'Ilir Krasniqi', staff: ['Arta Leka', 'Valon Berisha'], endDate: '05/01/2024' },
        { id: 7, code: 'KL 345 MN', client: 'Nora Gashi', staff: ['Gentian Hoxha', 'Mira Shehu'], endDate: '12/03/2026' },
        { id: 8, code: 'PQ 221 LK', client: 'Auto Care Plus', staff: ['Arben Lika', 'Elda Krasniqi'], endDate: '29/04/2026' }
    ];

    function setActiveView(viewId) {
        const targetView = viewId === 'active'
            || viewId === 'completed'
            || viewId === 'clients'
            || viewId === 'service'
            || viewId === 'register-service'
            ? viewId
            : 'home';

        document.querySelectorAll('[data-dashboard-view]').forEach((section) => {
            const isVisible = section.dataset.dashboardView === targetView;
            section.hidden = !isVisible;
            section.classList.toggle('is-visible', isVisible);
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function initStaffDashboard() {
        const navbar = document.querySelector('#staff-dashboard-navbar');
        const register = document.querySelector('#staff-dashboard-register');
        const activeJobs = document.querySelector('#staff-dashboard-active-jobs');
        const activeClients = document.querySelector('#staff-dashboard-active-clients');
        const fullActiveJobsPanel = document.querySelector('#staff-dashboard-full-active-jobs');
        const fullClientsPanel = document.querySelector('#staff-dashboard-full-clients');
        const completedJobsPanel = document.querySelector('#staff-dashboard-completed-jobs');
        const serviceDetailsPanel = document.querySelector('#staff-dashboard-service-details');
        const serviceRegistration = document.querySelector('#staff-dashboard-service-registration');
        const registerServicePanel = document.querySelector('#staff-dashboard-register-service');

        let navController = null;

        if (typeof window.createStaffNavbar === 'function') {
            navController = window.createStaffNavbar(navbar, {
                activeId: 'home',
                notificationCount: 2,
                profileLabel: 'Profili',
                onChange: (item) => {
                    setActiveView(item.id);
                }
            });
        }

        if (typeof window.createJobRegisterButton === 'function') {
            window.createJobRegisterButton(register, {
                onClick: () => {
                    register.dispatchEvent(new CustomEvent('staff-dashboard:register-job', { bubbles: true }));
                    setActiveView('service');
                }
            });
        }

        if (typeof window.createActiveJobsPanel === 'function') {
            window.createActiveJobsPanel(activeJobs, {
                jobs,
                onAction: () => {
                    activeJobs.dispatchEvent(new CustomEvent('staff-dashboard:view-all-jobs', { bubbles: true }));
                    if (navController) {
                        navController.setActive('active');
                    } else {
                        setActiveView('active');
                    }
                }
            });
        }

        if (typeof window.createActiveClientsPanel === 'function') {
            window.createActiveClientsPanel(activeClients, {
                clients,
                onAction: () => {
                    activeClients.dispatchEvent(new CustomEvent('staff-dashboard:view-all-clients', { bubbles: true }));
                    if (navController) {
                        navController.setActive('clients');
                    } else {
                        setActiveView('clients');
                    }
                }
            });
        }

        if (typeof window.createFullActiveJobPanel === 'function') {
            window.createFullActiveJobPanel(fullActiveJobsPanel, {
                jobs: fullActiveJobs
            });
        }

        if (typeof window.createFullClientPage === 'function') {
            window.createFullClientPage(fullClientsPanel, {
                clients: fullClients
            });
        }

        if (typeof window.createCompletedJobsPanel === 'function') {
            window.createCompletedJobsPanel(completedJobsPanel, {
                jobs: completedJobs
            });
        }

        if (typeof window.createServiceDetails === 'function') {
            window.createServiceDetails(serviceDetailsPanel);
        }

        if (typeof window.createServiceRegistrationBar === 'function') {
            window.createServiceRegistrationBar(serviceRegistration, {
                onBack: () => {
                    if (navController) {
                        navController.setActive('home');
                    } else {
                        setActiveView('home');
                    }
                },
                onAdd: () => {
                    serviceRegistration.dispatchEvent(new CustomEvent('staff-dashboard:add-service', { bubbles: true }));
                    setActiveView('register-service');
                },
                onClose: () => {
                    serviceRegistration.dispatchEvent(new CustomEvent('staff-dashboard:close-job', { bubbles: true }));
                    if (navController) {
                        navController.setActive('completed');
                    } else {
                        setActiveView('completed');
                    }
                }
            });
        }

        if (typeof window.createRegisterServiceForm === 'function') {
            window.createRegisterServiceForm(registerServicePanel, {
                onCancel: () => {
                    setActiveView('service');
                },
                onSubmit: (detail) => {
                    registerServicePanel.dispatchEvent(new CustomEvent('staff-dashboard:service-registered', {
                        bubbles: true,
                        detail
                    }));
                    setActiveView('service');
                }
            });
        }

        setActiveView(navController?.getActive()?.id ?? 'home');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initStaffDashboard);
    } else {
        initStaffDashboard();
    }
}());
