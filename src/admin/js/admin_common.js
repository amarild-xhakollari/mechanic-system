(function () {
    const DASHBOARD_ENDPOINT = '../api/get_dashboard_data.php';
    const NOTIFICATIONS_ENDPOINT = '/mechanic-system/src/notifications/api/notifications.php';
    let notificationsReady = false;

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

        if (response.status === 401 || response.status === 403) {
            window.location.replace('/mechanic-system/public/staff-page.html');
            throw new Error('Admin access required');
        }

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
        const status = job.rawStatus ?? job.status ?? 'created';

        return {
            ...job,
            rawStatus: status,
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

    function formatNotificationDate(value) {
        if (!value) return '';
        const date = new Date(String(value).replace(' ', 'T'));
        if (Number.isNaN(date.getTime())) return String(value);
        return date.toLocaleString('sq-AL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    }

    async function requestNotifications(action = 'list', payload = null) {
        const options = {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin'
        };

        if (payload) {
            options.method = 'POST';
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(payload);
        }

        const response = await fetch(`${NOTIFICATIONS_ENDPOINT}?action=${encodeURIComponent(action)}`, options);
        if (!response.ok) throw new Error(`Notifications failed with ${response.status}`);
        return response.json();
    }

    function notificationTarget(notification) {
        if (!notification.job_id) return '';
        return `job-details.html?job_id=${encodeURIComponent(notification.job_id)}&from=notification`;
    }

    function initNotifications() {
        if (notificationsReady) return;
        const button = document.querySelector('.header-nav__notification');
        const actions = document.querySelector('.header-nav__actions');
        if (!button || !actions) return;

        notificationsReady = true;
        button.querySelector('.header-nav__notification-badge')?.remove();

        const panel = document.createElement('div');
        panel.className = 'header-nav__notifications-panel';
        panel.innerHTML = `
            <div class="header-nav__notifications-head">
                <h2 class="header-nav__notifications-title">Njoftimet</h2>
                <button class="header-nav__notifications-read" type="button">Sheno te gjitha</button>
            </div>
            <div class="header-nav__notifications-list">
                <p class="header-nav__notifications-empty">Nuk ka njoftime.</p>
            </div>
        `;
        actions.appendChild(panel);

        const list = panel.querySelector('.header-nav__notifications-list');
        const readAll = panel.querySelector('.header-nav__notifications-read');

        function setBadge(count) {
            button.querySelector('.header-nav__notification-badge')?.remove();
            if (count > 0) {
                button.insertAdjacentHTML('beforeend', `<span class="header-nav__notification-badge">${escapeHTML(count)}</span>`);
            }
        }

        async function loadNotifications() {
            const data = await requestNotifications();
            setBadge(Number(data.unread_count ?? 0));
            const items = Array.isArray(data.notifications) ? data.notifications : [];
            if (items.length === 0) {
                list.innerHTML = '<p class="header-nav__notifications-empty">Nuk ka njoftime.</p>';
                return;
            }
            list.innerHTML = items.map((item) => `
                <button class="header-nav__notification-item${item.is_read ? '' : ' is-unread'}" type="button" data-notification-id="${escapeHTML(item.id)}" data-job-target="${escapeHTML(notificationTarget(item))}">
                    <p class="header-nav__notification-title">${escapeHTML(item.title)}</p>
                    <p class="header-nav__notification-message">${escapeHTML(item.message)}</p>
                    <span class="header-nav__notification-time">${escapeHTML(formatNotificationDate(item.created_at))}</span>
                </button>
            `).join('');
        }

        button.addEventListener('click', (event) => {
            event.stopPropagation();
            panel.classList.toggle('is-open');
            loadNotifications().catch((error) => console.warn('Notifications could not load:', error));
        });

        panel.addEventListener('click', async (event) => {
            event.stopPropagation();
            const item = event.target.closest('[data-notification-id]');
            if (!item) return;
            await requestNotifications('mark_read', { notification_id: item.dataset.notificationId }).catch(() => null);
            const target = item.dataset.jobTarget;
            if (target) window.location.href = target;
            else loadNotifications().catch(() => null);
        });

        readAll.addEventListener('click', () => {
            requestNotifications('mark_all_read', {}).then(loadNotifications).catch(() => null);
        });

        document.addEventListener('click', (event) => {
            if (!panel.contains(event.target) && !button.contains(event.target)) {
                panel.classList.remove('is-open');
            }
        });

        loadNotifications().catch(() => null);
    }

    async function loadPage(onData) {
        bindLogout();
        bindProfileDropdown();
        initNotifications();

        try {
            const data = await fetchDashboardData();
            fillUser(data.user);
            onData(data);
        } catch (error) {
            if (error.message === 'Admin access required') {
                return;
            }

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
        initNotifications,
        loadPage
    };

    initNotifications();
}());
