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

    function normalizeStaff(job) {
        if (Array.isArray(job.staff)) {
            return job.staff;
        }

        if (Array.isArray(job.mechanics)) {
            return job.mechanics;
        }

        return [job.staff1, job.staff2, job.mechanic1, job.mechanic2].filter(Boolean);
    }

    function renderJobIcon() {
        return `
            <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
                <path d="M9 22.5c0-4 3.2-7.2 7.2-7.2h10.4c2 0 3.9.8 5.2 2.3l3 3.2h13c4 0 7.2 3.2 7.2 7.2v19.5H9v-25z" fill="#242424"></path>
                <path d="M9 29.5h46v18H9v-18z" fill="#303030"></path>
                <path d="M9 29.5h46v7H9v-7z" fill="#555555"></path>
                <path d="M9 29.5h46" stroke="#6f6f6f" stroke-width="2"></path>
            </svg>
        `;
    }

    function jobMatchesQuery(job, query) {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) {
            return true;
        }

        const searchable = [
            job.code,
            job.client,
            job.endDate,
            job.date,
            ...normalizeStaff(job)
        ].join(' ').toLowerCase();

        return searchable.includes(normalizedQuery);
    }

    function createFullActiveJobCard(container, job = {}, options = {}) {
        if (!container) {
            return null;
        }

        const staff = normalizeStaff(job);
        const code = job.code ?? '';
        const client = job.client ?? '';
        const status = job.status ?? options.status ?? 'Aktiv';
        const endDate = job.endDate ?? job.date ?? '';

        container.classList.add('fajp-card');
        container.dataset.jobId = job.id ?? '';
        container.setAttribute('role', 'button');
        container.setAttribute('tabindex', '0');
        container.setAttribute('aria-label', `${code} ${client}`.trim());
        container.innerHTML = `
            <div class="fajp-card__top">
                <div class="fajp-card__identity">
                    <span class="fajp-card__icon" aria-hidden="true">${renderJobIcon()}</span>
                    <div>
                        <h3 class="fajp-card__code">${escapeHTML(code)}</h3>
                        <p class="fajp-card__client">${escapeHTML(client)}</p>
                    </div>
                </div>
                ${status ? `
                    <span class="fajp-card__status" aria-label="Status: ${escapeHTML(status)}">
                        <span class="fajp-card__status-dot" aria-hidden="true"></span>
                        <span>${escapeHTML(status)}</span>
                    </span>
                ` : ''}
            </div>
            <div class="fajp-card__content">
                <p class="fajp-card__label">${escapeHTML(options.staffLabel ?? 'Staff')}</p>
                <div class="fajp-card__staff">
                    ${staff.map((member) => `<p class="fajp-card__staff-member">${escapeHTML(member)}</p>`).join('')}
                </div>
                <p class="fajp-card__label fajp-card__date-label">${escapeHTML(options.dateLabel ?? 'Data e Përfundimit')}</p>
                <p class="fajp-card__date">${escapeHTML(endDate)}</p>
            </div>
        `;

        function selectJob() {
            container.dispatchEvent(new CustomEvent('fajp:job-select', {
                bubbles: true,
                detail: { job }
            }));

            if (typeof options.onJobClick === 'function') {
                options.onJobClick(job);
            }
        }

        container.onclick = selectJob;
        container.onkeydown = (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                selectJob();
            }
        };

        return container;
    }

    function createFullActiveJobPanel(container, data = {}) {
        if (!container) {
            return null;
        }

        const jobs = Array.isArray(data.jobs) ? data.jobs : [];
        let query = '';

        container.classList.add('fajp');
        container.innerHTML = `
            <div class="fajp__header">
                <div class="fajp__header-row">
                    <h2 class="fajp__title">${escapeHTML(data.title ?? 'Punë Aktive të Lidhura me Ju')}</h2>
                    <label class="fajp__search">
                        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="m21 21-4.35-4.35M10.8 18.1a7.3 7.3 0 1 1 0-14.6 7.3 7.3 0 0 1 0 14.6z" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"></path>
                        </svg>
                        <input class="fajp__search-input" type="search" placeholder="${escapeHTML(data.searchPlaceholder ?? 'Kërko me targë ose emër klienti...')}" aria-label="${escapeHTML(data.searchLabel ?? 'Kërko punë aktive')}">
                    </label>
                </div>
                <div class="fajp__divider" aria-hidden="true"></div>
            </div>
            <div class="fajp__scroll">
                <div class="fajp__grid"></div>
            </div>
            <p class="fajp__footer" aria-live="polite"></p>
        `;

        const grid = container.querySelector('.fajp__grid');
        const input = container.querySelector('.fajp__search-input');
        const footer = container.querySelector('.fajp__footer');

        function render() {
            const filteredJobs = jobs.filter((job) => jobMatchesQuery(job, query));
            grid.innerHTML = '';

            if (filteredJobs.length === 0) {
                grid.innerHTML = `<div class="fajp__empty">${escapeHTML(data.emptyText ?? 'Nuk u gjet asnjë punë aktive')}</div>`;
            } else {
                filteredJobs.forEach((job) => {
                    const card = document.createElement('article');
                    grid.appendChild(card);
                    createFullActiveJobCard(card, job, {
                        status: data.status,
                        staffLabel: data.staffLabel,
                        dateLabel: data.dateLabel,
                        onJobClick: data.onJobClick
                    });
                });
            }

            const totalText = data.totalText
                ?? `${filteredJobs.length} ${filteredJobs.length === 1 ? 'punë' : 'punë'} në total`;
            footer.textContent = totalText;

            container.dispatchEvent(new CustomEvent('fajp:filter', {
                bubbles: true,
                detail: { query, jobs: filteredJobs }
            }));
        }

        input.addEventListener('input', () => {
            query = input.value;
            render();
        });

        render();

        return {
            render,
            setQuery(value) {
                query = String(value ?? '');
                input.value = query;
                render();
            },
            getQuery() {
                return query;
            },
            getJobs() {
                return jobs.slice();
            }
        };
    }

    window.createFullActiveJobCard = createFullActiveJobCard;
    window.createFullActiveJobPanel = createFullActiveJobPanel;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            createFullActiveJobCard,
            createFullActiveJobPanel
        };
    }
}());
