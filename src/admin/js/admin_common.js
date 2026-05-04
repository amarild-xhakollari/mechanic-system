(function () {
    const DASHBOARD_ENDPOINT = '../api/get_dashboard_data.php';

    function escapeHTML(value) {
        return String(value ?? '').replace(/[&<>"']/g, (character) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[character]));
    }

    function showToast(message) {
        const toast = document.querySelector('#page-toast');
        if (!toast) return;

        toast.textContent = message;
        toast.classList.add('is-visible');
        clearTimeout(showToast.timer);
        showToast.timer = setTimeout(() => toast.classList.remove('is-visible'), 1800);
    }

    async function fetchDashboardData() {
        const response = await fetch(DASHBOARD_ENDPOINT, {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error(`Dashboard API failed with ${response.status}`);
        }

        return response.json();
    }

    function formatDate(value) {
        if (!value) return '';

        const date = new Date(String(value).replace(' ', 'T'));
        if (Number.isNaN(date.getTime())) {
            return value;
        }

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    }

    function getStatusLabel(status) {
        const labels = {
            created: 'Aktiv',
            in_progress: 'Aktiv',
            completed: 'Perfunduar',
            cancelled: 'Anuluar'
        };

        return labels[status] ?? status ?? 'Aktiv';
    }

    function normalizeJob(job = {}) {
        const status = job.status ?? 'created';

        return {
            ...job,
            code: job.code || job.plate_number || 'Pa targe',
            client: job.client || job.client_name || 'Pa klient',
            mechanics: Array.isArray(job.mechanics) ? job.mechanics : [],
            mechanicsLabel: job.mechanicsLabel ?? 'Mekaniket',
            dateLabel: job.dateLabel ?? 'Data',
            date: formatDate(job.date ?? job.updated_at),
            status: getStatusLabel(status),
            completed: job.completed === true || status === 'completed'
        };
    }

    function normalizeStaff(member = {}, index = 0) {
        const jobs = Array.isArray(member.jobs) ? member.jobs.map(normalizeJob) : [];
        const tags = Array.isArray(member.tags) ? member.tags : [];

        return {
            ...member,
            id: member.id ?? member.user_id ?? index + 1,
            name: member.name || `${member.first_name ?? ''} ${member.last_name ?? ''}`.trim() || 'Staff',
            code: member.code || member.login_identifier || `STAFF-${member.id ?? index + 1}`,
            tags: tags.length > 0 ? tags : ['staff'],
            jobs,
            positions: Array.isArray(member.positions) && member.positions.length > 0 ? member.positions : (tags.length > 0 ? tags : ['staff'])
        };
    }

    function getClientCode(client, index) {
        const source = (client.name ?? 'KL').replace(/[^a-zA-Z]/g, '').toUpperCase();
        const letters = `${source.slice(0, 2)}KL`.slice(0, 2);
        return client.code ?? `${letters}${String((client.id ?? index + 1) % 1000).padStart(2, '0')}`;
    }

    function normalizeClient(client = {}, index = 0) {
        const name = client.name || `${client.first_name ?? ''} ${client.last_name ?? ''}`.trim();

        return {
            ...client,
            id: client.id ?? client.user_id ?? index + 1,
            name: name || 'Klient',
            code: getClientCode({ ...client, name }, index),
            phone: client.phone ?? client.phone_number ?? '',
            email: client.email ?? '',
            detail: client.detail ?? ''
        };
    }

    function renderEmpty(container, message) {
        container.innerHTML = `<p class="empty-state">${escapeHTML(message)}</p>`;
    }

    function fillUser(user = {}) {
        const name = document.querySelector('[data-user-name]');
        const role = document.querySelector('[data-user-role]');

        if (name) name.textContent = user.name || 'User';
        if (role) role.textContent = user.role || '';
    }

    function bindLogout() {
        const logout = document.querySelector('[data-logout]');
        if (logout) {
            logout.addEventListener('click', () => {
                window.location.href = '../../auth/session.php?action=logout';
            });
        }
    }

    function bindProfileDropdown() {
        const button = document.querySelector('[data-profile-button]');
        const dropdown = document.querySelector('[data-profile-dropdown]');

        if (!button || !dropdown) return;

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

    async function loadPage(onData) {
        bindLogout();
        bindProfileDropdown();

        try {
            const data = await fetchDashboardData();
            fillUser(data.user);
            onData(data);
        } catch (error) {
            console.warn('Page data could not be loaded:', error);
            showToast('Te dhenat nuk u ngarkuan');
            onData({
                user: {},
                stats: { activeJobs: 0, staff: 0, clients: 0 },
                activeJobs: [],
                jobs: [],
                staff: [],
                clients: []
            });
        }
    }

    window.AdminPages = {
        escapeHTML,
        showToast,
        fetchDashboardData,
        normalizeJob,
        normalizeStaff,
        normalizeClient,
        renderEmpty,
        loadPage
    };
}());
