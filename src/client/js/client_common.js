(function () {
    const logoutUrl = '../../auth/session.php?action=logout';
    const dashboardEndpoint = '/mechanic-system/public/api/client_dashboard.php';

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
        const arrow = document.querySelector('[data-profile-arrow]');

        if (!button || !dropdown) return;

        dropdown.classList.remove('is-open');
        dropdown.classList.remove('show');
        if (arrow) arrow.classList.remove('open');
        button.setAttribute('aria-expanded', 'false');

        button.addEventListener('click', (event) => {
            event.stopPropagation();
            const isOpen = dropdown.classList.toggle('show');
            dropdown.classList.toggle('is-open', isOpen);
            if (arrow) arrow.classList.toggle('open', isOpen);
            button.setAttribute('aria-expanded', String(isOpen));
        });

        document.addEventListener('click', (event) => {
            if (!dropdown.contains(event.target) && !button.contains(event.target)) {
                dropdown.classList.remove('is-open');
                dropdown.classList.remove('show');
                if (arrow) arrow.classList.remove('open');
                button.setAttribute('aria-expanded', 'false');
            }
        });
    }

    function fillUser(user = {}) {
        const name = document.querySelector('[data-user-name]');
        const role = document.querySelector('[data-user-role]');

        if (name) name.textContent = user.name || 'Client';
        if (role) role.textContent = 'Client';
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
            completed: 'Përfunduar',
            cancelled: 'Anuluar'
        };

        return labels[status] ?? status ?? '';
    }

    function normalizeJob(job = {}, user = {}) {
        return {
            id: job.id,
            vehicleId: job.vehicle_id,
            code: job.plate || job.code || 'Pa targe',
            client: user.name || 'Client',
            staff: job.staff ? [job.staff] : [],
            createdDate: formatDate(job.created_at),
            date: formatDate(job.updated_at),
            status: getStatusLabel(job.status),
            rawStatus: job.status,
            description: job.description,
            type: job.type,
            vehicle: {
                plate: job.plate || job.code || '',
                vin: job.vin || '',
                company: job.company || '',
                model: job.model || '',
                fuel: job.fuel || '',
                engine: job.engine || ''
            }
        };
    }

    async function loadData() {
        const response = await fetch(dashboardEndpoint, {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin'
        });

        if (response.status === 401 || response.status === 403) {
            window.location.replace('/mechanic-system/public/public-client.html');
            throw new Error('Client access required');
        }

        if (!response.ok) {
            throw new Error(`Client dashboard API failed with ${response.status}`);
        }

        const data = await response.json();
        const user = data.user ?? {};
        const jobs = Array.isArray(data.jobs)
            ? data.jobs.map((job) => normalizeJob(job, user))
            : [];

        return {
            user,
            vehicles: data.vehicles ?? [],
            jobs,
            activeJobs: jobs.filter((job) => job.rawStatus === 'created' || job.rawStatus === 'in_progress'),
            completedJobs: jobs.filter((job) => job.rawStatus === 'completed')
        };
    }

    window.ClientPages = {
        bindLogout,
        bindProfileDropdown,
        fillUser,
        logout,
        loadData
    };
}());
