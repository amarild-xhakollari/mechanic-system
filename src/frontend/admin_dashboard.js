(function () {
    const API_ENDPOINT = './fetch%20data/get_dashboard_data.php';
    const SEARCH_ENDPOINTS = {
        jobs: '../admin/search_utilitys/search_jobs.php',
        staff: '../admin/search_utilitys/search_staff.php',
        clients: '../admin/search_utilitys/search_clients.php'
    };

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
    const STAFF_REFERENCE_DATA = [
        {
            id: 1,
            name: 'Emer Mbiemer',
            code: 'CODE',
            avatarBg: '#f7a9ad',
            avatarIcon: '#8e1e24',
            assignedJobsLabel: 'Punet e Caktuara',
            jobs: [{ id: 1, code: 'UV 789 RT', client: 'Liridona Gashi', date: '15/11/2025' }],
            jobsInProcess: { count: 1, label: 'Pune Ne Proces' },
            positionsLabel: 'Pozicionet e punes',
            positions: ['Menaxher Projekte', 'Koordinues']
        },
        {
            id: 2,
            name: 'Emer Mbiemer',
            code: 'CODE',
            avatarBg: '#f7a9ad',
            avatarIcon: '#8e1e24',
            assignedJobsLabel: 'Punet e Caktuara',
            jobs: [
                { id: 2, code: 'YZ 123 PX', client: 'Arta Hoxhaj', date: '06/11/2025' },
                { id: 3, code: 'KL 789 XY', client: 'Gentian Berisha', date: '07/11/2025' }
            ],
            jobsInProcess: { count: 2, label: 'Pune Ne Proces' },
            positionsLabel: 'Pozicionet e punes',
            positions: ['Inxhinier Cilesie', 'Kontrollues']
        },
        {
            id: 3,
            name: 'Emer Mbiemer',
            code: 'CODE',
            avatarBg: '#f7a9ad',
            avatarIcon: '#8e1e24',
            assignedJobsLabel: 'Punet e Caktuara',
            jobs: [
                { id: 4, code: 'WX 456 QL', client: 'Erion Meta', date: '10/11/2025' },
                { id: 5, code: 'KL 123 OP', client: 'Mira Dervishi', date: '11/11/2025' },
                { id: 6, code: 'BF 456 KL', client: 'Mira Dervishi', date: '12/11/2025' },
                { id: 7, code: 'WX 456 QL', client: 'Erion Meta', date: '10/11/2025' }
            ],
            jobsInProcess: { count: 4, label: 'Pune Ne Proces' },
            positionsLabel: 'Pozicionet e punes',
            positions: ['Montues', 'Teknik']
        },
        {
            id: 4,
            name: 'Emer Mbiemer',
            code: 'CODE',
            avatarBg: '#f7a9ad',
            avatarIcon: '#8e1e24',
            assignedJobsLabel: 'Punet e Caktuara',
            jobs: [],
            jobsInProcess: { count: 0, label: 'Pune Ne Proces' },
            positionsLabel: 'Pozicionet e punes',
            positions: []
        },
        {
            id: 5,
            name: 'Emer Mbiemer',
            code: 'CODE',
            avatarBg: '#f7a9ad',
            avatarIcon: '#8e1e24',
            assignedJobsLabel: 'Punet e Caktuara',
            jobs: [],
            jobsInProcess: { count: 0, label: 'Pune Ne Proces' },
            positionsLabel: 'Pozicionet e punes',
            positions: []
        },
        {
            id: 6,
            name: 'Emer Mbiemer',
            code: 'CODE',
            avatarBg: '#f7a9ad',
            avatarIcon: '#8e1e24',
            assignedJobsLabel: 'Punet e Caktuara',
            jobs: [],
            jobsInProcess: { count: 0, label: 'Pune Ne Proces' },
            positionsLabel: 'Pozicionet e punes',
            positions: []
        },
        {
            id: 7,
            name: 'Emer Mbiemer',
            code: 'CODE',
            avatarBg: '#f7a9ad',
            avatarIcon: '#8e1e24',
            assignedJobsLabel: 'Punet e Caktuara',
            jobs: [],
            jobsInProcess: { count: 0, label: 'Pune Ne Proces' },
            positionsLabel: 'Pozicionet e punes',
            positions: []
        },
        {
            id: 8,
            name: 'Emer Mbiemer',
            code: 'CODE',
            avatarBg: '#f7a9ad',
            avatarIcon: '#8e1e24',
            assignedJobsLabel: 'Punet e Caktuara',
            jobs: [],
            jobsInProcess: { count: 0, label: 'Pune Ne Proces' },
            positionsLabel: 'Pozicionet e punes',
            positions: []
        }
    ];
    const JOBS_REFERENCE_DATA = [
        {
            id: 1,
            code: 'XY 987 ZT',
            client: 'John Doe',
            mechanics: ['Marku Petrit', 'Elira Dervishi'],
            date: '15/07/2025',
            status: 'Aktiv'
        },
        {
            id: 2,
            code: 'CD 456 EF',
            client: 'Anna Smith',
            mechanics: ['Arben Leka', 'Sandra Qerimi'],
            date: '22/08/2025',
            status: 'Aktiv'
        },
        {
            id: 3,
            code: 'GH 789 IJ',
            client: 'Luan Kola',
            mechanics: ['Dritan Hoxha', 'Valbona Resuli'],
            date: '01/06/2025',
            status: 'Aktiv'
        },
        {
            id: 4,
            code: 'AB 123 XY',
            client: 'Besim Hoxha',
            mechanics: ['Elda Krasniqi', 'Luan Zogaj'],
            date: '15/11/2023',
            status: 'Aktiv'
        },
        {
            id: 5,
            code: 'CD 789 ZX',
            client: 'Arjeta Memishi',
            mechanics: ['Alban Shala', 'Blerim Dauti'],
            date: '20/12/2023',
            status: 'Aktiv'
        },
        {
            id: 6,
            code: 'EF 654 RT',
            client: 'Ilir Krasniqi',
            mechanics: ['Arta Leka', 'Valon Berisha'],
            date: '05/01/2024',
            status: 'Aktiv'
        },
        {
            id: 7,
            code: 'XY 456 EF',
            client: 'Arton Berisha',
            mechanics: ['Mira Gashi', 'Endrit Kola'],
            date: '17/02/2024',
            status: 'Aktiv',
            completed: true
        },
        {
            id: 8,
            code: 'GH 789 LI',
            client: 'Elira Berisha',
            mechanics: ['Dorian Hasa', 'Rina Leka'],
            date: '11/03/2024',
            status: 'Aktiv',
            completed: true
        }
    ];

    const dashboardContent = document.querySelector('#dashboard-content');
    const toast = document.querySelector('#dashboard-toast');
    let dashboardData = EMPTY_DASHBOARD_DATA;
    let navApi = null;
    let toastTimer = null;
    let jobsSearchTimer = null;
    let staffSearchTimer = null;
    let clientsSearchTimer = null;
    let jobsSearchController = null;
    let staffSearchController = null;
    let clientsSearchController = null;

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

    async function fetchSearchResults(endpoint, query, controller) {
        const url = `${endpoint}?q=${encodeURIComponent(query)}`;
        const response = await fetch(url, {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(`Search API failed with ${response.status}`);
        }

        const results = await response.json();
        return Array.isArray(results) ? results : [];
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

    function getJobSearchText(job) {
        const mechanics = Array.isArray(job.mechanics) ? job.mechanics : [];

        return [
            job.code,
            job.client,
            job.status,
            job.date,
            ...mechanics
        ].join(' ').toLowerCase();
    }

    function normalizeJobForPanel(job) {
        const isCompleted = job.completed === true || job.status === 'completed';

        return {
            ...job,
            status: job.status === 'created' || job.status === 'in_progress' ? 'Aktiv' : (job.status ?? 'Aktiv'),
            dateLabel: job.dateLabel ?? 'Data e Perfundimit',
            completed: isCompleted
        };
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
                    <div class="home-panel-scroll home-panel-scroll--jobs">
                        <div class="jobs-grid" id="active-jobs"></div>
                    </div>
                </article>
                <article class="dashboard-panel staff-dashboard-panel">
                    <div class="panel-header">
                        <div>
                            <h2 class="panel-title">Staff</h2>
                            <p class="panel-subtitle">Shikoni anetaret e stafit</p>
                        </div>
                        <button class="panel-link" type="button" data-section="staff"><span>Anetaret e stafit</span>${iconExternal()}</button>
                    </div>
                    <div class="home-panel-scroll home-panel-scroll--staff">
                        <div class="staff-list" id="staff-list"></div>
                    </div>
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

    function normalizeStaffForPanel(member, index, usePreviewFallback = false) {
        const tags = Array.isArray(member.tags) ? member.tags : [];
        const jobs = Array.isArray(member.jobs) ? member.jobs : [];
        const completePreviewStaff = STAFF_REFERENCE_DATA.filter((staff) => {
            return Array.isArray(staff.jobs) && staff.jobs.length > 0;
        });
        const fallbackStaff = completePreviewStaff[index % completePreviewStaff.length] ?? {};
        const fallbackJobs = Array.isArray(fallbackStaff.jobs) ? fallbackStaff.jobs : [];
        const fallbackPositions = Array.isArray(fallbackStaff.positions) ? fallbackStaff.positions : [];
        const previewJobs = jobs.length > 0 || !usePreviewFallback ? jobs : fallbackJobs;
        const previewPositions = Array.isArray(member.positions) && member.positions.length > 0
            ? member.positions
            : (tags.length > 0 || !usePreviewFallback ? tags : fallbackPositions);

        return {
            id: member.id ?? index + 1,
            name: member.name ?? 'Emer Mbiemer',
            code: member.code ?? 'CODE',
            avatarBg: member.avatarBg ?? member.iconBg ?? fallbackStaff.avatarBg ?? '#f7a9ad',
            avatarIcon: member.avatarIcon ?? member.iconColor ?? fallbackStaff.avatarIcon ?? '#8e1e24',
            assignedJobsLabel: member.assignedJobsLabel ?? fallbackStaff.assignedJobsLabel ?? 'Punet e Caktuara',
            jobs: previewJobs,
            jobsInProcess: member.jobsInProcess ?? { count: previewJobs.length, label: 'Pune Ne Proces' },
            positionsLabel: member.positionsLabel ?? fallbackStaff.positionsLabel ?? 'Pozicionet e punes',
            positions: previewPositions
        };
    }

    function getStaffPanelData() {
        const sourceStaff = dashboardData.staff.length > 0 ? dashboardData.staff : STAFF_REFERENCE_DATA;
        const usePreviewFallback = dashboardData.staff.length === 0;

        return {
            title: 'Pjesetaret e stafit',
            filterLabel: 'Filtro',
            viewAllText: 'Te gjithe pjesetaret',
            searchPlaceholder: 'Kerko sherbim me ane te targave ose klientit ...',
            staff: sourceStaff.map((member, index) => normalizeStaffForPanel(member, index, usePreviewFallback))
        };
    }

    function transformStaffDataForDetail(staff) {
        const jobs = Array.isArray(staff.jobs) ? staff.jobs : [];
        const positions = Array.isArray(staff.positions) ? staff.positions : [];
        const jobsInProcess = staff.jobsInProcess ?? { count: jobs.length, label: 'Pune Ne Proces' };

        return {
            id: staff.id,
            name: staff.name,
            code: staff.code,
            avatarBg: staff.avatarBg,
            avatarIcon: staff.avatarIcon,
            sections: {
                assignedJobs: {
                    title: staff.assignedJobsLabel ?? 'Punet e Caktuara',
                    jobs: jobs
                },
                jobsInProcess: {
                    count: jobsInProcess.count,
                    label: jobsInProcess.label
                },
                positions: {
                    title: staff.positionsLabel ?? 'Pozicionet e punes',
                    roles: positions
                }
            }
        };
    }

    function getStaffSearchText(staff) {
        const jobs = Array.isArray(staff.jobs) ? staff.jobs : [];
        const positions = Array.isArray(staff.positions) ? staff.positions : [];

        return [
            staff.name,
            staff.code,
            ...positions,
            ...jobs.flatMap((job) => [job.code, job.client, job.date])
        ].join(' ').toLowerCase();
    }

    function createStaffScrollContainer(container, staffData, callbacks = {}) {
        if (!container) return;

        const staffList = Array.isArray(staffData) ? staffData : [];
        container.innerHTML = '';

        if (staffList.length === 0) {
            renderEmptyState(container, 'Nuk ka staf te regjistruar.');
            return;
        }

        const scrollWrapper = document.createElement('div');
        scrollWrapper.className = 'staff-scroll-wrapper';
        container.appendChild(scrollWrapper);

        staffList.forEach((staff) => {
            const staffCard = document.createElement('article');
            staffCard.className = 'staff-scroll-item';
            staffCard.dataset.searchText = getStaffSearchText(staff);
            staffCard.tabIndex = 0;
            staffCard.setAttribute('role', 'button');
            staffCard.setAttribute('aria-label', `Hap stafin ${staff.name}`);
            scrollWrapper.appendChild(staffCard);

            const transformedData = transformStaffDataForDetail(staff);
            if (typeof window.createStaffMemberDetail === 'function') {
                window.createStaffMemberDetail(staffCard, transformedData, {
                    onJobClick: (job) => {
                        if (typeof callbacks.onJobClick === 'function') {
                            callbacks.onJobClick(job, staff);
                        }
                    },
                    onPositionClick: (position) => {
                        if (typeof callbacks.onPositionClick === 'function') {
                            callbacks.onPositionClick(position, staff);
                        }
                    }
                });
            }

            staffCard.addEventListener('click', (event) => {
                if (event.target.closest('.job-minicard, .staff-member-detail__position')) {
                    return;
                }

                if (typeof callbacks.onStaffClick === 'function') {
                    callbacks.onStaffClick(staff);
                }
            });
            staffCard.addEventListener('keydown', (event) => {
                if (event.target !== staffCard || (event.key !== 'Enter' && event.key !== ' ')) {
                    return;
                }

                event.preventDefault();
                if (typeof callbacks.onStaffClick === 'function') {
                    callbacks.onStaffClick(staff);
                }
            });
        });
    }

    function getDefaultStaffPanelData() {
        const hasBackendStaff = dashboardData.staff.length > 0;
        const staffData = hasBackendStaff ? dashboardData.staff : STAFF_REFERENCE_DATA;

        return staffData.map((member, index) => {
            return normalizeStaffForPanel(member, index, !hasBackendStaff);
        });
    }

    function renderStaffResults(staffData) {
        const normalizedStaff = staffData.map((member, index) => normalizeStaffForPanel(member, index, false));

        createStaffScrollContainer(document.querySelector('#staff-page-list'), normalizedStaff, {
            onSearch: () => {},
            onFilter: () => showToast('Filtro stafin'),
            onStaffClick: (staff) => showToast(`Staff i zgjedhur: ${staff.name}`),
            onJobClick: (job, staff) => showToast(`${job.code} - ${staff.name}`),
            onPositionClick: (position) => showToast(`Pozicioni: ${position}`)
        });

        const count = document.querySelector('[data-staff-visible-count]');
        if (count) {
            count.textContent = `${normalizedStaff.length} pjesetar stafi`;
        }
    }

    function filterStaffPanel(query = '') {
        const searchValue = query.trim();
        clearTimeout(staffSearchTimer);

        if (staffSearchController) {
            staffSearchController.abort();
        }

        if (searchValue.length < 2) {
            renderStaffResults(getDefaultStaffPanelData());
            return;
        }

        staffSearchTimer = setTimeout(async () => {
            staffSearchController = new AbortController();

            try {
                const results = await fetchSearchResults(SEARCH_ENDPOINTS.staff, searchValue, staffSearchController);
                renderStaffResults(results);
            } catch (error) {
                if (error.name !== 'AbortError') {
                    showToast('Kerkimi i stafit deshtoi');
                    console.warn('Staff search failed:', error);
                }
            }
        }, 250);
    }

    function renderStaff() {
        const normalizedStaff = getDefaultStaffPanelData();

        dashboardContent.innerHTML = `
            <section class="dashboard-hero staff-page-hero">
                <div>
                    <h1 class="dashboard-title">Shiko te gjithe pjesetaret e stafit</h1>
                    <p class="dashboard-subtitle">Ketu mund te shikosh dhe menaxhosh te gjithe pjesetaret e stafit</p>
                </div>
            </section>
            <section class="dashboard-panel staff-page-panel" id="staff-page-panel">
                <div class="staff-page-panel__header">
                    <h2 class="panel-title">Pjesetaret e stafit</h2>
                    <div class="staff-page-panel__actions">
                        <button class="staff-page-panel__filter" type="button" data-staff-filter>
                            <span>Filtro</span>
                            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="m7 10 5 5 5-5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                            </svg>
                        </button>
                        <div id="staff-search"></div>
                    </div>
                </div>
                <div class="staff-page-panel__divider">
                    <span>Te gjithe pjesetaret</span>
                </div>
                <div class="staff-page-panel__scroll" id="staff-page-list"></div>
                <p class="staff-page-panel__count" data-staff-visible-count>${normalizedStaff.length} pjesetar stafi</p>
            </section>
        `;

        const searchMount = document.querySelector('#staff-search');
        if (typeof window.createSearchBar === 'function') {
            window.createSearchBar(searchMount, {
                placeholder: 'Kerko sherbim me ane te targave ose klientit ...',
                onSearch: filterStaffPanel
            });
        }

        document.querySelector('[data-staff-filter]').addEventListener('click', () => showToast('Filtro stafin'));

        renderStaffResults(normalizedStaff);
    }

    function createJobsSection(container, title, jobs) {
        const section = document.createElement('section');
        section.className = 'jobs-section';
        section.innerHTML = `
            <div class="jobs-section__divider">
                <span>${title}</span>
            </div>
            <div class="jobs-section__grid"></div>
        `;

        const grid = section.querySelector('.jobs-section__grid');
        jobs.forEach((job) => {
            const card = document.createElement('article');
            card.className = 'job-card jobs-page-card';
            card.dataset.searchText = getJobSearchText(job);
            grid.appendChild(card);
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

        container.appendChild(section);
    }

    function getDefaultJobsPanelData() {
        const sourceJobs = dashboardData.jobs.length > 0 ? dashboardData.jobs : JOBS_REFERENCE_DATA;
        return sourceJobs.map(normalizeJobForPanel);
    }

    function renderJobsResults(jobsData) {
        const jobs = jobsData.map(normalizeJobForPanel);
        const inProcessJobs = jobs.filter((job) => !job.completed);
        const completedJobs = jobs.filter((job) => job.completed);
        const list = document.querySelector('#jobs-page-list');

        list.innerHTML = '';

        if (jobs.length === 0) {
            renderEmptyState(list, 'Nuk ka pune te regjistruara.');
        } else {
            if (inProcessJobs.length > 0) {
                createJobsSection(list, 'Sherbimet ne proces', inProcessJobs);
            }

            if (completedJobs.length > 0) {
                createJobsSection(list, 'Sherbimet e perfunduara', completedJobs);
            }
        }

        const count = document.querySelector('[data-jobs-visible-count]');
        if (count) {
            count.textContent = `${jobs.length} pune ne total`;
        }
    }

    function filterJobsPanel(query = '') {
        const searchValue = query.trim();
        clearTimeout(jobsSearchTimer);

        if (jobsSearchController) {
            jobsSearchController.abort();
        }

        if (searchValue.length < 2) {
            renderJobsResults(getDefaultJobsPanelData());
            return;
        }

        jobsSearchTimer = setTimeout(async () => {
            jobsSearchController = new AbortController();

            try {
                const results = await fetchSearchResults(SEARCH_ENDPOINTS.jobs, searchValue, jobsSearchController);
                renderJobsResults(results);
            } catch (error) {
                if (error.name !== 'AbortError') {
                    showToast('Kerkimi i puneve deshtoi');
                    console.warn('Jobs search failed:', error);
                }
            }
        }, 250);
    }

    function renderJobs() {
        const jobs = getDefaultJobsPanelData();

        dashboardContent.innerHTML = `
            <section class="dashboard-hero jobs-page-hero">
                <div>
                    <h1 class="dashboard-title">Shiko te gjitha punet</h1>
                    <p class="dashboard-subtitle">Ne kete seksion mund te shikoni te gjitha punet dhe statusin e tyre.</p>
                </div>
            </section>
            <section class="dashboard-panel jobs-page-panel">
                <div class="jobs-page-panel__header">
                    <h2 class="panel-title">Sherbimet E Servisit</h2>
                    <div id="jobs-search"></div>
                </div>
                <div class="jobs-page-panel__scroll" id="jobs-page-list"></div>
                <p class="jobs-page-panel__count" data-jobs-visible-count>${jobs.length} pune ne total</p>
            </section>
        `;

        const searchMount = document.querySelector('#jobs-search');
        if (typeof window.createSearchBar === 'function') {
            window.createSearchBar(searchMount, {
                placeholder: 'Kerko sherbim me ane te targave ose klientit ...',
                onSearch: filterJobsPanel
            });
        }

        renderJobsResults(jobs);
    }

    function getClientCode(client, index) {
        const source = (client.name ?? 'KL').replace(/[^a-zA-Z]/g, '').toUpperCase();
        const letters = `${source.slice(0, 2)}KL`.slice(0, 2);
        return client.code ?? `${letters}${String((client.id ?? index + 1) % 1000).padStart(2, '0')}`;
    }

    function normalizeClientForPanel(client, index) {
        const firstName = client.first_name ?? '';
        const lastName = client.last_name ?? '';
        const name = client.name ?? `${firstName} ${lastName}`.trim();

        return {
            id: client.id ?? client.user_id ?? index + 1,
            name: name || 'Klient',
            code: getClientCode({ ...client, name }, index),
            phone: client.phone ?? client.phone_number ?? '',
            email: client.email ?? '',
            detail: client.detail ?? ''
        };
    }

    function getDefaultClientsPanelData() {
        return dashboardData.clients.map(normalizeClientForPanel);
    }

    function createClientsGrid(container, clientsData) {
        if (!container) return;

        const clients = Array.isArray(clientsData) ? clientsData : [];
        container.innerHTML = '';

        if (clients.length === 0) {
            renderEmptyState(container, 'Nuk ka kliente te regjistruar.');
            return;
        }

        const grid = document.createElement('div');
        grid.className = 'clients-page-grid';
        container.appendChild(grid);

        clients.forEach((client) => {
            const card = document.createElement('article');
            grid.appendChild(card);

            if (typeof window.createClientMiniCard === 'function') {
                window.createClientMiniCard(card, client, () => showToast(`Klient i zgjedhur: ${client.name}`));
            }
        });
    }

    function renderClientsResults(clientsData) {
        const normalizedClients = clientsData.map(normalizeClientForPanel);
        createClientsGrid(document.querySelector('#clients-page-list'), normalizedClients);

        const count = document.querySelector('[data-clients-visible-count]');
        if (count) {
            count.textContent = `${normalizedClients.length} kliente ne total`;
        }
    }

    function filterClientsPanel(query = '') {
        const searchValue = query.trim();
        clearTimeout(clientsSearchTimer);

        if (clientsSearchController) {
            clientsSearchController.abort();
        }

        if (searchValue.length < 2) {
            renderClientsResults(getDefaultClientsPanelData());
            return;
        }

        clientsSearchTimer = setTimeout(async () => {
            clientsSearchController = new AbortController();

            try {
                const results = await fetchSearchResults(SEARCH_ENDPOINTS.clients, searchValue, clientsSearchController);
                renderClientsResults(results);
            } catch (error) {
                if (error.name !== 'AbortError') {
                    showToast('Kerkimi i klienteve deshtoi');
                    console.warn('Clients search failed:', error);
                }
            }
        }, 250);
    }

    function renderClients() {
        const clients = getDefaultClientsPanelData();

        dashboardContent.innerHTML = `
            <section class="dashboard-hero clients-page-hero">
                <div>
                    <h1 class="dashboard-title">Shiko te gjithe klientet</h1>
                    <p class="dashboard-subtitle">Ketu mund te shikosh dhe menaxhosh te gjithe klientet e regjistruar ne sistem</p>
                </div>
            </section>
            <section class="dashboard-panel clients-page-panel">
                <div class="clients-page-panel__header">
                    <h2 class="panel-title">Te gjithe klientet tane</h2>
                    <div id="clients-search"></div>
                </div>
                <div class="clients-page-panel__divider">
                    <span>Te gjithe pjesetaret</span>
                </div>
                <div class="clients-page-panel__scroll" id="clients-page-list"></div>
                <p class="clients-page-panel__count" data-clients-visible-count>${clients.length} kliente ne total</p>
            </section>
        `;

        const searchMount = document.querySelector('#clients-search');
        if (typeof window.createSearchBar === 'function') {
            window.createSearchBar(searchMount, {
                placeholder: 'Kerko kliente sipas numrit te telefonit',
                onSearch: filterClientsPanel
            });
        }

        renderClientsResults(clients);
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

        if (item.id === 'staff') {
            renderStaff();
            return;
        }

        if (item.id === 'jobs') {
            renderJobs();
            return;
        }

        if (item.id === 'clients') {
            renderClients();
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
