(function () {
    const logoutUrl = '../../auth/session.php?action=logout';
    const dashboardEndpoint = '/mechanic-system/public/api/client_dashboard.php';
    const notificationsEndpoint = '/mechanic-system/src/notifications/api/notifications.php';
    let notificationsReady = false;

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

    function escapeHTML(value) {
        return String(value ?? '').replace(/[&<>"']/g, (character) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[character]));
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

        const response = await fetch(`${notificationsEndpoint}?action=${encodeURIComponent(action)}`, options);
        if (!response.ok) throw new Error(`Notifications failed with ${response.status}`);
        return response.json();
    }

    function notificationTarget(notification) {
        if (!notification.job_id) return '';
        return `client-job-details.html?job_id=${encodeURIComponent(notification.job_id)}&from=notification`;
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
        initNotifications,
        fillUser,
        logout,
        loadData
    };

    initNotifications();
}());
