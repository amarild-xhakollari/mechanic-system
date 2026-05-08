(function () {
    const pageMap = {
        home: 'staff-home.html',
        active: 'staff-active-jobs.html',
        completed: 'staff-completed-jobs.html',
        clients: 'staff-clients.html'
    };
    const logoutUrl = '../../auth/session.php?action=logout';
    const dashboardEndpoint = '/mechanic-system/public/api/staff_dashboard.php';

    function logout() {
        window.location.href = logoutUrl;
    }

    function bindLogout() {
        document.querySelectorAll('[data-logout]').forEach((button) => {
            button.addEventListener('click', logout);
        });
    }

    function bindProfileDropdown() {
        const button = document.querySelector('[data-profile-button]');
        const dropdown = document.querySelector('[data-profile-dropdown]');

        if (!button || !dropdown) return;

        dropdown.classList.remove('is-open');
        button.setAttribute('aria-expanded', 'false');

        button.addEventListener('click', (event) => {
            event.stopPropagation();
            const isOpen = dropdown.classList.toggle('is-open');
            button.setAttribute('aria-expanded', String(isOpen));
        });

        document.addEventListener('click', (event) => {
            if (!dropdown.contains(event.target) && !button.contains(event.target)) {
                dropdown.classList.remove('is-open');
                button.setAttribute('aria-expanded', 'false');
            }
        });
    }

    function fillUser(user = {}) {
        const name = document.querySelector('[data-user-name]');
        const role = document.querySelector('[data-user-role]');

        if (name) name.textContent = user.name || 'Staff';
        if (role) role.textContent = 'Staff';
    }

    function initNavbar(activeId) {
        const navbar = document.querySelector('#staff-navbar');
        if (!navbar || typeof window.createStaffNavbar !== 'function') {
            return null;
        }

        const controller = window.createStaffNavbar(navbar, {
            activeId,
            notificationCount: 2,
            profileLabel: 'Profili',
            onChange: (item) => {
                const target = pageMap[item.id];
                if (target && !window.location.pathname.endsWith(target)) {
                    window.location.href = target;
                }
            },
            onProfileAction: (action) => {
                if (action === 'logout') {
                    logout();
                }
            }
        });

        bindLogout();

        return controller;
    }

    function formatDate(value) {
        if (!value) return '';

        const date = new Date(String(value).replace(' ', 'T'));
        if (Number.isNaN(date.getTime())) {
            return String(value);
        }

        return [
            String(date.getDate()).padStart(2, '0'),
            String(date.getMonth() + 1).padStart(2, '0'),
            date.getFullYear()
        ].join('/');
    }

    function getStatusLabel(status) {
        const labels = {
            created: 'Aktiv',
            in_progress: 'Aktiv',
            completed: 'Perfunduar',
            cancelled: 'Anuluar'
        };

        return labels[status] ?? status ?? '';
    }

    function normalizeJob(job = {}, user = {}) {
        return {
            id: job.id,
            code: job.plate || job.code || 'Pa targe',
            client: job.client || 'Pa klient',
            clientPhone: job.client_phone || job.clientPhone || '',
            staff: user.name ? [user.name] : [],
            endDate: formatDate(job.updated_at),
            date: formatDate(job.updated_at),
            status: getStatusLabel(job.status),
            rawStatus: job.status,
            description: job.description,
            type: job.type
        };
    }

    function getClientCode(name, index) {
        const source = String(name || 'KL').replace(/[^a-zA-Z]/g, '').toUpperCase();
        const letters = `${source.slice(0, 2)}KL`.slice(0, 2);
        return `${letters}${String(index + 1).padStart(2, '0')}`;
    }

    function getClientsFromJobs(jobs = []) {
        const clientsByName = new Map();

        jobs.forEach((job) => {
            const name = job.client || '';
            if (!name || clientsByName.has(name)) {
                return;
            }

            clientsByName.set(name, {
                id: clientsByName.size + 1,
                name,
                code: getClientCode(name, clientsByName.size),
                phone: job.clientPhone || ''
            });
        });

        return Array.from(clientsByName.values());
    }

    async function loadData() {
        const response = await fetch(dashboardEndpoint, {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin'
        });

        if (response.status === 401 || response.status === 403) {
            window.location.replace('/mechanic-system/public/staff-page.html');
            throw new Error('Staff access required');
        }

        if (!response.ok) {
            throw new Error(`Staff dashboard API failed with ${response.status}`);
        }

        const data = await response.json();
        const jobs = Array.isArray(data.jobs)
            ? data.jobs.map((job) => normalizeJob(job, data.user))
            : [];
        const clients = getClientsFromJobs(jobs);

        return {
            user: data.user ?? {},
            jobs,
            activeJobs: jobs.filter((job) => job.rawStatus === 'created' || job.rawStatus === 'in_progress'),
            completedJobs: jobs.filter((job) => job.rawStatus === 'completed'),
            clients
        };
    }

    window.StaffPages = {
        initNavbar,
        bindLogout,
        bindProfileDropdown,
        fillUser,
        logout,
        loadData
    };
}());
