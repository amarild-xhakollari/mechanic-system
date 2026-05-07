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

    const clients = [
        { id: 1, name: 'Emër Mbiemër', code: 'CODE', phone: '067652755' },
        { id: 2, name: 'Emër Mbiemër', code: 'CODE', phone: '067652755' },
        { id: 3, name: 'Emër Mbiemër', code: 'CODE', phone: '067652755' },
        { id: 4, name: 'Emër Mbiemër', code: 'CODE', phone: '067652755' }
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

    function initStaffDashboard() {
        const navbar = document.querySelector('#staff-dashboard-navbar');
        const register = document.querySelector('#staff-dashboard-register');
        const activeJobs = document.querySelector('#staff-dashboard-active-jobs');
        const activeClients = document.querySelector('#staff-dashboard-active-clients');
        const fullActiveJobsPanel = document.querySelector('#staff-dashboard-full-active-jobs');

        if (typeof window.createStaffNavbar === 'function') {
            window.createStaffNavbar(navbar, {
                activeId: 'home',
                notificationCount: 2,
                profileLabel: 'Profili'
            });
        }

        if (typeof window.createJobRegisterButton === 'function') {
            window.createJobRegisterButton(register, {
                onClick: () => {
                    register.dispatchEvent(new CustomEvent('staff-dashboard:register-job', { bubbles: true }));
                }
            });
        }

        if (typeof window.createActiveJobsPanel === 'function') {
            window.createActiveJobsPanel(activeJobs, {
                jobs,
                onAction: () => {
                    activeJobs.dispatchEvent(new CustomEvent('staff-dashboard:view-all-jobs', { bubbles: true }));
                    fullActiveJobsPanel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        }

        if (typeof window.createActiveClientsPanel === 'function') {
            window.createActiveClientsPanel(activeClients, {
                clients,
                onAction: () => {
                    activeClients.dispatchEvent(new CustomEvent('staff-dashboard:view-all-clients', { bubbles: true }));
                }
            });
        }

        if (typeof window.createFullActiveJobPanel === 'function') {
            window.createFullActiveJobPanel(fullActiveJobsPanel, {
                jobs: fullActiveJobs
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initStaffDashboard);
    } else {
        initStaffDashboard();
    }
}());
