(function () {
    const SEARCH_ENDPOINT = '../api/search_staff.php';
    let allStaff = [];
    let visibleStaff = [];
    let activeFilter = 'all';
    let searchTimer = null;
    let controller = null;

    function staffForDetail(member) {
        const staff = AdminPages.normalizeStaff(member);
        const jobs = Array.isArray(staff.jobs) ? staff.jobs : [];

        return {
            id: staff.id,
            name: staff.name,
            code: staff.code,
            avatarBg: staff.avatarBg ?? staff.iconBg ?? '#f7a9ad',
            avatarIcon: staff.avatarIcon ?? staff.iconColor ?? '#8e1e24',
            sections: {
                assignedJobs: {
                    title: staff.assignedJobsLabel ?? 'Punet e Caktuara',
                    jobs
                },
                jobsInProcess: {
                    count: staff.jobsInProcess?.count ?? jobs.length,
                    label: staff.jobsInProcess?.label ?? 'Pune Ne Proces'
                },
                positions: {
                    title: staff.positionsLabel ?? 'Pozicionet e punes',
                    roles: Array.isArray(staff.positions) ? staff.positions : staff.tags
                }
            }
        };
    }

    function getActiveJobCount(member) {
        const jobs = Array.isArray(member.jobs) ? member.jobs : [];
        return member.jobsInProcess?.count ?? jobs.length;
    }

    function filterStaff(staff) {
        if (activeFilter === 'free') {
            return staff.filter((member) => getActiveJobCount(member) === 0);
        }

        if (activeFilter === 'busy') {
            return staff.filter((member) => getActiveJobCount(member) > 0);
        }

        return staff;
    }

    function getEmptyMessage() {
        if (activeFilter === 'free') {
            return 'Nuk ka staf te lire.';
        }

        if (activeFilter === 'busy') {
            return 'Nuk ka staf me pune aktive.';
        }

        return 'Nuk ka staf te regjistruar.';
    }

    function updateFilterLabel() {
        const label = document.querySelector('[data-staff-filter-label]');

        if (!label) return;

        const labels = {
            all: 'Te gjithe pjesetaret',
            free: 'Pjesetaret e lire',
            busy: 'Pjesetaret me pune aktive'
        };

        label.textContent = labels[activeFilter] ?? labels.all;
    }

    function renderStaff(staff) {
        const container = document.querySelector('#staff-page-list');
        const filteredStaff = filterStaff(staff);
        const normalizedStaff = filteredStaff.map(staffForDetail);

        container.innerHTML = '';
        updateFilterLabel();

        if (normalizedStaff.length === 0) {
            AdminPages.renderEmpty(container, getEmptyMessage());
        } else {
            const wrapper = document.createElement('div');
            wrapper.className = 'staff-scroll-wrapper';
            container.appendChild(wrapper);

            normalizedStaff.forEach((member) => {
                const card = document.createElement('article');
                card.className = 'staff-scroll-item';
                card.tabIndex = 0;
                card.setAttribute('role', 'button');
                card.setAttribute('aria-label', `Hap stafin ${member.name}`);
                card.addEventListener('click', (event) => {
                    if (event.target.closest('.job-minicard, .staff-member-detail__position')) {
                        return;
                    }

                    window.location.href = `staff-details.html?staff_id=${encodeURIComponent(member.id)}`;
                });
                card.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        card.click();
                    }
                });
                wrapper.appendChild(card);
                createStaffMemberDetail(card, member, {
                    onJobClick: (job) => {
                        window.location.href = `job-details.html?job_id=${encodeURIComponent(job.id)}`;
                    }
                });
            });
        }

        document.querySelector('[data-staff-count]').textContent = `${normalizedStaff.length} pjesetar stafi`;
    }

    function setActiveFilter(nextFilter) {
        activeFilter = nextFilter;

        document.querySelectorAll('[data-staff-filter]').forEach((button) => {
            const isActive = button.dataset.staffFilter === activeFilter;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
        });

        renderStaff(visibleStaff);
    }

    function bindStaffFilters() {
        document.querySelectorAll('[data-staff-filter]').forEach((button) => {
            button.setAttribute('aria-pressed', String(button.dataset.staffFilter === activeFilter));
            button.addEventListener('click', () => setActiveFilter(button.dataset.staffFilter));
        });
    }

    async function searchStaff(query) {
        const value = query.trim();
        clearTimeout(searchTimer);

        if (controller) {
            controller.abort();
        }

        if (value.length < 2) {
            visibleStaff = allStaff;
            renderStaff(visibleStaff);
            return;
        }

        searchTimer = setTimeout(async () => {
            controller = new AbortController();

            try {
                const response = await fetch(`${SEARCH_ENDPOINT}?q=${encodeURIComponent(value)}`, {
                    headers: { Accept: 'application/json' },
                    credentials: 'same-origin',
                    signal: controller.signal
                });

                if (!response.ok) throw new Error(`Search failed with ${response.status}`);
                visibleStaff = await response.json();
                renderStaff(visibleStaff);
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.warn('Staff search failed:', error);
                    AdminPages.showToast('Kerkimi i stafit deshtoi');
                }
            }
        }, 250);
    }

    AdminPages.loadPage((data) => {
        allStaff = Array.isArray(data.staff) ? data.staff : [];
        visibleStaff = allStaff;

        createSearchBar(document.querySelector('#staff-search'), {
            placeholder: 'Kerko sipas stafit, targes ose klientit',
            onSearch: searchStaff
        });

        bindStaffFilters();
        renderStaff(visibleStaff);
    });
}());
