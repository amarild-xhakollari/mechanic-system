(function () {
    const STAFF_ICON_SRC = '../../images/default-icons/staff-icon.png';

    function escapeHTML(value) {
        return String(value ?? '').replace(/[&<>"']/g, (character) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[character]));
    }

    function getSections(data) {
        const sections = data.sections ?? {};

        return {
            assignedJobs: {
                title: sections.assignedJobs?.title ?? 'Punet e caktuara',
                jobs: Array.isArray(sections.assignedJobs?.jobs) ? sections.assignedJobs.jobs : []
            },
            jobsInProcess: {
                count: sections.jobsInProcess?.count ?? sections.assignedJobs?.jobs?.length ?? 0,
                label: sections.jobsInProcess?.label ?? 'Pune ne proces'
            },
            positions: {
                title: sections.positions?.title ?? 'Pozicionet e punes',
                roles: Array.isArray(sections.positions?.roles) ? sections.positions.roles : []
            }
        };
    }

    function createMiniCard(container, job, callbacks = {}) {
        if (typeof window.createJobMiniCard !== 'function') {
            container.innerHTML = '<div class="staff-member-detail__jobs-empty">job_minicard component is not loaded</div>';
            return null;
        }

        return window.createJobMiniCard(container, job, (jobData) => {
            if (typeof callbacks.onJobClick === 'function') {
                callbacks.onJobClick(jobData);
            }
        });
    }

    function updateStatusCount(container, nextCount) {
        const statusText = container.querySelector('.staff-member-detail__status-text');
        if (!statusText) {
            return;
        }

        const label = statusText.dataset.label ?? '';
        statusText.dataset.count = String(nextCount);
        statusText.textContent = `${nextCount} ${label}`.trim();
    }

    /**
     * Creates a staff member detail component and renders job_minicard as a child component.
     * @param {HTMLElement} container - The container element.
     * @param {Object} data - Staff member data.
     * @param {Object} callbacks - Callback functions.
     */
    function createStaffMemberDetail(container, data = {}, callbacks = {}) {
        if (!container) {
            return null;
        }

        const sections = getSections(data);
        const jobsHTML = sections.assignedJobs.jobs.length > 0
            ? '<div class="staff-member-detail__jobs-grid" data-jobs-container></div>'
            : '<div class="staff-member-detail__jobs-empty">Nuk ka pune te caktuara</div>';

        const positionsHTML = sections.positions.roles.map((role, index) => `
            <button class="staff-member-detail__position" type="button" data-position-index="${index}">
                ${escapeHTML(role)}
            </button>
        `).join('');

        container.classList.add('staff-member-detail');
        container.dataset.staffId = data.id ?? '';
        container.innerHTML = `
            <div class="staff-member-detail__header">
                <div class="staff-member-detail__avatar" style="background-color: ${escapeHTML(data.avatarBg ?? '#f4b4b4')};">
                    <img src="${STAFF_ICON_SRC}" alt="" aria-hidden="true">
                </div>
                <div class="staff-member-detail__info">
                    <div class="staff-member-detail__name">${escapeHTML(data.name ?? '')}</div>
                    <div class="staff-member-detail__code">${escapeHTML(data.code ?? '')}</div>
                </div>
            </div>

            <div class="staff-member-detail__section">
                <h3 class="staff-member-detail__section-title">${escapeHTML(sections.assignedJobs.title)}</h3>
                ${jobsHTML}
                <div class="staff-member-detail__status">
                    <div class="staff-member-detail__status-text" data-count="${sections.jobsInProcess.count}" data-label="${escapeHTML(sections.jobsInProcess.label)}">
                        ${escapeHTML(`${sections.jobsInProcess.count} ${sections.jobsInProcess.label}`)}
                    </div>
                </div>
            </div>

            <div class="staff-member-detail__section">
                <h3 class="staff-member-detail__section-title">${escapeHTML(sections.positions.title)}</h3>
                <div class="staff-member-detail__positions">
                    ${positionsHTML}
                </div>
            </div>
        `;

        const jobsContainer = container.querySelector('[data-jobs-container]');
        if (jobsContainer) {
            sections.assignedJobs.jobs.forEach((job) => {
                const jobCardEl = document.createElement('article');
                jobsContainer.appendChild(jobCardEl);
                createMiniCard(jobCardEl, job, callbacks);
            });
        }

        container.querySelectorAll('.staff-member-detail__position').forEach((button) => {
            button.onclick = () => {
                const position = sections.positions.roles[Number(button.dataset.positionIndex)];
                if (typeof callbacks.onPositionClick === 'function') {
                    callbacks.onPositionClick(position);
                }
            };
        });

        return container;
    }

    function updateStaffMemberDetail(container, newData, callbacks = {}) {
        return createStaffMemberDetail(container, newData, callbacks);
    }

    function setStaffMemberLoading(container, isLoading) {
        container.classList.toggle('staff-member-detail--loading', Boolean(isLoading));
    }

    function addJobToStaffMember(container, jobData, onJobClick) {
        let jobsContainer = container.querySelector('[data-jobs-container]');

        if (!jobsContainer) {
            const emptyState = container.querySelector('.staff-member-detail__jobs-empty');
            if (emptyState) {
                emptyState.outerHTML = '<div class="staff-member-detail__jobs-grid" data-jobs-container></div>';
                jobsContainer = container.querySelector('[data-jobs-container]');
            }
        }

        if (!jobsContainer) {
            return null;
        }

        const jobCardEl = document.createElement('article');
        jobsContainer.appendChild(jobCardEl);
        createMiniCard(jobCardEl, jobData, { onJobClick });

        const currentCount = Number(container.querySelector('.staff-member-detail__status-text')?.dataset.count ?? 0);
        updateStatusCount(container, currentCount + 1);
        return jobCardEl;
    }

    function removeJobFromStaffMember(container, jobId) {
        const jobsContainer = container.querySelector('[data-jobs-container]');
        if (!jobsContainer) {
            return;
        }

        jobsContainer.querySelectorAll('.job-minicard').forEach((card) => {
            if (String(card.dataset.jobId) === String(jobId)) {
                card.remove();
            }
        });

        const currentCount = Number(container.querySelector('.staff-member-detail__status-text')?.dataset.count ?? 0);
        updateStatusCount(container, Math.max(0, currentCount - 1));

        if (jobsContainer.children.length === 0) {
            jobsContainer.outerHTML = '<div class="staff-member-detail__jobs-empty">Nuk ka pune te caktuara</div>';
            updateStatusCount(container, 0);
        }
    }

    window.createStaffMemberDetail = createStaffMemberDetail;
    window.updateStaffMemberDetail = updateStaffMemberDetail;
    window.setStaffMemberLoading = setStaffMemberLoading;
    window.addJobToStaffMember = addJobToStaffMember;
    window.removeJobFromStaffMember = removeJobFromStaffMember;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            createStaffMemberDetail,
            updateStaffMemberDetail,
            setStaffMemberLoading,
            addJobToStaffMember,
            removeJobFromStaffMember
        };
    }
}());
