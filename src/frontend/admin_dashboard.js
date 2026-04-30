(function () {
    const API_ENDPOINT = './fetch%20data/get_dashboard_data.php';

    const EMPTY_DASHBOARD_DATA = {
        user: {
            name: '',
            role: '',
            logoutText: 'Dil nga llogaria'
        },
        notificationCount: 0,
        stats: {
            activeJobs: 0,
            staff: 0,
            clients: 0
        },
        activeJobs: [],
        jobs: [],
        staff: [],
        clients: []
    };

    const dashboardContent = document.querySelector('#dashboard-content');
    const toast = document.querySelector('#dashboard-toast');
    let dashboardData = EMPTY_DASHBOARD_DATA;
    let navApi = null;
    let toastTimer = null;

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('is-visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 1800);
    }

    function setActiveSection(sectionId) {
        if (navApi) {
            navApi.setActive(sectionId);
        }
    }

    async function loadDashboardData() {
        try {
            const response = await fetch(API_ENDPOINT, {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`Dashboard API failed with ${response.status}`);
            }

            const fetchedData = await response.json();
            dashboardData = {
                ...EMPTY_DASHBOARD_DATA,
                ...fetchedData,
                user: {
                    ...EMPTY_DASHBOARD_DATA.user,
                    ...(fetchedData.user ?? {})
                },
                stats: {
                    ...EMPTY_DASHBOARD_DATA.stats,
                    ...(fetchedData.stats ?? {})
                },
                activeJobs: Array.isArray(fetchedData.activeJobs) ? fetchedData.activeJobs : [],
                jobs: Array.isArray(fetchedData.jobs) ? fetchedData.jobs : [],
                staff: Array.isArray(fetchedData.staff) ? fetchedData.staff : [],
                clients: Array.isArray(fetchedData.clients) ? fetchedData.clients : []
            };
        } catch (error) {
            dashboardData = EMPTY_DASHBOARD_DATA;
            console.warn('Dashboard data could not be loaded:', error);
        }
    }

    function renderEmptyState(container, message) {
        container.innerHTML = `<p class="empty-state">${message}</p>`;
    }

    function iconUsers() {
        return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M16 19c0-2.2-1.8-4-4-4H8c-2.2 0-4 1.8-4 4" stroke-width="2" stroke-linecap="round"/><path d="M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke-width="2"/><path d="M20 19c0-1.8-1.1-3.3-2.8-3.8" stroke-width="2" stroke-linecap="round"/><path d="M16 3.3a4 4 0 0 1 0 7.4" stroke-width="2" stroke-linecap="round"/></svg>';
    }

    function iconBriefcase() {
        return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 7V5.8C9 4.8 9.8 4 10.8 4h2.4c1 0 1.8.8 1.8 1.8V7" stroke-width="2"/><path d="M5 7h14c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V9c0-1.1.9-2 2-2Z" stroke-width="2"/><path d="M9 12h6" stroke-width="2" stroke-linecap="round"/></svg>';
    }

    function iconExternal() {
        return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14 4h6v6" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 4 10 14" stroke-width="2.2" stroke-linecap="round"/><path d="M18 14v5H5V6h5" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }

    function renderHome() {
        const { stats, activeJobs, staff } = dashboardData;

        dashboardContent.innerHTML = `
            <section class="dashboard-hero">
                <div>
                    <h1 class="dashboard-title">Regjistro Pune</h1>
                    <p class="dashboard-subtitle">Vetem administratori ka te drejten te regjistroje perdorues te rinj, perfshire klientet dhe stafin</p>
                </div>
                <div class="dashboard-actions">
                    <button class="primary-action" type="button" data-action="register-job">${iconBriefcase()}<span>Regjistro</span></button>
                </div>
            </section>
            <section class="dashboard-stats" aria-label="Dashboard statistics">
                <button class="stat-pill" type="button" data-section="jobs">${iconUsers()}<span>Pune Aktive: ${stats.activeJobs}</span></button>
                <button class="stat-pill" type="button" data-section="staff">${iconUsers()}<span>Stafi: ${stats.staff}</span></button>
                <button class="stat-pill" type="button" data-section="clients">${iconUsers()}<span>Klientet: ${stats.clients}</span></button>
            </section>
            <section class="dashboard-grid">
                <article class="dashboard-panel">
                    <div class="panel-header">
                        <div>
                            <h2 class="panel-title">Pune Aktive</h2>
                            <p class="panel-subtitle">Ne kete panel mund te shikosh te gjitha punet aktive</p>
                        </div>
                        <button class="panel-link" type="button" data-section="jobs"><span>Shiko te gjitha punet</span>${iconExternal()}</button>
                    </div>
                    <div class="jobs-grid" id="active-jobs"></div>
                </article>
                <article class="dashboard-panel staff-dashboard-panel">
                    <div class="panel-header">
                        <div>
                            <h2 class="panel-title">Staff</h2>
                            <p class="panel-subtitle">Shikoni anetaret e stafit</p>
                        </div>
                        <button class="panel-link" type="button" data-section="staff"><span>Anetaret e stafit</span>${iconExternal()}</button>
                    </div>
                    <div class="staff-list" id="staff-list"></div>
                </article>
            </section>
        `;

        document.querySelectorAll('[data-section]').forEach((button) => {
            button.addEventListener('click', () => setActiveSection(button.dataset.section));
        });

        document.querySelector('[data-action="register-job"]').addEventListener('click', () => {
            showToast('Regjistro pune u klikua');
        });

        const jobsGrid = document.querySelector('#active-jobs');
        if (activeJobs.length === 0) {
            renderEmptyState(jobsGrid, 'Nuk ka pune aktive.');
        } else {
            activeJobs.forEach((job) => {
                const card = document.createElement('article');
                card.className = 'job-card';
                jobsGrid.appendChild(card);
                createJobCard(card, job);
                card.tabIndex = 0;
                card.setAttribute('role', 'button');
                card.setAttribute('aria-label', `Hap punen ${job.code}`);
                card.addEventListener('click', () => showToast(`Pune e zgjedhur: ${job.code}`));
                card.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        card.click();
                    }
                });
            });
        }

        const staffList = document.querySelector('#staff-list');
        if (staff.length === 0) {
            renderEmptyState(staffList, 'Nuk ka staf te regjistruar.');
        } else {
            staff.forEach((member) => {
                const card = document.createElement('article');
                staffList.appendChild(card);
                createStaffCard(card, member, () => showToast(`Staff i zgjedhur: ${member.name}`));
            });
        }
    }

    function renderSimpleView(item) {
        const collections = {
            jobs: dashboardData.jobs,
            staff: dashboardData.staff,
            clients: dashboardData.clients
        };
        const items = collections[item.id] ?? [];

        dashboardContent.innerHTML = `
            <section class="dashboard-hero">
                <div>
                    <h1 class="dashboard-title">${item.text}</h1>
                    <p class="dashboard-subtitle">Zgjidh nje element per te pare ose ndryshuar detajet.</p>
                </div>
                <div class="dashboard-actions">
                    <button class="primary-action" type="button" data-action="create">${iconBriefcase()}<span>Regjistro</span></button>
                </div>
            </section>
            <section class="simple-view">
                <div class="simple-view__grid">
                    ${items.length === 0 ? `<p class="empty-state">Nuk ka te dhena per kete seksion.</p>` : items.map((entry) => `
                        <button class="simple-card" type="button" data-name="${entry.name ?? entry.code}">
                            <h2 class="panel-title">${entry.name ?? entry.code}</h2>
                            <p class="panel-subtitle">${entry.detail ?? entry.client ?? (entry.tags ? entry.tags.join(' | ') : 'Detaje')}</p>
                        </button>
                    `).join('')}
                </div>
            </section>
        `;

        document.querySelector('[data-action="create"]').addEventListener('click', () => {
            showToast(`Regjistro te ${item.text}`);
        });
        document.querySelectorAll('.simple-card').forEach((card) => {
            card.addEventListener('click', () => showToast(`U zgjodh: ${card.dataset.name}`));
        });
    }

    function renderDashboard(item) {
        if (!item || item.id === 'home') {
            renderHome();
            return;
        }

        renderSimpleView(item);
    }

    async function initDashboard() {
        dashboardContent.innerHTML = '<section class="dashboard-panel"><h1 class="dashboard-title">Loading dashboard...</h1></section>';
        await loadDashboardData();

        navApi = createHeaderNav(document.querySelector('#admin-header'), {
            activeId: 'home',
            profileOpen: true,
            navItems: [
                { id: 'home', text: 'Faqja Kryesore' },
                { id: 'jobs', text: 'Punet' },
                { id: 'staff', text: 'Staff' },
                { id: 'clients', text: 'Klientet' }
            ],
            notificationCount: dashboardData.notificationCount,
            user: dashboardData.user,
            onChange: renderDashboard,
            onLogout: () => {
                window.location.href = '../login/auth/session.php?action=logout';
            },
            onNotification: () => showToast('Njoftimet u klikuan')
        });
    }

    initDashboard();
}());
