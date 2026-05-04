(function () {
    const SEARCH_ENDPOINT = '../api/search_staff.php';
    let allStaff = [];
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

    function renderStaff(staff) {
        const container = document.querySelector('#staff-page-list');
        const normalizedStaff = staff.map(staffForDetail);

        container.innerHTML = '';

        if (normalizedStaff.length === 0) {
            AdminPages.renderEmpty(container, 'Nuk ka staf te regjistruar.');
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
                    },
                    onPositionClick: (position) => AdminPages.showToast(`Pozicioni: ${position}`)
                });
            });
        }

        document.querySelector('[data-staff-count]').textContent = `${normalizedStaff.length} pjesetar stafi`;
    }

    async function searchStaff(query) {
        const value = query.trim();
        clearTimeout(searchTimer);

        if (controller) {
            controller.abort();
        }

        if (value.length < 2) {
            renderStaff(allStaff);
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
                renderStaff(await response.json());
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

        createSearchBar(document.querySelector('#staff-search'), {
            placeholder: 'Kerko sherbim me ane te targave ose klientit ...',
            onSearch: searchStaff
        });

        document.querySelector('[data-staff-filter]').addEventListener('click', () => {
            AdminPages.showToast('Filtro stafin');
        });

        renderStaff(allStaff);
    });
}());
