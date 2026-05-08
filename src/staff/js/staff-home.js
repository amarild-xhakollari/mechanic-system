(function () {
    StaffPages.bindLogout();
    StaffPages.bindProfileDropdown();

    function renderHomePanels(data) {
        createStaffHomePanel(document.querySelector('#home-active-jobs-panel'), {
            type: 'jobs',
            title: 'Pune Aktive',
            href: 'staff-active-jobs.html',
            linkText: 'Shiko te gjitha punet',
            emptyText: 'Nuk ka pune aktive.',
            items: data.activeJobs
        });

        createStaffHomePanel(document.querySelector('#home-clients-panel'), {
            type: 'clients',
            title: 'Klientet',
            href: 'staff-clients.html',
            linkText: 'Klientet e puneve',
            emptyText: 'Nuk ka kliente per punet aktive.',
            items: data.clients
        });
    }

    function renderProfileSummary(container, data) {
        if (!container || typeof window.createUserStaffHorizontalCard !== 'function') {
            return;
        }

        createUserStaffHorizontalCard(container, {
            name: data.user?.name,
            roles: [data.user?.code || 'Staff'],
            activeJobs: data.activeJobs.length,
            totalJobs: data.jobs.length,
            profileHref: 'staff-clients.html'
        });
    }

    async function initPage() {
        const data = await StaffPages.loadData();

        StaffPages.fillUser(data.user);

        renderHomePanels(data);
        renderProfileSummary(document.querySelector('#staff-profile-summary'), data);
    }

    initPage().catch((error) => console.warn('Staff home could not load:', error));
}());
