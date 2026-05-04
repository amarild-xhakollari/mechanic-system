(function () {
    function escapeHTML(value) {
        return String(value ?? '').replace(/[&<>"']/g, (character) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[character]));
    }

    function normalizeStaffMember(staff = {}) {
        const jobs = Array.isArray(staff.jobs) ? staff.jobs : [];
        const positions = Array.isArray(staff.positions)
            ? staff.positions
            : (Array.isArray(staff.tags) ? staff.tags : []);

        return {
            id: staff.id ?? '',
            name: staff.name ?? '',
            code: staff.code ?? '',
            avatarBg: staff.avatarBg ?? staff.iconBg ?? '#f4b4b4',
            avatarIcon: staff.avatarIcon ?? staff.iconColor ?? '#8b2e2e',
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
                    roles: positions
                }
            }
        };
    }

    function getSearchText(staff) {
        return [
            staff.name,
            staff.code,
            ...staff.sections.positions.roles,
            ...staff.sections.assignedJobs.jobs.flatMap((job) => [job.code, job.client, job.date])
        ].join(' ').toLowerCase();
    }

    function createCompleteStaffGrid(container, data = {}, callbacks = {}) {
        if (!container) {
            return null;
        }

        const staff = Array.isArray(data.staff) ? data.staff.map(normalizeStaffMember) : [];

        container.innerHTML = `
            <section class="complete-staff-grid" aria-label="${escapeHTML(data.title ?? 'Pjesetaret e stafit')}">
                <div class="complete-staff-grid__header">
                    <h2 class="complete-staff-grid__title">${escapeHTML(data.title ?? 'Pjesetaret e stafit')}</h2>
                    <div class="complete-staff-grid__header-actions">
                        <button class="complete-staff-grid__filter" type="button" data-filter-button>
                            <span>${escapeHTML(data.filterLabel ?? 'Filtro')}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                            </svg>
                        </button>
                        <label class="complete-staff-grid__search">
                            <svg class="complete-staff-grid__search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5Zm-6 0A4.5 4.5 0 1 1 9.5 5a4.5 4.5 0 0 1 0 9Z"/>
                            </svg>
                            <input type="text" class="complete-staff-grid__search-input" placeholder="${escapeHTML(data.searchPlaceholder ?? 'Kerko sherbim me ane te targave ose klientit ...')}" data-search-input>
                        </label>
                    </div>
                </div>

                <div class="complete-staff-grid__divider">
                    <span>${escapeHTML(data.viewAllText ?? 'Te gjithe pjesetaret')}</span>
                </div>

                <div class="complete-staff-grid__scroll" data-staff-scroll>
                    <div class="complete-staff-grid__grid" data-staff-grid></div>
                </div>
                <p class="complete-staff-grid__count" data-visible-count>${staff.length} pjesetar stafi</p>
            </section>
        `;

        const staffGridEl = container.querySelector('[data-staff-grid]');
        staff.forEach((member) => {
            staffGridEl.appendChild(createStaffCardElement(member, callbacks));
        });

        setupCompleteStaffGridListeners(container, staff, callbacks);
        return container;
    }

    function createStaffCardElement(staff, callbacks = {}) {
        const card = document.createElement('article');
        card.className = 'staff-panel__jobcard';
        card.classList.toggle(
            'staff-panel__jobcard--compact',
            staff.sections.assignedJobs.jobs.length === 0 && staff.sections.positions.roles.length === 0
        );
        card.dataset.staffId = staff.id;
        card.dataset.searchText = getSearchText(staff);

        if (typeof window.createStaffMemberDetail === 'function') {
            window.createStaffMemberDetail(card, staff, {
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

        card.addEventListener('click', (event) => {
            if (event.target.closest('.job-minicard, .staff-member-detail__position')) {
                return;
            }

            if (typeof callbacks.onStaffClick === 'function') {
                callbacks.onStaffClick(staff);
            }
        });

        return card;
    }

    function setupCompleteStaffGridListeners(container, staff, callbacks = {}) {
        const searchInput = container.querySelector('[data-search-input]');
        const filterButton = container.querySelector('[data-filter-button]');

        if (searchInput) {
            searchInput.addEventListener('input', (event) => {
                if (typeof callbacks.onSearch === 'function') {
                    callbacks.onSearch(event.target.value);
                }
                filterCompleteStaffCards(container, event.target.value);
            });
        }

        if (filterButton) {
            filterButton.addEventListener('click', () => {
                if (typeof callbacks.onFilter === 'function') {
                    callbacks.onFilter(staff);
                }
            });
        }
    }

    function filterCompleteStaffCards(container, query = '') {
        const cards = container.querySelectorAll('.staff-panel__jobcard');
        const searchLower = query.toLowerCase().trim();
        let visibleCount = 0;

        cards.forEach((card) => {
            const isVisible = !searchLower || card.dataset.searchText.includes(searchLower);
            card.hidden = !isVisible;
            if (isVisible) {
                visibleCount += 1;
            }
        });

        const count = container.querySelector('[data-visible-count]');
        if (count) {
            count.textContent = `${visibleCount} pjesetar stafi`;
        }
    }

    function refreshCompleteStaffGrid(container, newData, callbacks = {}) {
        return createCompleteStaffGrid(container, newData, callbacks);
    }

    function getVisibleStaffCount(container) {
        return Array.from(container.querySelectorAll('.staff-panel__jobcard')).filter((card) => !card.hidden).length;
    }

    window.createCompleteStaffGrid = createCompleteStaffGrid;
    window.refreshCompleteStaffGrid = refreshCompleteStaffGrid;
    window.getVisibleStaffCount = getVisibleStaffCount;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            createCompleteStaffGrid,
            refreshCompleteStaffGrid,
            getVisibleStaffCount
        };
    }
}());
